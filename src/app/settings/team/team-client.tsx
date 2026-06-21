"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Trash2,
  Crown,
  Shield,
  User,
  Mail,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  ChevronDown,
} from "lucide-react";

type OrgRole = "owner" | "admin" | "member";
type OrgMemberStatus = "invited" | "active";

interface Member {
  id: string;
  user_id: string | null;
  email: string;
  role: OrgRole;
  status: OrgMemberStatus;
  invited_at: string;
  profile?: { full_name: string | null; avatar_url: string | null } | null;
}

interface Org {
  id: string;
  name: string;
  subscription_status: string;
}

const ROLE_ICONS: Record<OrgRole, React.ReactNode> = {
  owner: <Crown className="w-3.5 h-3.5 text-amber-400" />,
  admin: <Shield className="w-3.5 h-3.5 text-indigo-400" />,
  member: <User className="w-3.5 h-3.5 text-neutral-400" />,
};

const ROLE_LABELS: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};

const ROLE_COLORS: Record<OrgRole, string> = {
  owner: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  admin: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
  member: "text-neutral-400 bg-neutral-400/10 border-neutral-400/20",
};

interface Props {
  initialOrgId?: string;
}

export function TeamClientView({ initialOrgId }: Props) {
  const [org, setOrg] = useState<Org | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [callerRole, setCallerRole] = useState<OrgRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Remove state
  const [removingId, setRemovingId] = useState<string | null>(null);

  const fetchMembers = useCallback(async (orgId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/team/members?org_id=${encodeURIComponent(orgId)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch team");
      setOrg(data.org);
      setMembers(data.members || []);
      setCallerRole(data.caller_role);
    } catch (err: any) {
      setError(err.message || "Failed to load team data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialOrgId) {
      fetchMembers(initialOrgId);
    } else {
      setLoading(false);
    }
  }, [initialOrgId, fetchMembers]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org || !inviteEmail.trim()) return;

    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          org_id: org.id,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      setInviteSuccess(data.message || `Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      // Refresh members list
      await fetchMembers(org.id);
    } catch (err: any) {
      setInviteError(err.message || "Failed to send invitation");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string, memberEmail: string) => {
    if (!org) return;
    if (!confirm(`Remove ${memberEmail} from ${org.name}?`)) return;

    setRemovingId(memberId);
    try {
      const res = await fetch("/api/team/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ org_id: org.id, member_id: memberId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove member");
      await fetchMembers(org.id);
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  const canInvite = callerRole === "owner" || callerRole === "admin";
  const canRemove = callerRole === "owner" || callerRole === "admin";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-neutral-500">
          <div className="w-4 h-4 border-2 border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
          Loading team...
        </div>
      </div>
    );
  }

  if (!initialOrgId || (!loading && !org && !error)) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <div className="w-16 h-16 bg-[#0a0a0a] rounded-xl flex items-center justify-center mb-6 border border-[#222]">
          <Users className="w-6 h-6 text-neutral-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No Organization Yet</h3>
        <p className="text-neutral-500 text-sm mb-6">
          Generate your first scope to automatically create your personal workspace, or upgrade to
          the Agency plan to unlock multi-member organizations.
        </p>
        <a
          href="/pricing"
          className="inline-flex h-9 items-center justify-center rounded-md bg-white px-4 text-sm font-medium text-black hover:bg-neutral-200 transition-colors"
        >
          Upgrade to Agency
        </a>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm">
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        {error}
      </div>
    );
  }

  const activeMembers = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "invited");

  return (
    <div className="space-y-10">
      {/* Org Header */}
      {org && (
        <div className="flex items-center justify-between pb-6 border-b border-[#222]">
          <div>
            <h2 className="text-lg font-medium text-white">{org.name}</h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              {activeMembers.length} active member{activeMembers.length !== 1 ? "s" : ""}
              {pendingMembers.length > 0 && ` · ${pendingMembers.length} pending invite${pendingMembers.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
            org.subscription_status === "active" || org.subscription_status === "trialing"
              ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
              : "text-neutral-400 bg-neutral-400/10 border-neutral-400/20"
          }`}>
            {org.subscription_status === "active" ? "Agency Active" :
             org.subscription_status === "trialing" ? "Trialing" :
             "Free Tier"}
          </div>
        </div>
      )}

      {/* Invite Section — owners and admins only */}
      {canInvite && (
        <section className="space-y-4">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-neutral-400" />
            Invite Team Member
          </h3>

          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="developer@example.com"
                required
                disabled={inviting}
                className="w-full h-10 rounded-md border border-[#333] bg-[#050505] px-3 text-sm text-white placeholder:text-neutral-700 focus:border-[#555] focus:outline-none transition-colors disabled:opacity-50"
              />
            </div>

            {/* Role selector */}
            <div className="relative">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as "admin" | "member")}
                disabled={inviting || callerRole === "admin"} // admins can only invite members
                className="h-10 appearance-none rounded-md border border-[#333] bg-[#050505] pl-3 pr-8 text-sm text-white focus:border-[#555] focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
              >
                <option value="member">Member</option>
                {callerRole === "owner" && <option value="admin">Admin</option>}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500 pointer-events-none" />
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="h-10 px-4 bg-white text-black text-sm font-medium rounded-md hover:bg-neutral-200 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {inviting ? "Sending..." : "Send Invite"}
            </motion.button>
          </form>

          <AnimatePresence>
            {inviteSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 text-sm text-emerald-400"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {inviteSuccess}
              </motion.div>
            )}
            {inviteError && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-center gap-2 text-sm text-red-400"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {inviteError}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}

      {/* Active Members */}
      <section className="space-y-3">
        <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
          Active Members ({activeMembers.length})
        </h3>

        <div className="divide-y divide-[#1a1a1a] rounded-lg border border-[#222] overflow-hidden">
          {activeMembers.length === 0 ? (
            <p className="px-5 py-4 text-sm text-neutral-600">No active members.</p>
          ) : (
            activeMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                callerRole={callerRole}
                canRemove={canRemove}
                isRemoving={removingId === member.id}
                onRemove={() => handleRemove(member.id, member.email)}
              />
            ))
          )}
        </div>
      </section>

      {/* Pending Invites */}
      {pendingMembers.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            Pending Invites ({pendingMembers.length})
          </h3>

          <div className="divide-y divide-[#1a1a1a] rounded-lg border border-[#222] overflow-hidden">
            {pendingMembers.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                callerRole={callerRole}
                canRemove={canRemove}
                isRemoving={removingId === member.id}
                onRemove={() => handleRemove(member.id, member.email)}
              />
            ))}
          </div>
        </section>
      )}

      {/* RBAC reference card — always visible */}
      <section className="p-5 rounded-lg border border-[#222] bg-[#080808]">
        <h3 className="text-sm font-medium text-white mb-3">Role Permissions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="pb-2 text-left text-neutral-500 font-medium">Action</th>
                <th className="pb-2 text-center text-amber-400 font-medium">Owner</th>
                <th className="pb-2 text-center text-indigo-400 font-medium">Admin</th>
                <th className="pb-2 text-center text-neutral-400 font-medium">Member</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {[
                { action: "Modify Billing / Cancel Plan", owner: true, admin: false, member: false },
                { action: "Invite / Remove Team Members", owner: true, admin: true, member: false },
                { action: "Run Repo Scans / Gen SOWs", owner: true, admin: true, member: true },
                { action: "View Org Generation History", owner: true, admin: true, member: true },
              ].map((row) => (
                <tr key={row.action}>
                  <td className="py-2.5 text-neutral-300">{row.action}</td>
                  <td className="py-2.5 text-center">{row.owner ? "✅" : "❌"}</td>
                  <td className="py-2.5 text-center">{row.admin ? "✅" : "❌"}</td>
                  <td className="py-2.5 text-center">{row.member ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MemberRow({
  member,
  callerRole,
  canRemove,
  isRemoving,
  onRemove,
}: {
  member: Member;
  callerRole: OrgRole | null;
  canRemove: boolean;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const displayName = member.profile?.full_name || member.email.split("@")[0];
  const isPending = member.status === "invited";

  // Determine if this member can be removed by the caller
  const canRemoveThis =
    canRemove &&
    !(member.role === "owner") && // owners cannot be removed via UI
    !(callerRole === "admin" && member.role !== "member"); // admins can only remove members

  return (
    <div className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#0d0d0d] transition-colors">
      {/* Avatar / initials */}
      <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-[#333] flex items-center justify-center flex-shrink-0 text-xs font-medium text-neutral-300">
        {member.profile?.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.profile.avatar_url}
            alt={displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          displayName[0]?.toUpperCase() ?? "?"
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{displayName}</p>
        <p className="text-[12px] text-neutral-500 truncate flex items-center gap-1">
          <Mail className="w-3 h-3 flex-shrink-0" />
          {member.email}
        </p>
      </div>

      {/* Status badge */}
      {isPending && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-amber-500/20 bg-amber-500/10 text-amber-400 text-[11px] font-medium">
          <Clock className="w-3 h-3" />
          Pending
        </div>
      )}

      {/* Role badge */}
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${ROLE_COLORS[member.role]}`}>
        {ROLE_ICONS[member.role]}
        {ROLE_LABELS[member.role]}
      </div>

      {/* Remove button */}
      {canRemoveThis && (
        <button
          onClick={onRemove}
          disabled={isRemoving}
          title="Remove member"
          className="p-1.5 rounded-md text-neutral-600 hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
        >
          {isRemoving ? (
            <div className="w-3.5 h-3.5 border border-neutral-700 border-t-neutral-400 rounded-full animate-spin" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </div>
  );
}
