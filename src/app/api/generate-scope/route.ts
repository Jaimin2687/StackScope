import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIp, getRequestOrigin, isSameOrigin, rateLimit } from "@/lib/security";
import { getCurrentUsagePeriod, getOrCreateBillingSnapshot } from "@/lib/billing";
import { enqueueScopeJob } from "@/lib/queue";

export const maxDuration = 10;

const MAX_BRIEF_LENGTH = 8000;

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `generate-scope:${ip}`, limit: 12, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const targetLanguage = (formData.get("target_language") as string) || "en";
    const brief = (formData.get("brief") as string) || "";
    const audioFile = formData.get("audio") as File | null;
    const isMigration = formData.get("is_migration") === "true" || (!!brief && brief.includes("modernization architecture for my existing Github codebase"));

    if (!audioFile && !brief.trim()) {
      return NextResponse.json({ error: "Brief or audio is required" }, { status: 400 });
    }

    if (brief.length > MAX_BRIEF_LENGTH) {
      return NextResponse.json({ error: "Brief is too long" }, { status: 400 });
    }

    const admin = createAdminClient();
    const billing = await getOrCreateBillingSnapshot(admin, user.id);
    const usagePeriod = getCurrentUsagePeriod();

    const { data: usageRow, error: usageError } = await admin
      .from("user_usage")
      .select("requests_used")
      .eq("user_id", user.id)
      .eq("period_start", usagePeriod.start)
      .maybeSingle();

    if (usageError) {
      return NextResponse.json({ error: "Failed to read usage" }, { status: 500 });
    }

    const { count: queuedCount, error: queuedError } = await admin
      .from("scope_jobs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["queued", "processing"])
      .gte("created_at", usagePeriod.startDate.toISOString())
      .lt("created_at", usagePeriod.endDate.toISOString());

    if (queuedError) {
      return NextResponse.json({ error: "Failed to read queued usage" }, { status: 500 });
    }

    const used = (usageRow?.requests_used ?? 0) + (queuedCount ?? 0);

    if (billing.monthlyQuota > 0 && used >= billing.monthlyQuota) {
      return NextResponse.json(
        { error: "Free tier quota exceeded. Upgrade to continue." },
        { status: 403 }
      );
    }

    let audioPath: string | null = null;
    let audioName: string | null = null;
    let audioContentType: string | null = null;

    if (audioFile) {
      const safeName = audioFile.name?.replace(/[^a-zA-Z0-9._-]/g, "_") || "audio-brief";
      const uploadPath = `${user.id}/${crypto.randomUUID()}/${safeName}`;
      const { error: uploadError } = await admin.storage
        .from("scope-audio")
        .upload(uploadPath, audioFile, {
          contentType: audioFile.type || "application/octet-stream",
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json({ error: "Failed to store audio" }, { status: 500 });
      }

      audioPath = uploadPath;
      audioName = safeName;
      audioContentType = audioFile.type || "application/octet-stream";
    }

    const { data: jobRow, error: jobError } = await admin
      .from("scope_jobs")
      .insert({
        user_id: user.id,
        status: "queued",
        payload: {
          target_language: targetLanguage,
          brief: brief || null,
          is_migration: isMigration,
          audio_path: audioPath,
          audio_name: audioName,
          audio_content_type: audioContentType,
        },
      })
      .select("id")
      .single();

    if (jobError || !jobRow?.id) {
      return NextResponse.json({ error: "Failed to enqueue job" }, { status: 500 });
    }

    try {
      const origin = getRequestOrigin(req);
      await enqueueScopeJob(jobRow.id, origin);
    } catch (err: any) {
      await admin
        .from("scope_jobs")
        .update({
          status: "failed",
          error: err?.message || "Queueing failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", jobRow.id);
      throw err;
    }

    return NextResponse.json(
      {
        jobId: jobRow.id,
        statusUrl: `/api/generate-scope/status?jobId=${jobRow.id}`,
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
