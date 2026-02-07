"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkspace, getInviteByWorkspaceAndToken, markInviteUsed, updateWorkspace } from "@/lib/firestore";

/**
 * Invite-by-link join flow. No email sending; link is shared manually.
 * Auth gate: if not logged in, redirect to login with return URL.
 * On success: add user to workspace.members, mark invite used, redirect to workspace.
 */
export default function JoinWorkspacePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const workspaceId = params.workspaceId as string;
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<"validating" | "joining" | "done" | "error">("validating");
  const [error, setError] = useState<string | null>(null);
  const [authSettled, setAuthSettled] = useState(false);

  // Give Firebase time to restore session after redirect (avoid redirect loop with login)
  useEffect(() => {
    if (!authLoading) {
      const t = setTimeout(() => setAuthSettled(true), 800);
      return () => clearTimeout(t);
    } else {
      setAuthSettled(false);
    }
  }, [authLoading]);

  useEffect(() => {
    if (!workspaceId || !token) {
      setError("This invite link is invalid or expired.");
      setStatus("error");
      return;
    }

    // Auth gate: only redirect to login after auth has had time to settle (avoids loop when coming from login)
    if (authSettled && !user) {
      const joinUrl = `/join/${workspaceId}?token=${encodeURIComponent(token)}`;
      router.replace(`/login?redirect=${encodeURIComponent(joinUrl)}`);
      return;
    }

    if (!user) return;

    let cancelled = false;

    (async () => {
      setStatus("validating");
      setError(null);

      const invite = await getInviteByWorkspaceAndToken(workspaceId, token);
      if (cancelled) return;
      if (!invite) {
        setError("This invite link is invalid or expired.");
        setStatus("error");
        return;
      }

      const workspace = await getWorkspace(workspaceId);
      if (cancelled) return;
      if (!workspace) {
        setError("This invite link is invalid or expired.");
        setStatus("error");
        return;
      }

      const alreadyMember = workspace.members.some((m) => m.userId === user.uid);
      if (alreadyMember) {
        setStatus("done");
        router.replace(`/dashboard/${workspaceId}?joined=1`);
        return;
      }

      setStatus("joining");

      const newMember: { userId: string; role: string; email?: string; displayName?: string } = {
        userId: user.uid,
        role: invite.role,
      };
      if (user.email != null && user.email !== "") newMember.email = user.email;
      if (user.displayName != null && user.displayName !== "") newMember.displayName = user.displayName;
      const updatedMembers = [...workspace.members, newMember];
      await updateWorkspace(workspaceId, { members: updatedMembers });
      await markInviteUsed(invite.id, user.uid);
      if (cancelled) return;

      setStatus("done");
      router.replace(`/dashboard/${workspaceId}?joined=1`);
    })();

    return () => {
      cancelled = true;
    };
  }, [workspaceId, token, user, authLoading, authSettled, router]);

  if (authLoading || status === "validating" || status === "joining") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] dark:bg-[#111418] p-6">
        <div className="text-center">
          <p className="text-[#111418] dark:text-white font-medium">
            {status === "joining" ? "Adding you to the workspace…" : "Loading…"}
          </p>
        </div>
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] dark:bg-[#111418] p-6">
        <p className="text-gray-700 dark:text-gray-300 text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] dark:bg-[#111418] p-6">
      <p className="text-gray-500 dark:text-gray-400">Redirecting…</p>
    </div>
  );
}
