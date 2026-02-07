"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleInWorkspace } from "@/contexts/AuthContext";
import {
  getWorkspace,
  getMilestones,
  getTasksForWorkspace,
  getSprints,
  getValidationsForWorkspace,
  createMilestone,
  createTask,
  createValidationEntry,
  updateMilestone,
} from "@/lib/firestore";
import { getExecutionInsights, getValidationInsights } from "@/lib/ai-mock";
import type {
  StartupWorkspace,
  Milestone,
  MilestoneStatus,
  Task,
  Sprint,
  ValidationEntry,
} from "@/lib/types";

export default function WorkspaceOverviewPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [validations, setValidations] = useState<ValidationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneDesc, setNewMilestoneDesc] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskMilestoneId, setNewTaskMilestoneId] = useState("");
  const [addingMilestone, setAddingMilestone] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [validationSprintId, setValidationSprintId] = useState("");
  const [validationMilestoneId, setValidationMilestoneId] = useState("");
  const [validationType, setValidationType] = useState<ValidationEntry["type"]>("interview");
  const [validationSummary, setValidationSummary] = useState("");
  const [validationNotes, setValidationNotes] = useState("");
  const [addingValidation, setAddingValidation] = useState(false);
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);

  const handleMilestoneStatusChange = async (milestoneId: string, status: MilestoneStatus) => {
    if (!canWrite) return;
    setUpdatingMilestoneId(milestoneId);
    try {
      await updateMilestone(milestoneId, { status });
      setMilestones((prev) =>
        prev.map((m) => (m.id === milestoneId ? { ...m, status } : m))
      );
    } finally {
      setUpdatingMilestoneId(null);
    }
  };

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      getWorkspace(workspaceId),
      getMilestones(workspaceId),
      getTasksForWorkspace(workspaceId),
      getSprints(workspaceId),
      getValidationsForWorkspace(workspaceId),
    ])
      .then(([ws, ms, t, sp, v]) => {
        setWorkspace(ws ?? null);
        setMilestones(ms);
        setTasks(t);
        setSprints(sp);
        setValidations(v);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  const role = workspace ? getRoleInWorkspace(user?.uid ?? undefined, workspace.members) : null;
  const isFounder = role === "founder";
  const canWrite = role === "founder" || role === "team_member";

  const searchParams = useSearchParams();
  const fromOnboarding = searchParams.get("fromOnboarding") === "1";
  const currentSprint = sprints.find((s) => !s.completed && s.locked) ?? sprints.find((s) => !s.completed);
  const draftSprint = sprints.find((s) => !s.completed && !s.locked);
  const executionInsights = getExecutionInsights(milestones, tasks, sprints);
  const validationInsights = getValidationInsights(milestones, validations, sprints);

  const handleAddMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !newMilestoneTitle.trim() || !canWrite) return;
    setAddingMilestone(true);
    try {
      const id = await createMilestone(
        workspaceId,
        newMilestoneTitle.trim(),
        newMilestoneDesc.trim(),
        milestones.length
      );
      setMilestones((m) => [
        ...m,
        {
          id,
          workspaceId,
          title: newMilestoneTitle.trim(),
          description: newMilestoneDesc.trim(),
          status: "planned",
          progressPercentage: 0,
          taskIds: [],
          order: milestones.length,
          createdAt: Date.now(),
        },
      ]);
      setNewMilestoneTitle("");
      setNewMilestoneDesc("");
    } finally {
      setAddingMilestone(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !newTaskTitle.trim() || !newTaskMilestoneId || !canWrite) return;
    setAddingTask(true);
    try {
      const id = await createTask(
        workspaceId,
        newTaskMilestoneId,
        null,
        newTaskTitle.trim(),
        user?.uid ?? null
      );
      setTasks((t) => [
        ...t,
        {
          id,
          workspaceId,
          milestoneId: newTaskMilestoneId,
          sprintId: null,
          title: newTaskTitle.trim(),
          ownerId: user?.uid ?? null,
          status: "todo",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);
      setNewTaskTitle("");
      setNewTaskMilestoneId("");
    } finally {
      setAddingTask(false);
    }
  };

  const handleAddValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !validationSprintId || !validationMilestoneId || !validationSummary.trim() || !user || !canWrite) return;
    setAddingValidation(true);
    try {
      const id = await createValidationEntry(
        workspaceId,
        validationSprintId,
        validationMilestoneId,
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
          milestoneId: validationMilestoneId,
          type: validationType,
          summary: validationSummary.trim(),
          qualitativeNotes: validationNotes.trim(),
          createdBy: user.uid,
          createdAt: Date.now(),
        },
        ...v,
      ]);
      setValidationSprintId("");
      setValidationMilestoneId("");
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
      {fromOnboarding && (
        <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-[#f0f9ff] dark:bg-slate-800/50 p-4">
          <p className="text-sm text-[#0f172a] dark:text-white">
            This workspace was created from your pitch deck. Review and adjust before starting your sprint.
          </p>
          {draftSprint && (
            <Link
              href={`/dashboard/${workspaceId}/sprints`}
              className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
            >
              Review sprint →
            </Link>
          )}
        </div>
      )}

      {/* Top header bar */}
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Welcome back, Founder</h1>
        <p className="text-[#5f6368] dark:text-gray-400 text-sm mt-0.5">Your startup workspace</p>
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
            <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Milestones</p>
          </div>
          <p className="text-3xl font-extrabold text-[#111418] dark:text-white mt-3">
            {milestones.filter((m) => m.status === "completed").length}/{milestones.length}
          </p>
          <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-0.5">completed</p>
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
            <button
              type="button"
              onClick={() => document.getElementById("add-milestone")?.scrollIntoView({ behavior: "smooth" })}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e8eaed] dark:border-white/5 bg-white dark:bg-[#1a2530] shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
            >
              <span className="material-symbols-outlined text-primary text-[28px]">timeline</span>
              <span className="text-xs font-semibold text-[#111418] dark:text-white">Add milestone</span>
            </button>
            <button
              type="button"
              onClick={() => document.getElementById("add-task")?.scrollIntoView({ behavior: "smooth" })}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e8eaed] dark:border-white/5 bg-white dark:bg-[#1a2530] shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
            >
              <span className="material-symbols-outlined text-primary text-[28px]">add_task</span>
              <span className="text-xs font-semibold text-[#111418] dark:text-white">Add task</span>
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
          <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-4">
            {currentSprint.goals.slice(0, 5).map((g) => (
              <li key={g.id}>{g.text}</li>
            ))}
          </ul>
          <Link
            href={`/dashboard/${workspaceId}/sprints`}
            className="text-primary text-sm font-semibold hover:underline"
          >
            View sprint details →
          </Link>
        </div>
      )}

      {/* Add milestone (founder/team) */}
      {canWrite && (
        <form id="add-milestone" onSubmit={handleAddMilestone} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">New milestone</label>
            <input
              type="text"
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              placeholder="Milestone title"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              value={newMilestoneDesc}
              onChange={(e) => setNewMilestoneDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>
          <button type="submit" disabled={addingMilestone} className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold disabled:opacity-50">
            {addingMilestone ? "Adding…" : "Add milestone"}
          </button>
        </form>
      )}

      {/* Add task */}
      {canWrite && milestones.length > 0 && (
        <form id="add-task" onSubmit={handleAddTask} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium mb-1">New task</label>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            />
          </div>
          <div className="w-48">
            <select
              value={newTaskMilestoneId}
              onChange={(e) => setNewTaskMilestoneId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            >
              <option value="">Milestone</option>
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </div>
          <button type="submit" disabled={addingTask || !newTaskMilestoneId} className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold disabled:opacity-50">
            {addingTask ? "Adding…" : "Add task"}
          </button>
        </form>
      )}

      {/* Milestones */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg mb-4">Milestones</h3>
        <div className="space-y-3">
          {milestones.length === 0 ? (
            <p className="text-gray-500 text-sm">No milestones yet. Add one above.</p>
          ) : (
            milestones.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-2 h-2 shrink-0 rounded-full ${
                      m.status === "completed"
                        ? "bg-green-500"
                        : m.status === "active"
                        ? "bg-primary"
                        : "bg-gray-400"
                    }`}
                  />
                  <span className="font-medium text-[#111418] dark:text-white truncate">{m.title}</span>
                </div>
                {canWrite ? (
                  <select
                    value={m.status}
                    onChange={(e) => handleMilestoneStatusChange(m.id, e.target.value as MilestoneStatus)}
                    disabled={updatingMilestoneId === m.id}
                    className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-1.5 text-sm font-medium text-[#111418] dark:text-white disabled:opacity-50"
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Done</option>
                  </select>
                ) : (
                  <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase shrink-0">
                    {m.status}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add validation (team/founder) */}
      {canWrite && sprints.length > 0 && milestones.length > 0 && (
        <form id="log-validation" onSubmit={handleAddValidation} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 space-y-4">
          <h3 className="font-bold text-lg">Log validation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label className="block text-sm font-medium mb-1">Milestone</label>
              <select
                value={validationMilestoneId}
                onChange={(e) => setValidationMilestoneId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
              >
                <option value="">Select milestone</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
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

      {/* AI insights */}
      {(executionInsights.length > 0 || validationInsights.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg mb-4">Insights</h3>
          <div className="space-y-3">
            {executionInsights.slice(0, 3).map((i) => (
              <div
                key={i.id}
                className="flex gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800"
              >
                <span className="material-symbols-outlined text-amber-600">insights</span>
                <div>
                  <p className="font-semibold text-sm text-[#111418] dark:text-white">{i.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{i.description}</p>
                </div>
              </div>
            ))}
            {validationInsights.slice(0, 2).map((i) => (
              <div
                key={i.id}
                className="flex gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"
              >
                <span className="material-symbols-outlined text-primary">biotech</span>
                <div>
                  <p className="font-semibold text-sm text-[#111418] dark:text-white">{i.title}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">{i.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <Link
          href={`/dashboard/${workspaceId}/sprints`}
          className="inline-flex items-center gap-2 rounded-lg h-10 px-4 bg-primary/10 text-primary text-sm font-bold hover:bg-primary/20"
        >
          <span className="material-symbols-outlined text-lg">update</span>
          Sprints
        </Link>
        <Link
          href={`/dashboard/${workspaceId}/analytics`}
          className="inline-flex items-center gap-2 rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span className="material-symbols-outlined text-lg">analytics</span>
          Analytics
        </Link>
        {isFounder && (
          <Link
            href={`/dashboard/${workspaceId}/investor`}
            className="inline-flex items-center gap-2 rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <span className="material-symbols-outlined text-lg">summarize</span>
            Investor view
          </Link>
        )}
        <Link
          href={`/dashboard/${workspaceId}/ledger`}
          className="inline-flex items-center gap-2 rounded-lg h-10 px-4 bg-gray-100 dark:bg-gray-800 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700"
        >
          <span className="material-symbols-outlined text-lg">account_tree</span>
          Ledger
        </Link>
      </div>
    </div>
  );
}
