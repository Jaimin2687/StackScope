import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSameOrigin, isJsonRequest, rateLimit, getClientIp } from "@/lib/security";
import type { OrgRole } from "@/lib/types";

/**
 * POST /api/team/invite
 *
 * Invite a new member to an organization.
 *
 * RBAC:
 *   - Owner → can invite with any role (owner, admin, member)
 *   - Admin → can invite with role 'member' only
 *   - Member → 403
 *
 * Body: { org_id: string, email: string, role: 'admin' | 'member' }
 */
export async function POST(req: NextRequest) {
  try {
    if (!isJsonRequest(req)) {
      return NextResponse.json({ error: "Unsupported content type" }, { status: 415 });
    }
    if (!isSameOrigin(req)) {
      return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
    }

    const ip = getClientIp(req);
    const limiter = rateLimit({ key: `team-invite:${ip}`, limit: 20, windowMs: 60_000 });
    if (!limiter.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    // ── Auth ──────────────────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { org_id, email, role } = body as {
      org_id?: string;
      email?: string;
      role?: string;
    };

    // ── Validate inputs ───────────────────────────────────────────────────
    if (!org_id || typeof org_id !== "string") {
      return NextResponse.json({ error: "org_id is required" }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
    }
    if (!role || !["admin", "member"].includes(role)) {
      return NextResponse.json({ error: "role must be 'admin' or 'member'" }, { status: 400 });
    }

    const admin = createAdminClient();

    // ── RBAC: caller must be active owner or admin in this org ────────────
    const { data: callerMembership, error: memberError } = await admin
      .from("organization_members")
      .select("role, status")
      .eq("org_id", org_id)
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (memberError || !callerMembership) {
      return NextResponse.json(
        { error: "You are not an active member of this organization" },
        { status: 403 }
      );
    }

    const callerRole: OrgRole = callerMembership.role as OrgRole;

    if (callerRole === "member") {
      return NextResponse.json(
        { error: "Only owners and admins can invite team members" },
        { status: 403 }
      );
    }

    // Admins can only invite members (not other admins or owners)
    if (callerRole === "admin" && role !== "member") {
      return NextResponse.json(
        { error: "Admins can only invite members, not admins or owners" },
        { status: 403 }
      );
    }

    // ── Prevent inviting someone already active in this org ───────────────
    const { data: existing } = await admin
      .from("organization_members")
      .select("id, status")
      .eq("org_id", org_id)
      .eq("email", email.toLowerCase())
      .maybeSingle();

    if (existing) {
      if (existing.status === "active") {
        return NextResponse.json(
          { error: "This user is already an active member of the organization" },
          { status: 409 }
        );
      }
      // Already invited — resend. We return success so the caller can retry.
      // (The row already exists; no insert needed.)
    } else {
      // ── Insert the invitation record ──────────────────────────────────────
      const { error: insertError } = await admin
        .from("organization_members")
        .insert({
          org_id,
          email: email.toLowerCase(),
          role,
          status: "invited",
          // user_id is left null until they accept
        });

      if (insertError) {
        console.error("[team/invite] insert error:", insertError);
        // Unique constraint violation → already exists
        if (insertError.code === "23505") {
          return NextResponse.json(
            { error: "An invitation for this email already exists" },
            { status: 409 }
          );
        }
        return NextResponse.json({ error: "Failed to create invitation" }, { status: 500 });
      }
    }

    // ── Send invitation email via Supabase Auth magic link ────────────────
    // The link points to /login?org_invite=<org_id> so the auth-form can
    // trigger the accept-invite flow after authentication.
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectTo = `${siteUrl}/login?org_invite=${encodeURIComponent(org_id)}`;

    const { error: magicLinkError } = await admin.auth.admin.generateLink({
      type: "magiclink",
      email: email.toLowerCase(),
      options: { redirectTo },
    });

    if (magicLinkError) {
      // Non-fatal: invitation row is already created.
      // Log and continue — the caller can share a manual link.
      console.warn("[team/invite] magic link generation failed:", magicLinkError.message);
    }

    // ── Fetch org name for response ───────────────────────────────────────
    const { data: org } = await admin
      .from("organizations")
      .select("name")
      .eq("id", org_id)
      .maybeSingle();

    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
      org_name: org?.name ?? "your organization",
    });
  } catch (error: any) {
    console.error("[team/invite] unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
