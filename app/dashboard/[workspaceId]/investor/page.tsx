"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleInWorkspace } from "@/contexts/AuthContext";
import {
  getWorkspace,
  getSprints,
  getTasksForWorkspace,
  getValidationsForWorkspace,
} from "@/lib/firestore";
import { generateInvestorSummary } from "@/lib/ai-mock";
import type { InvestorSummary } from "@/lib/ai-mock";
import type { StartupWorkspace } from "@/lib/types";

export default function InvestorPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [summary, setSummary] = useState<InvestorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspace(workspaceId).then(setWorkspace);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !workspace) return;
    Promise.all([
      getTasksForWorkspace(workspaceId),
      getValidationsForWorkspace(workspaceId),
      getSprints(workspaceId),
    ]).then(([tasks, validations, sprints]) => {
      setSummary(
        generateInvestorSummary(
          workspace!.name,
          workspace!.stage,
          [],
          tasks,
          validations,
          sprints
        )
      );
      setLoading(false);
    });
  }, [workspaceId, workspace]);

  const role = workspace ? getRoleInWorkspace(user?.uid ?? undefined, workspace.members) : null;
  const isFounder = role === "founder";

  if (!workspace) {
    return (
      <div className="py-12">
        <p className="text-gray-500">Workspace not found.</p>
      </div>
    );
  }

  if (!isFounder) {
    return (
      <div className="py-12">
        <p className="text-amber-600 dark:text-amber-400">
          Only founders can view the investor snapshot.
        </p>
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <div className="py-12">
        <p className="text-gray-500">Loading investor summary…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Investor pitch outline</h1>
        <p className="text-gray-500 text-sm">
          Auto-generated from your startup data: problem, solution, traction, and roadmap.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-8">
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Problem</h3>
          <p className="text-[#111418] dark:text-white leading-relaxed">{summary.problem}</p>
        </section>
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Solution</h3>
          <p className="text-[#111418] dark:text-white leading-relaxed">{summary.solution}</p>
        </section>
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Traction</h3>
          <p className="text-[#111418] dark:text-white leading-relaxed">{summary.traction}</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <p className="text-gray-600 dark:text-gray-400">{summary.executionProgress}</p>
            <p className="text-gray-600 dark:text-gray-400">{summary.validationStatus}</p>
          </div>
        </section>
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-2">Roadmap</h3>
          <p className="text-[#111418] dark:text-white leading-relaxed">{summary.roadmap}</p>
        </section>
        <p className="text-xs text-gray-400">
          Generated at {new Date(summary.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
