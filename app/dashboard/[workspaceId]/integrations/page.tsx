"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkspace } from "@/lib/firestore";
import { useEffect, useState, useCallback } from "react";
import type { StartupWorkspace, WorkspaceIntegrationSafe } from "@/lib/types";

export default function IntegrationsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [integrations, setIntegrations] = useState<WorkspaceIntegrationSafe[]>([]);
  const [loading, setLoading] = useState(true);
  const [slackSetup, setSlackSetup] = useState<{ setupId: string; teamName: string; channels: { id: string; name: string }[] } | null>(null);
  const [channelSelect, setChannelSelect] = useState("");
  const [completing, setCompleting] = useState(false);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFounder = workspace?.members.some((m) => m.userId === user?.uid && m.role === "founder") ?? false;

  const fetchIntegrations = useCallback(async () => {
    if (!workspaceId || !user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/integrations?workspaceId=${encodeURIComponent(workspaceId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { integrations: WorkspaceIntegrationSafe[] };
        setIntegrations(data.integrations ?? []);
      }
    } catch {
      setIntegrations([]);
    }
  }, [workspaceId, user]);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspace(workspaceId)
      .then((ws) => setWorkspace(ws ?? null))
      .finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !user) return;
    fetchIntegrations();
  }, [workspaceId, user, fetchIntegrations]);

  const setupId = searchParams.get("slack_setup");
  useEffect(() => {
    if (!setupId || !user) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/slack/setup/${setupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          setError("Setup expired or you don’t have permission.");
          return;
        }
        const data = (await res.json()) as { teamName: string; channels: { id: string; name: string }[] };
        setSlackSetup({ setupId, teamName: data.teamName, channels: data.channels ?? [] });
      } catch {
        setError("Failed to load channel list.");
      }
    })();
  }, [setupId, user]);

  const slackError = searchParams.get("slack_error");
  useEffect(() => {
    if (slackError === "denied") setError("Slack authorization was cancelled.");
    else if (slackError === "exchange") setError("Slack connection failed. Try again.");
    else if (slackError === "config") setError("Server not configured for Slack.");
  }, [slackError]);

  const handleConnectSlack = () => {
    if (!workspaceId || !isFounder) return;
    window.location.href = `/api/slack/oauth?workspaceId=${encodeURIComponent(workspaceId)}`;
  };

  const handleCompleteSlack = async () => {
    if (!slackSetup || !channelSelect || !user) return;
    const ch = slackSetup.channels.find((c) => c.id === channelSelect);
    if (!ch) return;
    setCompleting(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch("/api/slack/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          setupId: slackSetup.setupId,
          channelId: ch.id,
          channelName: ch.name,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError((d as { error?: string }).error ?? "Failed to connect Slack.");
        return;
      }
      setSlackSetup(null);
      setChannelSelect("");
      await fetchIntegrations();
      window.history.replaceState({}, "", `/dashboard/${workspaceId}/integrations`);
    } finally {
      setCompleting(false);
    }
  };

  const handleDisconnect = async (integrationId: string) => {
    if (!workspaceId || !user || !isFounder) return;
    setDisconnecting(integrationId);
    try {
      const token = await user.getIdToken();
      const res = await fetch(
        `/api/integrations?workspaceId=${encodeURIComponent(workspaceId)}&integrationId=${encodeURIComponent(integrationId)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) await fetchIntegrations();
    } finally {
      setDisconnecting(null);
    }
  };

  if (loading || !workspace) {
    return (
      <div className="py-12">
        {loading ? <p className="text-gray-500">Loading…</p> : <p className="text-gray-500">Workspace not found.</p>}
      </div>
    );
  }

  const slackConnected = integrations.filter((i) => i.type === "slack");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Integrations</h1>
        <p className="text-[#5f6368] dark:text-gray-400 text-sm mt-0.5">
          Notify your team when execution events happen. Broadcast milestones and sprint updates to Slack.
        </p>
      </div>

      {error && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="shrink-0 text-amber-600 dark:text-amber-400 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {slackSetup ? (
        <div className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6">
          <h2 className="text-lg font-semibold text-[#111418] dark:text-white mb-2">Choose a channel</h2>
          <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-4">
            Select the Slack channel where Runway will post sprint and milestone updates for {slackSetup.teamName}.
          </p>
          {slackSetup.channels.length === 0 ? (
            <p className="text-sm text-amber-600 dark:text-amber-400">No channels available. Add the app to a channel in Slack first.</p>
          ) : (
            <>
              <select
                value={channelSelect}
                onChange={(e) => setChannelSelect(e.target.value)}
                className="w-full max-w-md rounded-lg border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 px-3 py-2 text-sm text-[#111418] dark:text-white"
              >
                <option value="">Select channel…</option>
                {slackSetup.channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                  </option>
                ))}
              </select>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleCompleteSlack}
                  disabled={!channelSelect || completing}
                  className="rounded-lg h-9 px-4 bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {completing ? "Connecting…" : "Connect channel"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSlackSetup(null);
                    setChannelSelect("");
                    window.history.replaceState({}, "", `/dashboard/${workspaceId}/integrations`);
                  }}
                  className="rounded-lg h-9 px-4 border border-[#e8eaed] dark:border-white/10 text-sm font-medium text-[#5f6368] dark:text-gray-400 hover:bg-[#f5f6f8] dark:hover:bg-white/5"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      ) : null}

      <div className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#111418] dark:text-white mb-2">Connected</h2>
        {slackConnected.length === 0 ? (
          <p className="text-sm text-[#5f6368] dark:text-gray-400">
            No integrations connected yet. Connect Slack below to broadcast execution events to your team.
          </p>
        ) : (
          <ul className="space-y-3">
            {slackConnected.map((int) => (
              <li
                key={int.id}
                className="flex items-center justify-between gap-4 rounded-xl border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-xl">chat</span>
                  </div>
                  <div>
                    <p className="font-medium text-[#111418] dark:text-white">Slack</p>
                    <p className="text-xs text-[#5f6368] dark:text-gray-400">
                      #{int.config.channelName}
                    </p>
                  </div>
                </div>
                {isFounder && (
                  <button
                    type="button"
                    onClick={() => handleDisconnect(int.id)}
                    disabled={disconnecting === int.id}
                    className="rounded-lg h-8 px-3 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  >
                    {disconnecting === int.id ? "Disconnecting…" : "Disconnect"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-semibold text-[#111418] dark:text-white mb-2">Available integrations</h2>
        <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-6">
          Connect Slack to post sprint and milestone updates to a channel. Other integrations coming later.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={handleConnectSlack}
            disabled={!isFounder}
            className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-left disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-2xl">chat</span>
            </div>
            <div className="w-full">
              <p className="font-semibold text-[#111418] dark:text-white text-sm">Slack</p>
              <p className="text-xs text-[#5f6368] dark:text-gray-400">Broadcast sprint and milestone updates to a channel</p>
            </div>
            <span className="text-xs font-medium text-primary">{isFounder ? "Connect" : "Founder only"}</span>
          </button>
          {[
            { name: "GitHub", icon: "code", desc: "Coming soon" },
            { name: "Google Calendar", icon: "event", desc: "Coming soon" },
            { name: "Notion", icon: "description", desc: "Coming soon" },
          ].map((item) => (
            <div
              key={item.name}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 opacity-70 cursor-not-allowed"
            >
              <div className="size-12 rounded-xl bg-gray-200 dark:bg-white/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-2xl">{item.icon}</span>
              </div>
              <div className="w-full">
                <p className="font-semibold text-[#111418] dark:text-white text-sm">{item.name}</p>
                <p className="text-xs text-[#5f6368] dark:text-gray-400">{item.desc}</p>
              </div>
              <span className="text-xs font-medium text-gray-400">Coming soon</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
