import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { transcribeAudioWithGroq } from "@/lib/transcribe";
import { generateScopeWithFailover } from "@/lib/llm";

function buildFallbackTranscriptFromFile(file: File): string {
  const safeName = file.name?.replace(/\.[^.]+$/, "") || "audio-brief";
  const sizeMb = (file.size / 1024 / 1024).toFixed(2);
  return [
    `Audio brief received: "${safeName}".`,
    `File type: ${file.type || "unknown"}. Size: ${sizeMb} MB.`,
    "The spoken brief could not be transcribed reliably.",
    "Generate a complete technical scope anyway by making industry-standard assumptions."
  ].join("\n");
}

function buildDeterministicScopeFromText(text: string) {
  const cleaned = (text || "").trim().slice(0, 2000);
  const title = cleaned ? cleaned.split(/\n|\.|\!/)[0].slice(0, 80).replace(/[:\-]+\s*$/, "") || "New Web Platform" : "New Web Platform";

  return {
    providerUsed: "deterministic" as const,
    proposal: {
      title,
      summary: "A modern web platform scoped from a client brief (voice or text).",
      objectives: ["Ship secure authentication + onboarding", "Implement core CRUD workflows"]
    },
    assumptions: ["Standard GDPR-like personal data protection requirements"],
    data_model_summary: {
      entities: [{ name: "workspaces", description: "Top-level container", key_fields: ["id"] }],
      relationships: ["workspaces 1 - N items"]
    },
    api_endpoints: [
      { path: "/api/workspaces", method: "GET/POST", auth_required: true, request_schema_summary: "filters", response_schema_summary: "list" }
    ],
    security: {
      rls_notes: "RLS policies enforce owner-only access.",
      auth_flow: "Supabase email/password",
      encryption_at_rest: "Use Supabase-managed Postgres encryption",
      rate_limiting: "Apply API rate limiting"
    },
    sprint_timeline: [
      { sprint: 1, duration: "2 weeks", tasks: ["Requirements refinement", "Data model design"] }
    ],
    tech_stack: {
      frontend: ["Next.js", "Tailwind CSS"],
      backend: ["Next.js Route Handlers"],
      database: "Supabase Postgres",
      infra: ["Supabase Auth + RLS", "Vercel"]
    },
    estimates: {
      total_weeks: 6,
      dev_days: 60,
      team_size: 2,
      cost_estimate_inr: "₹25,00,000"
    },
    sql_schema: `-- Deterministic Supabase-ready baseline schema`
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const targetLanguage = (formData.get("target_language") as string) || "en";
    const brief = formData.get("brief") as string;
    const audioFile = formData.get("audio") as File;
    const isMigration = formData.get("is_migration") === "true" || (!!brief && brief.includes("modernization architecture for my existing Github codebase"));

    let rawBriefCache = "";
    let inputText = "";

    if (audioFile) {
      rawBriefCache = `[Audio File Uploaded: ${audioFile.name}]`;
      let transcript = "";
      try {
        transcript = await transcribeAudioWithGroq(audioFile);
      } catch (err) {
        transcript = buildFallbackTranscriptFromFile(audioFile);
      }
      inputText = `TRANSCRIPT:\n${transcript}`;
    } else {
      rawBriefCache = brief;
      inputText = brief;
    }

    // Automatically fetch important config files if this is a GitHub migration
    if (isMigration && inputText.includes("https://github.com/")) {
      const match = inputText.match(/https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)/i);
      if (match) {
        const owner = match[1];
        let repo = match[2];
        repo = repo.replace(/[.,;!?]+$/, '').replace(/\.git$/, '');
        
        const filesToTry = [
          "pom.xml", 
          "build.gradle",
          "build.gradle.kts",
          "backend/pom.xml", 
          "server/pom.xml", 
          "package.json", 
          "frontend/package.json", 
          "backend/package.json",
          "server/package.json",
          "requirements.txt",
          "pyproject.toml",
          "setup.py",
          "Pipfile",
          "composer.json",
          "CMakeLists.txt",
          "Makefile",
          "go.mod",
          "go.sum",
          "Cargo.toml",
          "Gemfile",
          "mix.exs",
          "rebar.config",
          "project.clj",
          "Package.swift",
          "pubspec.yaml",
          "docker-compose.yml",
          "docker-compose.yaml",
          "Dockerfile"
        ];
        
        let scrapedContext = "\n\nAnalyze the following repository files to determine the CURRENT tech stack and entities.\nDO NOT GUESS. Read the dependencies explicitly.\n\n";
        let filesFound = 0;
        
        const headers: Record<string, string> = {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "StackScope-Repo-Analyzer"
        };
        if (process.env.GITHUB_TOKEN) {
          headers["Authorization"] = `Bearer ${process.env.GITHUB_TOKEN}`;
        }
        
        await Promise.all(filesToTry.map(async (fileName) => {
          try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`, { headers });
            if (res.ok) {
              const data = await res.json();
              if (data.content && data.encoding === 'base64') {
                const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
                console.log(`[Repo Analyzer Github Fetch] Successfully fetched ${fileName}. First 200 chars:`);
                console.log(decoded.substring(0, 200));
                scrapedContext += `--- RAW REPOSITORY FILE (${fileName}) ---\n${decoded.substring(0, 3500)}\n--- END FILE ---\n\n`;
                filesFound++;
              }
            }
          } catch (e) {}
        }));

        // If nothing found in the standard locations, try a recursive tree search (handles monorepos/turborepo layouts)
        if (filesFound === 0) {
          try {
            const repoMeta = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
            if (repoMeta.ok) {
              const repoJson = await repoMeta.json();
              const defaultBranch = repoJson.default_branch || 'main';
              const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`, { headers });
              if (treeRes.ok) {
                const treeJson = await treeRes.json();
                const blobs = Array.isArray(treeJson.tree) ? treeJson.tree : [];
                // find candidate paths that look like config files (added build.gradle.kts to search parameters)
                const candidates = blobs.filter((t: any) => t.type === 'blob' && /(pom\.xml|package\.json|build\.gradle|build\.gradle\.kts|application\.properties|requirements\.txt|pyproject\.toml|setup\.py|Pipfile|composer\.json|CMakeLists\.txt|Makefile|go\.mod|go\.sum|Cargo\.toml|Gemfile|mix\.exs|rebar\.config|project\.clj|Package\.swift|pubspec\.yaml|docker-compose\.ya?ml|Dockerfile)$/i.test(t.path));
                
                // Sort candidates by length of path to prioritize root configurations over deeply nested dependencies
                candidates.sort((a: any, b: any) => a.path.length - b.path.length);
                const topCandidates = candidates.slice(0, 10); // Don't fetch more than 10 files to prevent timeout
                
                for (const c of topCandidates) {
                  try {
                    const path = c.path;
                    const fileRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, { headers });
                    if (fileRes.ok) {
                      const data = await fileRes.json();
                      if (data.content && data.encoding === 'base64') {
                        const decoded = Buffer.from(data.content, 'base64').toString('utf-8');
                        console.log(`[Repo Analyzer Github Fetch] Successfully fetched ${path} (from tree). First 200 chars:`);
                        console.log(decoded.substring(0, 200));
                        scrapedContext += `--- RAW REPOSITORY FILE (${path}) ---\n${decoded.substring(0, 3500)}\n--- END FILE ---\n\n`;
                        filesFound++;
                      }
                    }
                  } catch (e) {
                    // ignore individual file fetch errors
                  }
                }
              }
            }
          } catch (e) {
            // ignore tree lookup errors - we already attempt best-effort collection
          }
        }

        if (filesFound > 0) {
          scrapedContext += "EXTREMELY IMPORTANT MIGRATION DIRECTIVE:\n" +
            "Based strictly on the codebase files provided above, you MUST generate a migration blueprint that modernizes this architecture. " +
            "1. You MUST explicitly state in the summary the specific legacy stack you detected from the config files (e.g. 'Detected PHP/Laravel', 'Detected Go/Gin', 'Detected Rust/Actix', 'Detected Python/Django', 'Detected Ruby/Rails', 'Detected Java').\n" +
            "2. The new Frontend MUST be explicitly Next.js or React.\n" +
            "3. The Database MUST be explicitly Supabase (Postgres).\n" +
            "4. For the Backend technology, analyze the old system's logic and recommend the most suitable modern backend framework (e.g. converting PHP to Node, or keeping Go but modernizing endpoints, etc).\n" +
            "5. You MUST explicitly mention the transition from the legacy setup to Next.js + Supabase in your executive summary and sprint objectives.\n" +
            "6. Extract all deep data entities you can find from the files and reproduce them as fully typed standard Supabase SQL schemas with RLS policies.\n";
          inputText += scrapedContext;
        }
      }
    }

    const { scope: scopeData, providerUsed } = await generateScopeWithFailover(
      { kind: "text", text: inputText },
      targetLanguage,
      isMigration
    );

    // Get or Create user's workspace/project
    const { data: orgMember } = await supabase
      .from('organization_members')
      .select('org_id')
      .eq('user_id', user.id)
      .limit(1)
      .single();

    let projectId = null;
    let orgId = orgMember?.org_id;

    if (!orgId) {
      // Fallback: This user might not have hit the triggers.
      const { data: newOrg } = await supabase
        .from('organizations')
        .insert({ name: 'Personal Workspace', slug: 'workspace-' + Date.now() })
        .select('id')
        .single();
      
      if (newOrg) {
        orgId = newOrg.id;
        await supabase.from('organization_members').insert({
          org_id: orgId,
          user_id: user.id,
          role: 'owner'
        });
      }
    }

    if (orgId) {
      const { data: existingProject } = await supabase
        .from('projects')
        .select('id')
        .eq('org_id', orgId)
        .limit(1)
        .single();

      if (existingProject) {
        projectId = existingProject.id;
      } else {
        const { data: newProject } = await supabase
          .from('projects')
          .insert({
            name: 'Default Project',
            org_id: orgId,
            description: 'Main container for scopes'
          })
          .select('id')
          .single();
        if (newProject) {
          projectId = newProject.id;
        }
      }
    }

    await supabase.from("client_scopes").insert({
      user_id: user.id,
      project_id: projectId,
      status: 'draft',
      raw_brief: rawBriefCache,
      target_language: targetLanguage,
      generated_proposal: {
        providerUsed,
        ...scopeData
      },
      generated_sql: scopeData.sql_schema,
    });

    return NextResponse.json({ success: true, scope: { ...scopeData, providerUsed } });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
