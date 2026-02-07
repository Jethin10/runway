"use client";

import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getWorkspace } from "@/lib/firestore";
import { useEffect, useState } from "react";
import type { StartupWorkspace } from "@/lib/types";

export default function IntegrationsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspace(workspaceId).then((ws) => {
      setWorkspace(ws ?? null);
    }).finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading || !workspace) {
    return (
      <div className="py-12">
        {loading ? <p className="text-gray-500">Loading…</p> : <p className="text-gray-500">Workspace not found.</p>}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Integrations</h1>
        <p className="text-[#5f6368] dark:text-gray-400 text-sm mt-0.5">
          Connect tools like Slack, GitHub, and more to your workspace.
        </p>
      </div>

      <div className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6 md:p-8">
        <h2 className="text-lg font-semibold text-[#111418] dark:text-white mb-2">Available integrations</h2>
        <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-6">
          Add and manage integrations here. Connect your favorite tools to sync tasks, notifications, and data.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[
            { name: "Slack", icon: "chat", desc: "Get notifications in channels" },
            { name: "GitHub", icon: "code", desc: "Link repos and PRs" },
            { name: "Google Calendar", icon: "event", desc: "Sync deadlines" },
            { name: "Notion", icon: "description", desc: "Import docs" },
          ].map((item) => (
            <button
              key={item.name}
              type="button"
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-[#e8eaed] dark:border-white/10 bg-[#f5f6f8] dark:bg-white/5 hover:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors text-left"
            >
              <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-2xl">{item.icon}</span>
              </div>
              <div className="w-full">
                <p className="font-semibold text-[#111418] dark:text-white text-sm">{item.name}</p>
                <p className="text-xs text-[#5f6368] dark:text-gray-400">{item.desc}</p>
              </div>
              <span className="text-xs font-medium text-primary">Connect</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530] shadow-sm p-6">
        <h2 className="text-lg font-semibold text-[#111418] dark:text-white mb-2">Connected</h2>
        <p className="text-sm text-[#5f6368] dark:text-gray-400">
          No integrations connected yet. Click an integration above to connect.
        </p>
      </div>
    </div>
  );
}
