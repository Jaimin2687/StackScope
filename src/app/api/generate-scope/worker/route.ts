import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transcribeAudioWithGroq } from "@/lib/transcribe";
import { generateScopeWithFailover } from "@/lib/llm";
import { getCurrentUsagePeriod, getOrCreateBillingSnapshot, getTierLimits } from "@/lib/billing";
import { parseGitHubRepoFromText, selectConfigCandidates, trimGitTreePayload } from "@/lib/github-context";
import { verifyQstashSignature } from "@/lib/qstash-signature";

export const maxDuration = 300;

type ScopeJobPayload = {
  target_language?: string;
  brief?: string | null;
  is_migration?: boolean;
  audio_path?: string | null;
  audio_name?: string | null;
  audio_content_type?: string | null;
};

const CONFIG_FILES = [
  "pom.xml", "build.gradle", "build.gradle.kts",
  "backend/pom.xml", "server/pom.xml",
  "package.json", "frontend/package.json", "backend/package.json", "server/package.json",
  "requirements.txt", "pyproject.toml", "setup.py", "Pipfile",
  "composer.json", "CMakeLists.txt", "Makefile",
  "go.mod", "go.sum", "Cargo.toml", "Gemfile",
  "mix.exs", "rebar.config", "project.clj", "Package.swift",
  "pubspec.yaml", "docker-compose.yml", "docker-compose.yaml", "Dockerfile",
];

