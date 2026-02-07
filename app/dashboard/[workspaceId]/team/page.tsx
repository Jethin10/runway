"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleInWorkspace } from "@/contexts/AuthContext";
import { getWorkspace, updateWorkspace, createWorkspaceInvite } from "@/lib/firestore";
import type { StartupWorkspace, WorkspaceMember, UserRole } from "@/lib/types";

/** Real members only: exclude cosmetic invite-* placeholders. Invite-by-link adds real Firebase uids. */
function isRealMember(m: WorkspaceMember): boolean {
  return !m.userId.startsWith("invite-");
}

export default function TeamPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [editName, setEditName] = useState("");
  const [editStage, setEditStage] = useState<StartupWorkspace["stage"]>("MVP");
  const [savingProfile, setSavingProfile] = useState(false);
  const [inviteRole, setInviteRole] = useState<UserRole>("team_member");
  const [generatingLink, setGeneratingLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspace(workspaceId).then((ws) => {
      setWorkspace(ws ?? null);
      if (ws) {
        setEditName(ws.name);
        setEditStage(ws.stage);
      }
    }).finally(() => setLoading(false));
  }, [workspaceId]);

  const role = workspace ? getRoleInWorkspace(user?.uid ?? undefined, workspace.members) : null;
  const isFounder = role === "founder";

  const realMembers = workspace ? workspace.members.filter(isRealMember) : [];

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !isFounder || !editName.trim()) return;
    setSavingProfile(true);
    try {
      await updateWorkspace(workspaceId, { name: editName.trim(), stage: editStage });
      setWorkspace((w) => (w ? { ...w, name: editName.trim(), stage: editStage } : null));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGenerateLink = async () => {
    if (!workspaceId || !isFounder) return;
    setGeneratingLink(true);
    setGeneratedLink(null);
    try {
      const { token } = await createWorkspaceInvite(workspaceId, inviteRole, user!.uid);
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      setGeneratedLink(`${origin}/join/${workspaceId}?token=${token}`);
    } finally {
      setGeneratingLink(false);
    }
  };

  const copyLink = () => {
    if (!generatedLink) return;
    void navigator.clipboard.writeText(generatedLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    });
  };

  const removeMember = async (m: WorkspaceMember) => {
    if (!workspaceId || !workspace || !isFounder) return;
    if (m.userId === workspace.createdBy) return;
    const updated = workspace.members.filter((x) => x.userId !== m.userId);
    await updateWorkspace(workspaceId, { members: updated });
    setWorkspace((w) => (w ? { ...w, members: updated } : null));
  };

  if (loading || !workspace) {
    return (
      <div className="py-12">
        {loading ? <p className="text-gray-500">Loading…</p> : <p className="text-gray-500">Workspace not found.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Team &amp; workspace</h1>
        <p className="text-gray-500 text-sm">
          Manage startup profile and team roles. Founders have full access; team members can edit execution; investors have read-only access.
        </p>
      </div>

      {isFounder && (
        <section className="bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-6">
          <h2 className="font-bold text-lg mb-4">Startup profile</h2>
          <form onSubmit={handleSaveProfile} className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1">Workspace name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-[#111418] dark:text-white"
              />
            </div>
            <div className="w-48">
              <label className="block text-sm font-medium mb-1">Stage</label>
              <select
                value={editStage}
                onChange={(e) => setEditStage(e.target.value as StartupWorkspace["stage"])}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-[#111418] dark:text-white"
              >
                <option value="Idea">Idea</option>
                <option value="MVP">MVP</option>
                <option value="Early Traction">Early Traction</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold disabled:opacity-50"
            >
              {savingProfile ? "Saving…" : "Save"}
            </button>
          </form>
        </section>
      )}

      <section className="bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-6">
        <h2 className="font-bold text-lg mb-4">Team members</h2>
        <ul className="space-y-3 mb-6">
          {realMembers.map((m) => {
            const isYou = m.userId === user?.uid;
            return (
              <li
                key={m.userId}
                className="flex items-center justify-between p-3 rounded-xl border border-[#e8eaed] dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary">person</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#111418] dark:text-white">
                      {m.displayName || m.email || "Team member"}
                      {isYou && <span className="ml-2 text-xs text-primary font-bold">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{m.email || m.userId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded text-xs font-bold bg-gray-100 dark:bg-gray-700 text-[#111418] dark:text-white capitalize">
                    {m.role.replace("_", " ")}
                  </span>
                  {isFounder && !isYou && m.role !== "founder" && (
                    <button
                      type="button"
                      onClick={() => removeMember(m)}
                      className="text-red-600 dark:text-red-400 text-sm font-medium hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {isFounder && (
          <div className="p-4 rounded-xl bg-[#f5f6f8] dark:bg-white/5 border border-[#e8eaed] dark:border-white/10">
            <h3 className="font-semibold text-sm text-[#111418] dark:text-white mb-2">Share invite link</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Anyone with this link can join after signing in. This link adds the user directly to your workspace. No email sending.
            </p>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="w-40">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-[#111418] dark:text-white"
                >
                  <option value="team_member">Team member</option>
                  <option value="investor">Investor</option>
                </select>
              </div>
              <button
                type="button"
                onClick={handleGenerateLink}
                disabled={generatingLink}
                className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold disabled:opacity-50"
              >
                {generatingLink ? "Generating…" : "Generate invite link"}
              </button>
            </div>
            {generatedLink && (
              <div className="mt-4 flex flex-wrap gap-2 items-center">
                <input
                  type="text"
                  readOnly
                  value={generatedLink}
                  className="flex-1 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-[#111418] dark:text-white font-mono"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  {linkCopied ? "Copied" : "Copy link"}
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
