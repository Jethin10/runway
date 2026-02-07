"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleInWorkspace } from "@/contexts/AuthContext";
import {
  getWorkspace,
  getSprints,
  getMilestones,
  getTasksForWorkspace,
  getValidationsForWorkspace,
  getFundingRounds,
  getFundingAllocations,
  getSpendLogs,
} from "@/lib/firestore";
import { generateInvestorSummary } from "@/lib/ai-mock";
import type { InvestorSummary } from "@/lib/ai-mock";
import type { StartupWorkspace, Milestone, Task, Sprint, ValidationEntry, FundingRound, FundingAllocation, SpendLog } from "@/lib/types";

export default function InvestorPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [validations, setValidations] = useState<ValidationEntry[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [summary, setSummary] = useState<InvestorSummary | null>(null);
  const [generatedBy, setGeneratedBy] = useState<"openai" | "rule-based">("rule-based");
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([]);
  const [allocations, setAllocations] = useState<FundingAllocation[]>([]);
  const [spendLogs, setSpendLogs] = useState<SpendLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState<"outline" | "metrics" | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    getWorkspace(workspaceId).then(setWorkspace);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || !workspace) return;
    Promise.all([
      getMilestones(workspaceId),
      getTasksForWorkspace(workspaceId),
      getValidationsForWorkspace(workspaceId),
      getSprints(workspaceId),
      getFundingRounds(workspaceId),
      getFundingAllocations(workspaceId),
      getSpendLogs(workspaceId),
    ]).then(async ([milestonesData, tasksData, validationsData, sprintsData, roundsData, allocationsData, spendLogsData]) => {
      setFundingRounds(roundsData);
      setAllocations(allocationsData);
      setSpendLogs(spendLogsData);
      setMilestones(milestonesData);
      setTasks(tasksData);
      setValidations(validationsData);
      setSprints(sprintsData);
      try {
        const res = await fetch("/api/generate-investor-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspace: { name: workspace!.name, stage: workspace!.stage },
            milestones: milestonesData.map((m) => ({
              title: m.title,
              description: m.description,
              status: m.status,
              progressPercentage: m.progressPercentage,
              taskIds: m.taskIds,
            })),
            tasks: tasksData.map((t) => ({ title: t.title, status: t.status, milestoneId: t.milestoneId })),
            validations: validationsData.map((v) => ({
              type: v.type,
              summary: v.summary,
              qualitativeNotes: v.qualitativeNotes,
              milestoneId: v.milestoneId,
            })),
            sprints: sprintsData.map((s) => ({
              weekStartDate: s.weekStartDate,
              weekEndDate: s.weekEndDate,
              goals: s.goals,
              taskIds: s.taskIds,
              locked: s.locked,
              completed: s.completed,
              completionStats: s.completionStats,
            })),
          }),
        });
        const data = await res.json();
        if (data.summary) {
          setSummary(data.summary);
          setGeneratedBy(data.generatedBy === "openai" ? "openai" : "rule-based");
        } else {
          const fallback = generateInvestorSummary(
            workspace!.name,
            workspace!.stage,
            milestonesData,
            tasksData,
            validationsData,
            sprintsData
          );
          setSummary(fallback);
          setGeneratedBy("rule-based");
        }
      } catch {
        const fallback = generateInvestorSummary(
          workspace!.name,
          workspace!.stage,
          milestonesData,
          tasksData,
          validationsData,
          sprintsData
        );
        setSummary(fallback);
        setGeneratedBy("rule-based");
      } finally {
        setLoading(false);
      }
    });
  }, [workspaceId, workspace]);

  const role = workspace ? getRoleInWorkspace(user?.uid ?? undefined, workspace.members) : null;
  const isFounder = role === "founder";
  const canViewInvestor = role === "founder" || role === "investor";

  // Derived metrics
  const completedMilestones = milestones.filter((m) => m.status === "completed").length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const completedSprints = sprints.filter((s) => s.completed).length;
  const avgSprintPct =
    sprints.filter((s) => s.completed && s.completionStats).length > 0
      ? Math.round(
          sprints
            .filter((s) => s.completed && s.completionStats)
            .reduce((a, s) => a + (s.completionStats!.completionPercentage ?? 0), 0) /
            sprints.filter((s) => s.completed && s.completionStats).length
        )
      : 0;
  const upcomingMilestones = milestones
    .filter((m) => m.status !== "completed")
    .slice(0, 5)
    .map((m) => m.title);

  const totalRaised = fundingRounds.reduce((s, r) => s + r.amount, 0);
  const totalSpend = spendLogs.reduce((s, x) => s + x.amount, 0);
  const allocationByCategory = allocations.reduce<Record<string, number>>((acc, a) => {
    acc[a.category] = (acc[a.category] ?? 0) + a.allocatedAmount;
    return acc;
  }, {});
  const fundedCategoriesWithMilestones = milestones
    .filter((m) => m.status === "completed" && m.fundingCategory)
    .map((m) => ({ title: m.title, category: m.fundingCategory! }));
  const avgMonthlySpend =
    spendLogs.length > 0
      ? totalSpend /
        Math.max(
          1,
          (Date.now() - Math.min(...spendLogs.map((x) => x.date))) / (30 * 24 * 60 * 60 * 1000)
        )
      : 0;
  const runwayMonths =
    avgMonthlySpend > 0 && totalRaised > totalSpend
      ? (totalRaised - totalSpend) / avgMonthlySpend
      : null;

  const checklist = {
    pitchOutline: !!summary,
    tractionTracked: totalTasks > 0 || completedMilestones > 0,
    milestonesDefined: milestones.length > 0,
    validationLogged: validations.length > 0,
    workspaceSetup: !!workspace?.name,
  };

  const copyOutline = useCallback(() => {
    if (!summary) return;
    const text = [
      "Problem",
      summary.problem,
      "",
      "Solution",
      summary.solution,
      "",
      "Traction",
      summary.traction,
      summary.executionProgress,
      summary.validationStatus,
      "",
      "Roadmap",
      summary.roadmap,
    ].join("\n");
    void navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback("outline");
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  }, [summary]);

  const copyMetrics = useCallback(() => {
    const lines = [
      `${workspace?.name ?? "Startup"} — ${workspace?.stage ?? "Idea"}`,
      `Milestones completed: ${completedMilestones} / ${milestones.length}`,
      `Tasks: ${doneTasks} / ${totalTasks} (${taskPct}%)`,
      `Sprints closed: ${completedSprints} (avg ${avgSprintPct}% completion)`,
      `Validation entries: ${validations.length}`,
      upcomingMilestones.length ? `Upcoming: ${upcomingMilestones.join(" → ")}` : "",
    ].filter(Boolean);
    void navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopyFeedback("metrics");
      setTimeout(() => setCopyFeedback(null), 2000);
    });
  }, [workspace, completedMilestones, milestones.length, doneTasks, totalTasks, taskPct, completedSprints, avgSprintPct, validations.length, upcomingMilestones]);

  if (!workspace) {
    return (
      <div className="py-12">
        <p className="text-gray-500">Workspace not found.</p>
      </div>
    );
  }

  if (!canViewInvestor) {
    return (
      <div className="py-12">
        <p className="text-amber-600 dark:text-amber-400">
          Only founders and investors can view this page.
        </p>
      </div>
    );
  }

  if (loading || !summary) {
    return (
      <div className="py-12">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">
          Prepare for investor readiness and future growth
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Get investor-ready and plan for scale using your Runway data. Use this outline when preparing for investor calls or updating your pitch.
        </p>
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Stage</p>
          <p className="text-lg font-bold text-[#111418] dark:text-white mt-0.5">{workspace.stage}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Milestones</p>
          <p className="text-lg font-bold text-[#111418] dark:text-white mt-0.5">{completedMilestones} / {milestones.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Tasks done</p>
          <p className="text-lg font-bold text-[#111418] dark:text-white mt-0.5">{doneTasks} / {totalTasks} ({taskPct}%)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Sprints · Validation</p>
          <p className="text-lg font-bold text-[#111418] dark:text-white mt-0.5">{completedSprints} closed · {validations.length} entries</p>
        </div>
      </div>

      {/* Capital Usage Summary */}
      {(totalRaised > 0 || totalSpend > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Capital usage summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total raised</p>
              <p className="text-lg font-bold text-[#111418] dark:text-white mt-0.5">
                {fundingRounds[0]?.currency ?? "INR"} {totalRaised.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total logged spend</p>
              <p className="text-lg font-bold text-[#111418] dark:text-white mt-0.5">
                {fundingRounds[0]?.currency ?? "INR"} {totalSpend.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Runway (estimate)</p>
              <p className="text-lg font-bold text-[#111418] dark:text-white mt-0.5">
                {runwayMonths != null ? `≈ ${runwayMonths.toFixed(1)} months` : "—"}
              </p>
            </div>
          </div>
          {Object.keys(allocationByCategory).length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Allocation breakdown</p>
              <ul className="text-sm text-[#111418] dark:text-white space-y-1">
                {Object.entries(allocationByCategory).map(([cat, amt]) => (
                  <li key={cat}>
                    {cat}: {fundingRounds[0]?.currency ?? "INR"} {amt.toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {fundedCategoriesWithMilestones.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Milestones delivered (funded categories)</p>
              <ul className="text-sm text-[#111418] dark:text-white space-y-1">
                {fundedCategoriesWithMilestones.slice(0, 8).map((m, i) => (
                  <li key={i}>
                    {m.title} ({m.category})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Readiness checklist */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">Readiness checklist</h2>
        <ul className="space-y-2">
          <li className="flex items-center gap-3 text-sm">
            <span className={`material-symbols-outlined text-lg ${checklist.pitchOutline ? "text-green-600 dark:text-green-400" : "text-gray-300 dark:text-gray-600"}`}>
              {checklist.pitchOutline ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className={checklist.pitchOutline ? "text-[#111418] dark:text-white" : "text-gray-500"}>Pitch outline ready</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className={`material-symbols-outlined text-lg ${checklist.tractionTracked ? "text-green-600 dark:text-green-400" : "text-gray-300 dark:text-gray-600"}`}>
              {checklist.tractionTracked ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className={checklist.tractionTracked ? "text-[#111418] dark:text-white" : "text-gray-500"}>Traction tracked (tasks & milestones)</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className={`material-symbols-outlined text-lg ${checklist.milestonesDefined ? "text-green-600 dark:text-green-400" : "text-gray-300 dark:text-gray-600"}`}>
              {checklist.milestonesDefined ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className={checklist.milestonesDefined ? "text-[#111418] dark:text-white" : "text-gray-500"}>Milestones defined</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className={`material-symbols-outlined text-lg ${checklist.validationLogged ? "text-green-600 dark:text-green-400" : "text-gray-300 dark:text-gray-600"}`}>
              {checklist.validationLogged ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className={checklist.validationLogged ? "text-[#111418] dark:text-white" : "text-gray-500"}>Validation logged (interviews / experiments)</span>
          </li>
          <li className="flex items-center gap-3 text-sm">
            <span className={`material-symbols-outlined text-lg ${checklist.workspaceSetup ? "text-green-600 dark:text-green-400" : "text-gray-300 dark:text-gray-600"}`}>
              {checklist.workspaceSetup ? "check_circle" : "radio_button_unchecked"}
            </span>
            <span className={checklist.workspaceSetup ? "text-[#111418] dark:text-white" : "text-gray-500"}>Workspace set up</span>
          </li>
        </ul>
      </div>

      {/* Pitch outline + Copy */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#111418] dark:text-white">Pitch outline</h2>
          <div className="flex items-center gap-2">
            {generatedBy === "openai" && (
              <span className="inline-flex items-center gap-1 rounded bg-primary/10 text-primary px-2 py-1 text-xs font-medium">
                AI-generated
              </span>
            )}
            <button
              type="button"
              onClick={copyOutline}
              className="inline-flex items-center gap-1.5 rounded-lg h-9 px-3 bg-gray-100 dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <span className="material-symbols-outlined text-lg">content_copy</span>
              {copyFeedback === "outline" ? "Copied" : "Copy outline"}
            </button>
          </div>
        </div>
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

      {/* Next steps / Future growth */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="text-lg font-bold text-[#111418] dark:text-white">Next steps & future growth</h2>
          <button
            type="button"
            onClick={copyMetrics}
            className="inline-flex items-center gap-1.5 rounded-lg h-9 px-3 bg-gray-100 dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <span className="material-symbols-outlined text-lg">content_copy</span>
            {copyFeedback === "metrics" ? "Copied" : "Copy metrics"}
          </button>
        </div>
        {upcomingMilestones.length > 0 ? (
          <ul className="space-y-2">
            {upcomingMilestones.map((title, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-[#111418] dark:text-white">
                <span className="material-symbols-outlined text-gray-400 text-lg">arrow_forward</span>
                {title}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming milestones. Add milestones on Overview to see your roadmap here.</p>
        )}
      </div>
    </div>
  );
}
