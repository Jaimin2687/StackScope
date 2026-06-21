import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOrigin, rateLimit, getClientIp } from "@/lib/security";

/**
 * GET /api/team/members?org_id=<uuid>
 *
 * Returns all members (active + invited) of the specified org.
 * RBAC: caller must be an active member (any role) of the org.
 */
export async function GET(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `team-members-get:${ip}`, limit: 60, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const orgId = searchParams.get("org_id");

    if (!orgId) {
      return NextResponse.json({ error: "org_id query parameter is required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── RBAC: caller must be active in this org ───────────────────────────
    const { data: callerMembership } = await admin
      .from("organization_members")
      .select("role")
      .eq("org_id", orgId)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!callerMembership) {
      return NextResponse.json(
        { error: "You are not an active member of this organization" },
        { status: 403 }
      );
    }

    // ── Fetch all members ─────────────────────────────────────────────────
    const { data: members, error: membersError } = await admin
      .from("organization_members")
      .select("id, user_id, email, role, status, invited_at")
      .eq("org_id", orgId)
      .order("invited_at", { ascending: true });

    if (membersError) {
      console.error("[team/members GET] error:", membersError);
      return NextResponse.json({ error: "Failed to fetch members" }, { status: 500 });
    }

    // ── Enrich with profile data for active members ───────────────────────
    const activeUserIds = (members || [])
      .filter((m) => m.user_id)
      .map((m) => m.user_id as string);

    let profileMap: Record<string, { full_name: string | null; avatar_url: string | null }> = {};

    if (activeUserIds.length > 0) {
      const { data: profiles } = await admin
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", activeUserIds);

      for (const profile of profiles || []) {
        profileMap[profile.id] = {
          full_name: profile.full_name,
          avatar_url: profile.avatar_url,
        };
      }
    }

    const enrichedMembers = (members || []).map((m) => ({
      ...m,
      profile: m.user_id ? (profileMap[m.user_id] ?? null) : null,
    }));

    // ── Fetch org details ─────────────────────────────────────────────────
    const { data: org } = await admin
      .from("organizations")
      .select("id, name, subscription_status")
      .eq("id", orgId)
      .maybeSingle();

    return NextResponse.json({
      org,
      members: enrichedMembers,
      caller_role: callerMembership.role,
    });
  } catch (error: any) {
    console.error("[team/members GET] unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/team/members
 *
 * Remove a member from an organization.
 * RBAC:
 *   - Owner → can remove anyone except themselves (ownership transfer needed first)
 *   - Admin → can remove members only (not other admins/owners)
 *   - Member → 403
 *
 * Body: { org_id: string, member_id: string }
 */
export async function DELETE(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `team-members-del:${ip}`, limit: 20, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { org_id, member_id } = body as { org_id?: string; member_id?: string };

    if (!org_id || !member_id) {
      return NextResponse.json({ error: "org_id and member_id are required" }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── RBAC: caller role ─────────────────────────────────────────────────
    const { data: callerMembership } = await admin
      .from("organization_members")
      .select("role")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (!callerMembership) {
      return NextResponse.json(
        { error: "You are not an active member of this organization" },
        { status: 403 }
      );
    }

    if (callerMembership.role === "member") {
      return NextResponse.json(
        { error: "Only owners and admins can remove members" },
        { status: 403 }
      );
    }

    // ── Fetch the target member ───────────────────────────────────────────
    const { data: target } = await admin
      .from("organization_members")
      .select("id, user_id, role")
      .eq("id", member_id)
      .eq("org_id", org_id)
      .maybeSingle();

    if (!target) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    // Owners cannot remove themselves (prevents org from being orphaned)
    if (target.user_id === user.id && callerMembership.role === "owner") {
      return NextResponse.json(
        { error: "Owners cannot remove themselves. Transfer ownership first." },
        { status: 400 }
      );
    }

    // Admins cannot remove other admins or owners
    if (callerMembership.role === "admin" && target.role !== "member") {
      return NextResponse.json(
        { error: "Admins can only remove members, not other admins or owners" },
        { status: 403 }
      );
    }

    // ── Delete the membership row ─────────────────────────────────────────
    const { error: deleteError } = await admin
      .from("organization_members")
      .delete()
      .eq("id", member_id)
      .eq("org_id", org_id);

    if (deleteError) {
      console.error("[team/members DELETE] error:", deleteError);
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Member removed successfully" });
  } catch (error: any) {
    console.error("[team/members DELETE] unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
