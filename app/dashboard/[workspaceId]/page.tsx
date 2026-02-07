"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleInWorkspace } from "@/contexts/AuthContext";
import {
  getWorkspace,
  getTasksForWorkspace,
  getSprints,
  getValidationsForWorkspace,
  createValidationEntry,
} from "@/lib/firestore";
import { seedDummyData } from "@/lib/seed-dummy";
import type { StartupWorkspace, Task, Sprint, ValidationEntry } from "@/lib/types";

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [validations, setValidations] = useState<ValidationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationSprintId, setValidationSprintId] = useState("");
  const [validationType, setValidationType] = useState<ValidationEntry["type"]>("interview");
  const [validationSummary, setValidationSummary] = useState("");
  const [validationNotes, setValidationNotes] = useState("");
  const [addingValidation, setAddingValidation] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      getWorkspace(workspaceId),
      getTasksForWorkspace(workspaceId),
      getSprints(workspaceId),
      getValidationsForWorkspace(workspaceId),
    ])
      .then(([ws, t, sp, v]) => {
        setWorkspace(ws ?? null);
        setTasks(t);
        setSprints(sp);
        setValidations(v);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const role = workspace ? getRoleInWorkspace(user?.uid ?? undefined, workspace.members) : null;
  const isFounder = role === "founder";
  const canWrite = role === "founder" || role === "team_member";
  const displayName = user?.displayName?.trim();
  const firstName =
    (displayName && displayName.split(/\s+/)[0]) ||
    (user?.email && user.email.split("@")[0]) ||
    "Founder";

  const currentSprint = sprints.find((s) => !s.completed && s.locked) ?? sprints.find((s) => !s.completed);

  const refetch = () => {
    if (!workspaceId) return;
    Promise.all([
      getWorkspace(workspaceId),
      getTasksForWorkspace(workspaceId),
      getSprints(workspaceId),
      getValidationsForWorkspace(workspaceId),
    ]).then(([ws, t, sp, v]) => {
      setWorkspace(ws ?? null);
      setTasks(t);
      setSprints(sp);
      setValidations(v);
    });
  };

  const handleSeedDummy = async () => {
    if (!workspaceId || !user?.uid || seeding) return;
    setSeeding(true);
    try {
      await seedDummyData(workspaceId, user.uid);
      refetch();
    } finally {
      setSeeding(false);
    }
  };

  const handleAddValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !validationSprintId || !validationSummary.trim() || !user || !canWrite) return;
    setAddingValidation(true);
    try {
      const id = await createValidationEntry(
        workspaceId,
        validationSprintId,
        null,
        validationType,
        validationSummary.trim(),
        validationNotes.trim(),
        user.uid
      );
      setValidations((v) => [
        {
          id,
          workspaceId,
          sprintId: validationSprintId,
          milestoneId: null,
          type: validationType,
          summary: validationSummary.trim(),
          qualitativeNotes: validationNotes.trim(),
          createdBy: user.uid,
          createdAt: Date.now(),
        },
        ...v,
      ]);
      setValidationSprintId("");
      setValidationSummary("");
      setValidationNotes("");
    } finally {
      setAddingValidation(false);
    }
  };

  if (loading || !workspace) {
    return (
      <div className="py-12">
        {loading ? <p className="text-gray-500">Loading workspace…</p> : <p className="text-gray-500">Workspace not found.</p>}
      </div>
    );
  }

  const taskStats = {
    total: tasks.length,
    done: tasks.filter((t) => t.status === "done").length,
    inProgress: tasks.filter((t) => t.status === "in_progress").length,
    todo: tasks.filter((t) => t.status === "todo").length,
  };
  const completionPct = taskStats.total ? Math.round((taskStats.done / taskStats.total) * 100) : 0;
  const completedSprints = sprints.filter((s) => s.completed && s.completionStats);
  const chartData = completedSprints.slice(-6).map((s) => s.completionStats!.completionPercentage ?? 0);
  while (chartData.length < 6) chartData.unshift(0);

  return (
    <div className="space-y-8">
      {/* Top header bar */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Welcome back, {firstName}</h1>
          <p className="text-[#5f6368] dark:text-gray-400 text-sm mt-0.5">Your startup workspace</p>
        </div>
        <button
          type="button"
          onClick={handleSeedDummy}
          disabled={seeding || !user?.uid}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
        >
          {seeding ? "Seeding…" : "Seed dummy data"}
        </button>
      </div>

      {/* Four metric cards - reference style with icons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[24px]">check_circle</span>
            </div>
            <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Tasks completed</p>
          </div>
          <p className="text-3xl font-extrabold text-[#111418] dark:text-white mt-3">{taskStats.done}</p>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">{taskStats.total} total</p>
        </div>
        <div className="bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[24px]">timeline</span>
            </div>
            <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Total tasks</p>
          </div>
          <p className="text-3xl font-extrabold text-[#111418] dark:text-white mt-3">{taskStats.total}</p>
          <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-0.5">{taskStats.done} done</p>
        </div>
        <div className="bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[24px]">update</span>
            </div>
            <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Sprint progress</p>
          </div>
          <p className="text-3xl font-extrabold text-[#111418] dark:text-white mt-3">{completionPct}%</p>
          <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-0.5">this workspace</p>
        </div>
        <div className="bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[24px]">reviews</span>
            </div>
            <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Validation entries</p>
          </div>
          <p className="text-3xl font-extrabold text-[#111418] dark:text-white mt-3">{validations.length}</p>
          <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-0.5">logged</p>
        </div>
      </div>

      {/* Chart + Quick actions row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Execution over time chart card */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#111418] dark:text-white">Execution over time</h3>
            <span className="text-xs text-[#5f6368] dark:text-gray-400">Past 6 sprints</span>
          </div>
          <div className="flex items-end gap-2 h-36">
            {chartData.map((pct, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md min-h-[8px] transition-all bg-primary/80"
                  style={{ height: `${Math.max(8, (pct / 100) * 120)}px` }}
                />
                <span className="text-[10px] font-medium text-[#9aa0a6] dark:text-gray-500">S{i + 1}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-primary" />
              <span className="text-xs text-[#5f6368] dark:text-gray-400">Completion %</span>
            </div>
          </div>
        </div>

        {/* Quick actions - reference style */}
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-sm text-[#5f6368] dark:text-gray-400 uppercase tracking-wider">Quick actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/dashboard/${workspaceId}/sprints`}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e8eaed] dark:border-white/5 bg-white dark:bg-[#1a2530] shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
            >
              <span className="material-symbols-outlined text-primary text-[28px]">update</span>
              <span className="text-xs font-semibold text-[#111418] dark:text-white">New sprint</span>
            </Link>
            <button
              type="button"
              onClick={() => document.getElementById("log-validation")?.scrollIntoView({ behavior: "smooth" })}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e8eaed] dark:border-white/5 bg-white dark:bg-[#1a2530] shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
            >
              <span className="material-symbols-outlined text-primary text-[28px]">reviews</span>
              <span className="text-xs font-semibold text-[#111418] dark:text-white">Log validation</span>
            </button>
            </div>
        </div>
      </div>

      {/* Current sprint */}
      {currentSprint && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg mb-4">Current sprint</h3>
          <p className="text-sm text-gray-500 mb-2">
            {currentSprint.weekStartDate} → {currentSprint.weekEndDate}
            {currentSprint.locked && (
              <span className="ml-2 px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">
                Locked
              </span>
            )}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {currentSprint.taskIds.length} item{currentSprint.taskIds.length !== 1 ? "s" : ""} in this sprint.
          </p>
          <Link
            href={`/dashboard/${workspaceId}/sprints`}
            className="text-primary text-sm font-semibold hover:underline"
          >
            View sprint details →
          </Link>
        </div>
      )}

      {/* Add validation (team/founder) */}
      {canWrite && sprints.length > 0 && (
        <form id="log-validation" onSubmit={handleAddValidation} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4">
          <h3 className="font-bold text-lg">Log validation</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Sprint</label>
            <select
              value={validationSprintId}
              onChange={(e) => setValidationSprintId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            >
              <option value="">Select sprint</option>
              {sprints.map((s) => (
                <option key={s.id} value={s.id}>{s.weekStartDate} → {s.weekEndDate}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={validationType}
              onChange={(e) => setValidationType(e.target.value as ValidationEntry["type"])}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            >
              <option value="interview">Interview</option>
              <option value="survey">Survey</option>
              <option value="experiment">Experiment</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Summary</label>
            <input
              type="text"
              value={validationSummary}
              onChange={(e) => setValidationSummary(e.target.value)}
              placeholder="Brief summary"
              required
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              value={validationNotes}
              onChange={(e) => setValidationNotes(e.target.value)}
              placeholder="Qualitative notes"
              rows={2}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>
          <button type="submit" disabled={addingValidation} className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold disabled:opacity-50">
            {addingValidation ? "Adding…" : "Add validation"}
          </button>
        </form>
      )}

      {/* Recent validations */}
      {validations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg mb-4">Recent validation entries</h3>
          <ul className="space-y-3">
            {validations.slice(0, 5).map((v) => (
              <li key={v.id} className="p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                <p className="font-medium text-sm text-[#111418] dark:text-white">{v.summary}</p>
                <p className="text-xs text-gray-500 capitalize">{v.type} · {new Date(v.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
