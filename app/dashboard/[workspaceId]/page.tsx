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
  updateMilestone,
} from "@/lib/firestore";
import { getExecutionInsights, getValidationInsights } from "@/lib/ai-mock";
import { notifySlack } from "@/lib/slack-notify-client";
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
  const [updatingMilestoneId, setUpdatingMilestoneId] = useState<string | null>(null);
  const [showAddMilestoneForm, setShowAddMilestoneForm] = useState(false);
  const [showAddTaskForm, setShowAddTaskForm] = useState(false);
  const [expandedMilestoneIds, setExpandedMilestoneIds] = useState<Set<string>>(new Set());
  const [validationLinkCopiedId, setValidationLinkCopiedId] = useState<string | null>(null);

  const handleMilestoneStatusChange = async (milestoneId: string, status: MilestoneStatus) => {
    if (!canWrite) return;
    setUpdatingMilestoneId(milestoneId);
    try {
      await updateMilestone(milestoneId, { status });
      const prev = milestones.find((m) => m.id === milestoneId);
      setMilestones((p) =>
        p.map((m) => (m.id === milestoneId ? { ...m, status } : m))
      );
      if (status === "completed" && prev) {
        const sprintLabel = currentSprint ? `Week ${currentSprint.weekStartDate}` : undefined;
        notifySlack(user ?? null, workspaceId, "milestone_completed", {
          milestoneTitle: prev.title,
          sprintLabelForMilestone: sprintLabel,
        });
      }
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
  const currentMember = workspace?.members.find((m) => m.userId === user?.uid);
  const firstName =
    currentMember?.displayName?.trim().split(/\s+/)[0] ||
    user?.displayName?.trim().split(/\s+/)[0] ||
    user?.email?.split("@")[0] ||
    "there";

  const searchParams = useSearchParams();
  const fromOnboarding = searchParams.get("fromOnboarding") === "1";
  const justJoined = searchParams.get("joined") === "1";
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
      setShowAddMilestoneForm(false);
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
      setShowAddTaskForm(false);
    } finally {
      setAddingTask(false);
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
  const hasChartData = chartData.some((p) => p > 0);

  const completedMilestonesCount = milestones.filter((m) => m.status === "completed").length;
  const externalValidations = validations.filter((v) => v.origin === "external_link");
  const internalValidations = validations.filter((v) => v.origin !== "external_link");

  function getSprintProgress(sprint: Sprint) {
    const start = new Date(sprint.weekStartDate).getTime();
    const end = new Date(sprint.weekEndDate).getTime();
    const now = Date.now();
    if (now < start) return { pct: 0, daysRemaining: Math.ceil((end - now) / 86400000) };
    if (now > end) return { pct: 100, daysRemaining: 0 };
    const pct = Math.round(((now - start) / (end - start)) * 100);
    const daysRemaining = Math.ceil((end - now) / 86400000);
    return { pct, daysRemaining };
  }
  const sprintProgress = currentSprint ? getSprintProgress(currentSprint) : null;

  function toggleMilestoneExpanded(id: string) {
    setExpandedMilestoneIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function getTasksForMilestone(milestoneId: string) {
    const list = tasks.filter((t) => t.milestoneId === milestoneId);
    const done = list.filter((t) => t.status === "done").length;
    return { list, done, total: list.length };
  }

  function copyValidationLink(milestoneId: string) {
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/validate/${workspaceId}/${milestoneId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setValidationLinkCopiedId(milestoneId);
      setTimeout(() => setValidationLinkCopiedId(null), 2000);
    });
  }

  return (
    <div className="space-y-12">
      {justJoined && (
        <div className="rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
          <p className="text-sm text-green-800 dark:text-green-200 font-medium">You&apos;ve joined the workspace.</p>
        </div>
      )}
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

      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Welcome back, {firstName}</h1>
        <p className="text-[#5f6368] dark:text-gray-400 text-sm mt-0.5">Your startup workspace</p>
      </div>

      {/* Metric cards — clearer labels, more spacing */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
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
        <a
          href="#milestones"
          className="bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-shadow block text-left hover:border-primary/30"
        >
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[24px]">timeline</span>
            </div>
            <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Milestones</p>
          </div>
          <p className="text-3xl font-extrabold text-[#111418] dark:text-white mt-3">
            {completedMilestonesCount}/{milestones.length}
          </p>
          <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-0.5">{milestones.length ? "completed · click to view" : "Add milestones to get started"}</p>
        </a>
        <div className="bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[24px]">update</span>
            </div>
            <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Sprint completion</p>
          </div>
          <p className="text-3xl font-extrabold text-[#111418] dark:text-white mt-3">{completionPct}%</p>
          <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-0.5">task completion in this workspace</p>
        </div>
        <div className="bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-shadow" title={externalValidations.length > 0 ? `${externalValidations.length} responses collected via public validation link` : undefined}>
          <div className="flex items-start justify-between">
            <div className="p-2 rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary text-[24px]">reviews</span>
            </div>
            <p className="text-xs font-medium text-[#5f6368] dark:text-gray-400">Validation coverage</p>
          </div>
          <p className="text-3xl font-extrabold text-[#111418] dark:text-white mt-3">
            {externalValidations.length > 0 ? `External (${externalValidations.length})` : validations.length}
          </p>
          <p className="text-xs text-[#5f6368] dark:text-gray-400 mt-0.5">
            {validations.length === 0
              ? "No feedback yet"
              : externalValidations.length > 0
              ? `${internalValidations.length} internal · ${externalValidations.length} via link`
              : "internal only"}
          </p>
        </div>
      </div>

      {/* Chart + Quick actions row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#1a2530] rounded-2xl border border-[#e8eaed] dark:border-white/5 p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#111418] dark:text-white mb-1">Execution over time</h2>
          <span className="text-xs text-[#5f6368] dark:text-gray-400">Past 6 sprints</span>
          {hasChartData ? (
            <>
              <div className="flex items-end gap-2 h-36 mt-4">
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
            </>
          ) : (
            <div className="mt-6 py-8 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 text-center">
              <p className="text-[#111418] dark:text-white font-medium">No tasks tracked yet</p>
              <p className="text-sm text-[#5f6368] dark:text-gray-400 mt-1 max-w-sm mx-auto">
                Create a sprint, add tasks, and complete them to see your execution trend here.
              </p>
              <Link
                href={`/dashboard/${workspaceId}/sprints`}
                className="inline-flex items-center gap-2 mt-4 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90"
              >
                <span className="material-symbols-outlined text-lg">update</span>
                Go to Sprints
              </Link>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-bold text-[#111418] dark:text-white">Quick actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link
              href={`/dashboard/${workspaceId}/sprints`}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e8eaed] dark:border-white/5 bg-white dark:bg-[#1a2530] shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
            >
              <span className="material-symbols-outlined text-primary text-[28px]">update</span>
              <span className="text-xs font-semibold text-[#111418] dark:text-white">New sprint</span>
            </Link>
            {canWrite && (
              <button
                type="button"
                onClick={() => { setShowAddMilestoneForm(true); setShowAddTaskForm(false); }}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e8eaed] dark:border-white/5 bg-white dark:bg-[#1a2530] shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
              >
                <span className="material-symbols-outlined text-primary text-[28px]">timeline</span>
                <span className="text-xs font-semibold text-[#111418] dark:text-white">Add milestone</span>
              </button>
            )}
            {canWrite && milestones.length > 0 && (
              <button
                type="button"
                onClick={() => { setShowAddTaskForm(true); setShowAddMilestoneForm(false); }}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-[#e8eaed] dark:border-white/5 bg-white dark:bg-[#1a2530] shadow-sm hover:shadow-md hover:border-primary/30 transition-all text-center"
              >
                <span className="material-symbols-outlined text-primary text-[28px]">add_task</span>
                <span className="text-xs font-semibold text-[#111418] dark:text-white">Add task</span>
              </button>
            )}
          </div>

          {canWrite && showAddMilestoneForm && (
            <form onSubmit={handleAddMilestone} className="p-4 rounded-xl border border-[#e8eaed] dark:border-white/10 bg-gray-50 dark:bg-white/5 space-y-3">
              <h3 className="text-sm font-bold text-[#111418] dark:text-white">New milestone</h3>
              <input
                type="text"
                value={newMilestoneTitle}
                onChange={(e) => setNewMilestoneTitle(e.target.value)}
                placeholder="Milestone title"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={newMilestoneDesc}
                onChange={(e) => setNewMilestoneDesc(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button type="submit" disabled={addingMilestone || !newMilestoneTitle.trim()} className="rounded-lg h-9 px-3 bg-primary text-white text-sm font-bold disabled:opacity-50">
                  {addingMilestone ? "Adding…" : "Add"}
                </button>
                <button type="button" onClick={() => setShowAddMilestoneForm(false)} className="rounded-lg h-9 px-3 bg-gray-200 dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          )}
          {canWrite && showAddTaskForm && milestones.length > 0 && (
            <form onSubmit={handleAddTask} className="p-4 rounded-xl border border-[#e8eaed] dark:border-white/10 bg-gray-50 dark:bg-white/5 space-y-3">
              <h3 className="text-sm font-bold text-[#111418] dark:text-white">New task</h3>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              />
              <select
                value={newTaskMilestoneId}
                onChange={(e) => setNewTaskMilestoneId(e.target.value)}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm"
              >
                <option value="">Select milestone</option>
                {milestones.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <button type="submit" disabled={addingTask || !newTaskTitle.trim() || !newTaskMilestoneId} className="rounded-lg h-9 px-3 bg-primary text-white text-sm font-bold disabled:opacity-50">
                  {addingTask ? "Adding…" : "Add"}
                </button>
                <button type="button" onClick={() => setShowAddTaskForm(false)} className="rounded-lg h-9 px-3 bg-gray-200 dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-medium">
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Current sprint — prominent section with progress */}
      {currentSprint && (
        <div className="bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/20 dark:border-primary/30 p-6">
          <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-1">Current sprint</h2>
          <p className="text-sm text-[#5f6368] dark:text-gray-400 mb-4">
            {currentSprint.weekStartDate} → {currentSprint.weekEndDate}
            {currentSprint.locked && (
              <span className="ml-2 px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold">
                Locked
              </span>
            )}
          </p>
          {sprintProgress !== null && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-[#5f6368] dark:text-gray-400 mb-1">
                <span>Sprint timeline</span>
                <span>{sprintProgress.daysRemaining} days remaining</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${sprintProgress.pct}%` }}
                />
              </div>
            </div>
          )}
          {currentSprint.goals.length > 0 && (
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-4">
              {currentSprint.goals.slice(0, 5).map((g) => (
                <li key={g.id}>{g.text}</li>
              ))}
            </ul>
          )}
          <Link
            href={`/dashboard/${workspaceId}/sprints`}
            className="text-primary text-sm font-semibold hover:underline inline-flex items-center gap-1"
          >
            View sprint details
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
          </Link>
        </div>
      )}

      {/* Empty state when no tasks and no milestones */}
      {taskStats.total === 0 && milestones.length === 0 && canWrite && (
        <div className="bg-[#f0f9ff] dark:bg-primary/10 rounded-2xl border border-primary/20 p-8 text-center">
          <h2 className="text-lg font-bold text-[#111418] dark:text-white">Get started</h2>
          <p className="text-sm text-[#5f6368] dark:text-gray-400 mt-2 max-w-md mx-auto">
            Create your first milestone to break down your goals, then add tasks to track execution. You can also create a sprint and assign tasks to it.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => { setShowAddMilestoneForm(true); setShowAddTaskForm(false); }}
              className="inline-flex items-center gap-2 rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90"
            >
              <span className="material-symbols-outlined text-lg">timeline</span>
              Add first milestone
            </button>
            <Link
              href={`/dashboard/${workspaceId}/sprints`}
              className="inline-flex items-center gap-2 rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700 text-[#111418] dark:text-white text-sm font-bold hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              <span className="material-symbols-outlined text-lg">update</span>
              Go to Sprints
            </Link>
          </div>
        </div>
      )}

      {/* Milestones — expandable with tasks and progress */}
      <div id="milestones" className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 scroll-mt-4">
        <h2 className="text-lg font-bold text-[#111418] dark:text-white mb-4">Milestones</h2>
        <div className="space-y-2">
          {milestones.length === 0 ? (
            <p className="text-gray-500 text-sm py-4">
              No milestones yet. Use <strong>Quick actions</strong> above to add your first milestone.
            </p>
          ) : (
            milestones.map((m) => {
              const { list: milestoneTasks, done: tasksDone, total: tasksTotal } = getTasksForMilestone(m.id);
              const isExpanded = expandedMilestoneIds.has(m.id);
              return (
                <div
                  key={m.id}
                  className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleMilestoneExpanded(m.id)}
                    className="w-full flex items-center justify-between gap-4 p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="material-symbols-outlined text-lg text-gray-400">
                        {isExpanded ? "expand_less" : "expand_more"}
                      </span>
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
                      <span className="text-xs text-[#5f6368] dark:text-gray-400 shrink-0">
                        {tasksTotal > 0 ? `${tasksDone}/${tasksTotal} tasks` : "No tasks"}
                      </span>
                    </div>
                    {canWrite ? (
                      <select
                        value={m.status}
                        onClick={(e) => e.stopPropagation()}
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
                  </button>
                  {isExpanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 px-3 py-3 pl-11 space-y-3">
                      {milestoneTasks.length === 0 ? (
                        <p className="text-sm text-gray-500">No tasks in this milestone. Add one via Quick actions.</p>
                      ) : (
                        <ul className="space-y-1.5">
                          {milestoneTasks.map((t) => (
                            <li key={t.id} className="flex items-center gap-2 text-sm">
                              <span className={`material-symbols-outlined text-lg ${
                                t.status === "done" ? "text-green-600 dark:text-green-400" : "text-gray-400"
                              }`}>
                                {t.status === "done" ? "check_circle" : "radio_button_unchecked"}
                              </span>
                              <span className={t.status === "done" ? "text-gray-500 dark:text-gray-400 line-through" : "text-[#111418] dark:text-white"}>
                                {t.title}
                              </span>
                              <span className="text-xs text-[#5f6368] dark:text-gray-400 uppercase">{t.status.replace("_", " ")}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {canWrite && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); copyValidationLink(m.id); }}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                          >
                            <span className="material-symbols-outlined text-lg">link</span>
                            {validationLinkCopiedId === m.id ? "Link copied" : "Share validation link"}
                          </button>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Collect external feedback for this milestone. No login required for respondents.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Validation: external feedback vs internal notes */}
      {(externalValidations.length > 0 || internalValidations.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-[#111418] dark:text-white mb-4">Validation</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            External feedback from the validation link; internal notes from the team.
          </p>

          {externalValidations.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">External feedback</h3>
              <ul className="space-y-3">
                {externalValidations.map((v) => (
                  <li key={v.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      {v.sourceType && (
                        <span className="font-medium capitalize">{v.sourceType.replace("_", " ")}</span>
                      )}
                      {v.confidenceScore != null && (
                        <span>Confidence: {v.confidenceScore}/5</span>
                      )}
                      <span>{new Date(v.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-[#111418] dark:text-white whitespace-pre-wrap">
                      {v.feedbackText ?? v.summary}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {internalValidations.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Internal notes</h3>
              <ul className="space-y-3">
                {internalValidations.map((v) => (
                  <li key={v.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span className="font-medium capitalize">{v.type}</span>
                      <span>{new Date(v.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-[#111418] dark:text-white">{v.summary}</p>
                    {v.qualitativeNotes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{v.qualitativeNotes}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Hint when milestones exist but no tasks yet */}
      {taskStats.total === 0 && milestones.length > 0 && canWrite && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 dark:bg-primary/10 p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#111418] dark:text-white">
            Add tasks to your milestones to track execution and see progress on the chart.
          </p>
          <button
            type="button"
            onClick={() => { setShowAddTaskForm(true); setShowAddMilestoneForm(false); }}
            className="inline-flex items-center gap-1.5 rounded-lg h-9 px-3 bg-primary text-white text-sm font-bold hover:bg-primary/90"
          >
            <span className="material-symbols-outlined text-lg">add_task</span>
            Add task
          </button>
        </div>
      )}

      {/* AI insights */}
      {(executionInsights.length > 0 || validationInsights.length > 0) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
          <h2 className="text-lg font-bold text-[#111418] dark:text-white mb-4">Insights</h2>
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
    </div>
  );
}
