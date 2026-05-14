import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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
    const limiter = rateLimit({ key: `patch-scope:${ip}`, limit: 20, windowMs: 60_000 });
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

    const { scope: newScopeData, providerUsed } = await patchScopeWithFailover(
      currentScope,
      userMessage,
      targetLanguage
    );

    // Fire-and-forget DB update — don't block the user's response
    if (scopeId) {
      (async () => {
        const { error: updateError } = await supabase
          .from("client_scopes")
          .update({
            generated_proposal: { providerUsed, ...newScopeData },
            generated_sql: newScopeData.sql_schema
          })
          .eq("id", scopeId)
          .eq("user_id", user.id);
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
