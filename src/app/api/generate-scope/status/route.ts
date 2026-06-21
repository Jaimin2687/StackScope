import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getClientIp, isSameOrigin, rateLimit } from "@/lib/security";

export async function GET(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `generate-scope-status:${ip}`, limit: 60, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const jobId = req.nextUrl.searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: job, error: jobError } = await supabase
      .from("scope_jobs")
      .select("id, status, error, scope_id, user_id")
      .eq("id", jobId)
      // RLS enforces org-member access — no hard user_id filter needed
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "succeeded" || !job.scope_id) {
      return NextResponse.json({ status: job.status, error: job.error || null });
    }

    const { data: scopeRow, error: scopeError } = await supabase
      .from("client_scopes")
      .select("generated_proposal")
      .eq("id", job.scope_id)
      // RLS enforces org-member access
      .single();

    if (scopeError || !scopeRow) {
      return NextResponse.json({ status: job.status, error: "Scope not available" }, { status: 500 });
    }

    return NextResponse.json({
      status: job.status,
      scopeId: job.scope_id,
      scope: scopeRow.generated_proposal,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