function buildFallbackTranscriptFromFile(file: File): string {
  const safeName = file.name?.replace(/\.[^.]+$/, "") || "audio-brief";
  const sizeMb = (file.size / 1024 / 1024).toFixed(2);
  return [
    `Audio brief received: "${safeName}".`,
    `File type: ${file.type || "unknown"}. Size: ${sizeMb} MB.`,
    "The spoken brief could not be transcribed reliably.",
    "Generate a complete technical scope anyway by making industry-standard assumptions.",
  ].join("\n");
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function downloadAudioFile(
  admin: ReturnType<typeof createAdminClient>,
  payload: ScopeJobPayload
) {
  if (!payload.audio_path) return null;
  const { data, error } = await admin.storage.from("scope-audio").download(payload.audio_path);
  if (error || !data) {
    throw new Error("Failed to download audio");
  }
  const buffer = await data.arrayBuffer();
  return new File([buffer], payload.audio_name || "audio-brief", {
    type: payload.audio_content_type || "application/octet-stream",
  });
}

async function buildRepoContext(
  inputText: string,
  tierLimits: ReturnType<typeof getTierLimits>
): Promise<{ appendedText: string; filesFound: number }> {
  const repoInfo = parseGitHubRepoFromText(inputText);
  if (!repoInfo) return { appendedText: "", filesFound: 0 };

  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "StackScope-Repo-Analyzer",
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  let scrapedContext = "\n\nAnalyze the following repository files to determine the CURRENT tech stack and entities.\nDO NOT GUESS. Read the dependencies explicitly.\n\n";
  let filesFound = 0;

  const fetchResults = await Promise.allSettled(
    CONFIG_FILES.map(async (fileName) => {
      const res = await fetchWithTimeout(
        `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${fileName}`,
        { headers },
        8000
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (data.content && data.encoding === "base64") {
        const decoded = Buffer.from(data.content, "base64").toString("utf-8");
        return { fileName, decoded };
      }
      return null;
    })
  );

  for (const result of fetchResults) {
    if (result.status === "fulfilled" && result.value) {
      const { fileName, decoded } = result.value;
      scrapedContext += `--- RAW REPOSITORY FILE (${fileName}) ---\n${decoded.substring(0, 3500)}\n--- END FILE ---\n\n`;
      filesFound++;
    }
  }

  if (filesFound === 0) {
    const repoMeta = await fetchWithTimeout(
      `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`,
      { headers },
      8000
    );

    if (!repoMeta.ok) {
      return { appendedText: "", filesFound: 0 };
    }

    const repoJson = await repoMeta.json();
    const defaultBranch = repoJson.default_branch || "main";

    const treeRes = await fetchWithTimeout(
      `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers },
      10000
    );

    if (!treeRes.ok) {
      return { appendedText: "", filesFound: 0 };
    }

    const treeJson = await treeRes.json();
    const rawItems = Array.isArray(treeJson.tree) ? treeJson.tree : [];
    const trimmed = trimGitTreePayload(rawItems, tierLimits);

    console.log("[generate-scope] Repo tree size", {
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      rawItems: rawItems.length,
      rawEstimatedTokens: trimmed.rawEstimatedTokens,
      estimatedTokens: trimmed.estimatedTokens,
      trimmed: trimmed.trimmed,
      droppedCount: trimmed.droppedCount,
      limits: tierLimits,
    });

    if (trimmed.estimatedTokens > tierLimits.maxTreeTokens) {
      throw new Error("Repository tree is too large for your tier");
    }

    const candidates = selectConfigCandidates(trimmed.items).sort(
      (a, b) => a.path.length - b.path.length
    );

    const topCandidates = candidates.slice(0, 8);

    const treeResults = await Promise.allSettled(
      topCandidates.map(async (c) => {
        const fileRes = await fetchWithTimeout(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${encodeURIComponent(
            c.path
          )}`,
          { headers },
          8000
        );
        if (!fileRes.ok) return null;
        const data = await fileRes.json();
        if (data.content && data.encoding === "base64") {
          const decoded = Buffer.from(data.content, "base64").toString("utf-8");
          return { path: c.path, decoded };
        }
        return null;
      })
    );

    for (const result of treeResults) {
      if (result.status === "fulfilled" && result.value) {
        const { path, decoded } = result.value;
        scrapedContext += `--- RAW REPOSITORY FILE (${path}) ---\n${decoded.substring(0, 3500)}\n--- END FILE ---\n\n`;
        filesFound++;
      }
    }
  }

  if (filesFound > 0) {
    scrapedContext +=
      "EXTREMELY IMPORTANT MIGRATION DIRECTIVE:\n" +
      "Based strictly on the codebase files provided above, you MUST generate a migration blueprint that modernizes this architecture. " +
      "1. You MUST explicitly state in the summary the specific legacy stack you detected from the config files (e.g. 'Detected PHP/Laravel', 'Detected Go/Gin', 'Detected Rust/Actix', 'Detected Python/Django', 'Detected Ruby/Rails', 'Detected Java').\n" +
      "2. The new Frontend MUST be explicitly Next.js or React.\n" +
      "3. The Database MUST be explicitly Supabase (Postgres).\n" +
      "4. For the Backend technology, analyze the old system's logic and recommend the most suitable modern backend framework (e.g. converting PHP to Node, or keeping Go but modernizing endpoints, etc).\n" +
      "5. You MUST explicitly mention the transition from the legacy setup to Next.js + Supabase in your executive summary and sprint objectives.\n" +
      "6. Extract all deep data entities you can find from the files and reproduce them as fully typed standard Supabase SQL schemas with RLS policies.\n";
  }

  return { appendedText: filesFound > 0 ? scrapedContext : "", filesFound };
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("upstash-signature") || "";
  const expectedUrl = req.url;

  try {
    verifyQstashSignature({
      signature,
      body: rawBody,
      url: expectedUrl,
      currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY,
      nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY,
      clockToleranceSeconds: 5,
    });
  } catch (err) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queueToken = req.headers.get("x-queue-token");
  if (!queueToken || queueToken !== process.env.SCOPE_JOB_QUEUE_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { jobId } = JSON.parse(rawBody);
  if (!jobId) {
    return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: job, error: jobError } = await admin
    .from("scope_jobs")
    .select("id, user_id, status, payload")
    .eq("id", jobId)
    .single();

  if (jobError || !job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status === "succeeded") {
    return NextResponse.json({ ok: true });
  }

  const payload = (job.payload || {}) as ScopeJobPayload;

  try {
    await admin
      .from("scope_jobs")
      .update({ status: "processing", updated_at: new Date().toISOString() })
      .eq("id", jobId);

    const billing = await getOrCreateBillingSnapshot(admin, job.user_id);
    const usagePeriod = getCurrentUsagePeriod();
    const tierLimits = getTierLimits(billing.tier);

    const { data: usageRow, error: usageError } = await admin
      .from("user_usage")
      .select("requests_used")
      .eq("user_id", job.user_id)
      .eq("period_start", usagePeriod.start)
      .maybeSingle();

    if (usageError) {
      throw new Error("Failed to read usage");
    }

    if (billing.monthlyQuota > 0 && (usageRow?.requests_used ?? 0) >= billing.monthlyQuota) {
      await admin
        .from("scope_jobs")
        .update({
          status: "failed",
          error: "Free tier quota exceeded. Upgrade to continue.",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      return NextResponse.json({ ok: true });
    }

    const targetLanguage = payload.target_language || "en";
    const brief = payload.brief || "";
    const isMigration = !!payload.is_migration;

    let rawBriefCache = "";
    let inputText = "";

    if (payload.audio_path) {
      const audioFile = await downloadAudioFile(admin, payload);
      if (!audioFile) {
        throw new Error("Audio file missing");
      }
      rawBriefCache = `[Audio File Uploaded: ${audioFile.name}]`;
      let transcript = "";
      try {
        transcript = await transcribeAudioWithGroq(audioFile);
      } catch {
        transcript = buildFallbackTranscriptFromFile(audioFile);
      }
      inputText = `TRANSCRIPT:\n${transcript}`;
    } else {
      rawBriefCache = brief;
      inputText = brief;
    }

    if (isMigration && inputText.includes("https://github.com/")) {
      const repoContext = await buildRepoContext(inputText, tierLimits);
      if (repoContext.filesFound > 0) {
        inputText += repoContext.appendedText;
      }
    }

    if (inputText.length > tierLimits.maxContextChars) {
      throw new Error("Repository context is too large for your tier");
    }

    const { scope: scopeData, providerUsed } = await generateScopeWithFailover(
      { kind: "text", text: inputText },
      targetLanguage,
      isMigration
    );

    const { data: orgMember } = await admin
      .from("organization_members")
      .select("org_id")
      .eq("user_id", job.user_id)
      .limit(1)
      .single();

    let projectId: string | null = null;
    let orgId = orgMember?.org_id || null;

    if (!orgId) {
      const { data: newOrg } = await admin
        .from("organizations")
        .insert({ name: "Personal Workspace", slug: `workspace-${Date.now()}` })
        .select("id")
        .single();

      if (newOrg) {
        orgId = newOrg.id;
        await admin.from("organization_members").insert({
          org_id: orgId,
          user_id: job.user_id,
          role: "owner",
        });
      }
    }

    if (orgId) {
      const { data: existingProject } = await admin
        .from("projects")
        .select("id")
        .eq("org_id", orgId)
        .limit(1)
        .single();

      if (existingProject) {
        projectId = existingProject.id;
      } else {
        const { data: newProject } = await admin
          .from("projects")
          .insert({
            name: "Default Project",
            org_id: orgId,
            description: "Main container for scopes",
          })
          .select("id")
          .single();

        if (newProject) {
          projectId = newProject.id;
        }
      }
    }

    const { data: insertedScope, error: scopeError } = await admin
      .from("client_scopes")
      .insert({
        user_id: job.user_id,
        project_id: projectId,
        status: "draft",
        raw_brief: rawBriefCache,
        target_language: targetLanguage,
        generated_proposal: {
          providerUsed,
          ...scopeData,
        },
        generated_sql: scopeData.sql_schema,
      })
      .select("id")
      .single();

    if (scopeError || !insertedScope) {
      throw new Error(scopeError?.message || "Failed to store scope");
    }

    const { error: usageUpdateError } = await admin.rpc("increment_user_usage", {
      p_user_id: job.user_id,
      p_period_start: usagePeriod.start,
      p_period_end: usagePeriod.end,
      p_requests_increment: 1,
      p_tokens_increment: Math.ceil(inputText.length / 4),
    });
    if (usageUpdateError) {
      throw new Error(usageUpdateError.message);
    }

    await admin
      .from("scope_jobs")
      .update({
        status: "succeeded",
        scope_id: insertedScope.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId);

    if (payload.audio_path) {
      await admin.storage.from("scope-audio").remove([payload.audio_path]);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = err?.message || "Scope generation failed";
    await admin
      .from("scope_jobs")
      .update({ status: "failed", error: message, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
