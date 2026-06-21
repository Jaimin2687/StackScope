import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { patchScopeWithFailover } from "@/lib/llm";
import { getClientIp, isJsonRequest, isSameOrigin, rateLimit } from "@/lib/security";

// Extend function timeout for AI inference
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    if (!isJsonRequest(req)) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }

    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const ip = getClientIp(req);
    // Edits are unlimited — but rate-limit to prevent abuse
    const limiter = rateLimit({ key: `patch-scope:${ip}`, limit: 30, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { currentScope, userMessage, scopeId } = body;

    const targetLanguage = currentScope?.target_language || "en";

    if (!currentScope || !userMessage) {
      return NextResponse.json(
        { error: "currentScope and userMessage are required" },
        { status: 400 }
      );
    }

    // ── Verify the user owns (or is an org member of) the scope they're editing ──
    // This prevents arbitrary scope editing — the scope must exist and be
    // accessible to this user via RLS. We use the user's supabase client
    // (RLS enforced) so org members can edit org-owned scopes too.
    if (scopeId) {
      const { data: scopeCheck, error: scopeCheckError } = await supabase
        .from("client_scopes")
        .select("id, user_id, org_id")
        .eq("id", scopeId)
        .maybeSingle();

      if (scopeCheckError || !scopeCheck) {
        return NextResponse.json(
          { error: "Scope not found or access denied" },
          { status: 403 }
        );
      }
    }

    const { scope: newScopeData, providerUsed } = await patchScopeWithFailover(
      currentScope,
      userMessage,
      targetLanguage
    );

    // ── Persist the edit (fire-and-forget, use admin client to bypass RLS for write) ──
    // Admin write is safe here because we already verified access above via the
    // user's own client. We use admin for the write to avoid RLS policy conflicts
    // on UPDATE (which requires the scope to be in the user's writable set).
    if (scopeId) {
      const admin = createAdminClient();
      (async () => {
        const { error: updateError } = await admin
          .from("client_scopes")
          .update({
            generated_proposal: { providerUsed, ...newScopeData },
            generated_sql: newScopeData.sql_schema,
          })
          .eq("id", scopeId);
        if (updateError) {
          console.error("[patch-scope] Background DB update failed:", updateError);
        }
      })();
    }

    return NextResponse.json({ success: true, scope: { ...newScopeData, providerUsed } });

  } catch (error: any) {
    console.error("Patch Scope API Route Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
