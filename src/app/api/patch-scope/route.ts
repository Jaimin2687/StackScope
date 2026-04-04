import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { patchScopeWithFailover } from "@/lib/llm";

export async function POST(req: NextRequest) {
  try {
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

    // Save to DB if scopeId is available
    if (scopeId) {
      const { error: updateError } = await supabase
        .from("client_scopes")
        .update({
          generated_proposal: { providerUsed, ...newScopeData },
          generated_sql: newScopeData.sql_schema
        })
        .eq("id", scopeId)
        .eq("user_id", user.id);
        
      if (updateError) {
        console.error("Failed to update database scope:", updateError);
        // We can still return the successful scopedata to the client
      }
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
