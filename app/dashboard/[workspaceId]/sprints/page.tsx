"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleInWorkspace } from "@/contexts/AuthContext";
import {
  getWorkspace,
  getSprints,
  getMilestones,
  getTasksForWorkspace,
  getTasksForSprint,
  createSprint,
  createTask,
  lockSprint,
  closeSprint,
  deleteSprint,
  updateTask,
} from "@/lib/firestore";
import { addLedgerEntry } from "@/lib/firestore";
import { hashSprintCommitment, hashSprintCompletion } from "@/lib/ledger-mock";
import type { StartupWorkspace, Sprint, Milestone, Task } from "@/lib/types";

export default function SprintsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedSprint, setSelectedSprint] = useState<Sprint | null>(null);
  const [sprintTasks, setSprintTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Create sprint form — single "Sprint items" list (tasks only; no separate goals)
  const [showCreate, setShowCreate] = useState(false);
  const [weekStart, setWeekStart] = useState("");
  const [weekEnd, setWeekEnd] = useState("");
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [newItemMilestoneId, setNewItemMilestoneId] = useState("");
  const [newItems, setNewItems] = useState<{ title: string; milestoneId: string }[]>([]);
  const [creating, setCreating] = useState(false);
  const [locking, setLocking] = useState(false);
  const [closing, setClosing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "board">("list");

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      getWorkspace(workspaceId),
      getSprints(workspaceId),
      getMilestones(workspaceId),
      getTasksForWorkspace(workspaceId),
    ]).then(([ws, sp, ms, t]) => {
      setWorkspace(ws ?? null);
      setSprints(sp);
      setMilestones(ms);
      setTasks(t);
    }).finally(() => setLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (!selectedSprint) {
      setSprintTasks([]);
      return;
    }
    getTasksForSprint(selectedSprint.id).then(setSprintTasks);
  }, [selectedSprint?.id]);

  const role = workspace ? getRoleInWorkspace(user?.uid ?? undefined, workspace.members) : null;
  const isFounder = role === "founder";
  const canWrite = role === "founder" || role === "team_member";

  const addNewItem = () => {
    if (!newItemTitle.trim() || !newItemMilestoneId) return;
    setNewItems((prev) => [...prev, { title: newItemTitle.trim(), milestoneId: newItemMilestoneId }]);
    setNewItemTitle("");
    setNewItemMilestoneId("");
  };
  const removeNewItem = (index: number) => setNewItems((prev) => prev.filter((_, i) => i !== index));

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !workspaceId || !weekStart || !weekEnd) return;
    const allTaskIds = [...selectedTaskIds];
    for (const item of newItems) {
      const taskId = await createTask(workspaceId, item.milestoneId, null, item.title, null);
      allTaskIds.push(taskId);
    }
    if (allTaskIds.length === 0) {
      alert("Add at least one sprint item: select existing tasks or add a new item.");
      return;
    }
    setCreating(true);
    try {
      const id = await createSprint(
        workspaceId,
        weekStart,
        weekEnd,
        [], // goals merged into tasks; no separate goals
        allTaskIds,
        user.uid
      );
      const newSprint: Sprint = {
        id,
        workspaceId,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        goals: [],
        taskIds: allTaskIds,
        locked: false,
        completed: false,
        completionStats: null,
        createdAt: Date.now(),
        createdBy: user.uid,
      };
      setSprints((s) => [newSprint, ...s]);
      getTasksForWorkspace(workspaceId).then(setTasks);
      setShowCreate(false);
      setWeekStart("");
      setWeekEnd("");
      setSelectedTaskIds([]);
      setNewItems([]);
      setNewItemTitle("");
      setNewItemMilestoneId("");
    } finally {
      setCreating(false);
    }
  };

  const handleLockSprint = async (sprint: Sprint) => {
    if (!user || !isFounder) return;
    setLocking(true);
    try {
      await lockSprint(sprint.id);
      const hash = hashSprintCommitment(sprint.id, sprint.goals, sprint.taskIds);
      await addLedgerEntry(workspaceId, sprint.id, "commitment", hash, `Sprint ${sprint.weekStartDate} goals committed`);
      setSprints((s) => s.map((x) => (x.id === sprint.id ? { ...x, locked: true } : x)));
      setSelectedSprint((prev) => (prev?.id === sprint.id ? { ...prev!, locked: true } : prev));
    } finally {
      setLocking(false);
    }
  };

  const handleCloseSprint = async (sprint: Sprint) => {
    if (!user || !isFounder) return;
    const st = await getTasksForSprint(sprint.id);
    const total = st.length;
    const completed = st.filter((t) => t.status === "done").length;
    const blocked = st.filter((t) => t.status !== "done").map((t) => t.id);
    const completionPercentage = total ? Math.round((completed / total) * 100) : 0;
    const missedGoalIds: string[] = []; // TODO: derive from goals vs outcomes if we had goal-level tracking
    const completionStats = {
      tasksCompleted: completed,
      tasksTotal: total,
      completionPercentage,
      blockedTaskIds: blocked,
      missedGoalIds,
      closedAt: Date.now(),
    };
    setClosing(true);
    try {
      await closeSprint(sprint.id, completionStats);
      const hash = hashSprintCompletion(
        sprint.id,
        completionPercentage,
        completed,
        total,
        blocked,
        missedGoalIds
      );
      await addLedgerEntry(workspaceId, sprint.id, "completion", hash, `Sprint ${sprint.weekStartDate} closed: ${completionPercentage}%`);
      setSprints((s) =>
        s.map((x) => (x.id === sprint.id ? { ...x, completed: true, completionStats } : x))
      );
      setSelectedSprint(null);
    } finally {
      setClosing(false);
    }
  };

  const toggleTaskInSprint = (taskId: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  const updateTaskStatus = async (taskId: string, status: Task["status"]) => {
    if (!canWrite) return;
    await updateTask(taskId, { status });
    setSprintTasks((t) => t.map((x) => (x.id === taskId ? { ...x, status } : x)));
    setTasks((t) => t.map((x) => (x.id === taskId ? { ...x, status } : x)));
  };

  const handleDeleteSprint = async (sprint: Sprint) => {
    if (!isFounder) return;
    if (!confirm(`Delete sprint ${sprint.weekStartDate} → ${sprint.weekEndDate}? Tasks will be unassigned from this sprint.`)) return;
    setDeleting(true);
    try {
      await deleteSprint(sprint.id);
      setSprints((s) => s.filter((x) => x.id !== sprint.id));
      if (selectedSprint?.id === sprint.id) setSelectedSprint(null);
      getTasksForWorkspace(workspaceId).then(setTasks);
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !workspace) {
    return (
      <div className="py-12">
        {loading ? <p className="text-gray-500">Loading…</p> : <p className="text-gray-500">Workspace not found.</p>}
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {/* Page header: clear hierarchy, single primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a] dark:text-white tracking-tight">Sprints</h1>
          <p className="text-sm text-[#64748b] dark:text-slate-400 mt-0.5">
            Time-boxed execution. Create a sprint, add items, lock to commit, then close when done.
          </p>
        </div>
        {isFounder && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="shrink-0 inline-flex items-center justify-center h-9 px-4 rounded-md bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] text-sm font-medium hover:bg-[#1e293b] dark:hover:bg-slate-200 transition-colors shadow-sm"
          >
            New sprint
          </button>
        )}
      </div>

      {/* Create sprint: one card, clear sections */}
      {showCreate && (
        <form
          onSubmit={handleCreateSprint}
          className="mb-10 rounded-xl border border-[#e2e8f0] dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-[#e2e8f0] dark:border-slate-700/80 bg-[#f8fafc] dark:bg-slate-800/80">
            <h2 className="text-sm font-semibold text-[#0f172a] dark:text-white">Create sprint</h2>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">Set the date range and add at least one item.</p>
          </div>

          <div className="p-6 space-y-6">
            {/* Dates: compact row */}
            <div>
              <p className="text-xs font-medium text-[#64748b] dark:text-slate-400 uppercase tracking-wider mb-3">Dates</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="week-start" className="block text-xs font-medium text-[#475569] dark:text-slate-400 mb-1.5">Week start</label>
                  <input
                    id="week-start"
                    type="date"
                    value={weekStart}
                    onChange={(e) => setWeekStart(e.target.value)}
                    required
                    className="w-full h-9 rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm text-[#0f172a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 dark:focus:ring-white/20 focus:border-[#0f172a]/40"
                  />
                </div>
                <div>
                  <label htmlFor="week-end" className="block text-xs font-medium text-[#475569] dark:text-slate-400 mb-1.5">Week end</label>
                  <input
                    id="week-end"
                    type="date"
                    value={weekEnd}
                    onChange={(e) => setWeekEnd(e.target.value)}
                    required
                    className="w-full h-9 rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm text-[#0f172a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 dark:focus:ring-white/20 focus:border-[#0f172a]/40"
                  />
                </div>
              </div>
            </div>

            {/* Sprint items: two clear blocks — existing tasks, then add new */}
            <div>
              <p className="text-xs font-medium text-[#64748b] dark:text-slate-400 uppercase tracking-wider mb-3">Sprint items</p>

              {/* Existing tasks: bordered box, checkboxes */}
              <div className="rounded-lg border border-[#e2e8f0] dark:border-slate-600 bg-[#f8fafc] dark:bg-slate-900/50 p-3 mb-4">
                <p className="text-xs text-[#64748b] dark:text-slate-400 mb-2">Select from backlog</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 max-h-24 overflow-y-auto">
                  {tasks.filter((t) => !t.sprintId || t.sprintId === "").map((t) => (
                    <label key={t.id} className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.includes(t.id)}
                        onChange={() => toggleTaskInSprint(t.id)}
                        className="rounded border-[#cbd5e1] dark:border-slate-500 text-[#0f172a] dark:text-white focus:ring-[#0f172a]"
                      />
                      <span className="text-sm text-[#334155] dark:text-slate-300 group-hover:text-[#0f172a] dark:group-hover:text-white">{t.title}</span>
                    </label>
                  ))}
                  {tasks.every((t) => t.sprintId) && tasks.length > 0 && (
                    <p className="text-xs text-[#64748b] dark:text-slate-400">All tasks are in a sprint.</p>
                  )}
                </div>
              </div>

              {/* Add new item: single row, button is clearly a button */}
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  type="text"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="New item title"
                  className="h-9 rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm min-w-[180px] placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]/40"
                  aria-label="New item title"
                />
                <select
                  value={newItemMilestoneId}
                  onChange={(e) => setNewItemMilestoneId(e.target.value)}
                  className="h-9 rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm min-w-[160px] text-[#0f172a] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 focus:border-[#0f172a]/40"
                  aria-label="Milestone for new item"
                >
                  <option value="">Select milestone…</option>
                  {milestones.map((m) => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addNewItem}
                  disabled={!newItemTitle.trim() || !newItemMilestoneId || milestones.length === 0}
                  title={milestones.length === 0 ? "Add at least one milestone on the workspace overview first" : !newItemTitle.trim() || !newItemMilestoneId ? "Enter a title and select a milestone" : "Add item"}
                  className="h-9 px-4 rounded-md border border-[#0f172a] dark:border-white/30 bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] text-sm font-medium hover:bg-[#1e293b] dark:hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed transition-colors"
                >
                  Add item
                </button>
              </div>
              {milestones.length === 0 ? (
                <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                  Add at least one milestone on the workspace overview first.
                </p>
              ) : (
                <p className="mt-2 text-xs text-[#64748b] dark:text-slate-400">
                  Title + milestone, then click Add item.
                </p>
              )}

              {/* New items list: card-style rows */}
              {newItems.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {newItems.map((item, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg bg-[#f1f5f9] dark:bg-slate-800 border border-[#e2e8f0] dark:border-slate-700"
                    >
                      <span className="text-sm font-medium text-[#0f172a] dark:text-white truncate">{item.title}</span>
                      <button
                        type="button"
                        onClick={() => removeNewItem(i)}
                        className="shrink-0 text-xs font-medium text-[#dc2626] dark:text-red-400 hover:text-[#b91c1c] dark:hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Form actions: primary + secondary */}
            <div className="flex items-center gap-3 pt-2 border-t border-[#e2e8f0] dark:border-slate-700/80">
              <button
                type="submit"
                disabled={creating}
                className="h-9 px-4 rounded-md bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] text-sm font-medium hover:bg-[#1e293b] dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? "Creating…" : "Create sprint"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="h-9 px-4 rounded-md border border-[#e2e8f0] dark:border-slate-600 text-sm font-medium text-[#475569] dark:text-slate-300 hover:bg-[#f1f5f9] dark:hover:bg-slate-700/50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Two panels: Sprint list | Sprint items */}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Sprint list */}
        <section className="rounded-xl border border-[#e2e8f0] dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0] dark:border-slate-700/80">
            <h3 className="text-sm font-semibold text-[#0f172a] dark:text-white">Sprint list</h3>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">Select a sprint to view and update its items.</p>
          </div>
          <div className="p-5 min-h-[200px]">
            {sprints.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-[#64748b] dark:text-slate-400">No sprints yet.</p>
                <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">Create one to start the weekly loop.</p>
            </div>
            ) : (
              <ul className="space-y-2">
                {sprints.map((s) => (
                  <li
                    key={s.id}
                    className={`rounded-lg border cursor-pointer transition-all ${
                      selectedSprint?.id === s.id
                        ? "border-[#0f172a] dark:border-white/40 bg-[#f1f5f9] dark:bg-slate-700/50 ring-1 ring-[#0f172a]/10 dark:ring-white/10"
                        : "border-[#e2e8f0] dark:border-slate-700 hover:border-[#cbd5e1] dark:hover:border-slate-600 hover:bg-[#f8fafc] dark:hover:bg-slate-800/50"
                    }`}
                    onClick={() => setSelectedSprint(s)}
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-[#0f172a] dark:text-white truncate">
                            {s.weekStartDate} → {s.weekEndDate}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-[#64748b] dark:text-slate-400">
                              {s.taskIds.length} item{s.taskIds.length !== 1 ? "s" : ""}
                            </span>
                            {s.locked && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#e2e8f0] dark:bg-slate-600 text-[#475569] dark:text-slate-300">
                                Locked
                              </span>
                            )}
                            {s.completed && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#dcfce7] dark:bg-emerald-900/40 text-[#166534] dark:text-emerald-300">
                                Closed
                              </span>
                            )}
                          </div>
                        </div>
                        {s.completed && s.completionStats && (
                          <span className="shrink-0 text-sm font-semibold text-[#0f172a] dark:text-white tabular-nums">
                            {s.completionStats.completionPercentage}%
                          </span>
                        )}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {isFounder && !s.locked && !s.completed && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleLockSprint(s); }}
                            disabled={locking}
                            className="text-xs font-medium text-[#0f172a] dark:text-white hover:underline disabled:opacity-50"
                          >
                            Lock sprint
                          </button>
                        )}
                        {isFounder && s.locked && !s.completed && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleCloseSprint(s); }}
                            disabled={closing}
                            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline disabled:opacity-50"
                          >
                            Close sprint
                          </button>
                        )}
                        {isFounder && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDeleteSprint(s); }}
                            disabled={deleting}
                            className="text-xs font-medium text-[#dc2626] dark:text-red-400 hover:underline disabled:opacity-50"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Sprint items */}
        <section className="rounded-xl border border-[#e2e8f0] dark:border-slate-700/80 bg-white dark:bg-slate-800/50 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0] dark:border-slate-700/80 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a] dark:text-white">Sprint items</h3>
              <p className="text-xs text-[#64748b] dark:text-slate-400 mt-0.5">
                {selectedSprint ? `${sprintTasks.length} item${sprintTasks.length !== 1 ? "s" : ""}` : "Select a sprint"}
              </p>
            </div>
            {selectedSprint && sprintTasks.length > 0 && (
              <div className="flex rounded-md border border-[#e2e8f0] dark:border-slate-600 p-0.5 bg-[#f8fafc] dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded ${viewMode === "list" ? "bg-white dark:bg-slate-700 text-[#0f172a] dark:text-white shadow-sm" : "text-[#64748b] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white"}`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("board")}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded ${viewMode === "board" ? "bg-white dark:bg-slate-700 text-[#0f172a] dark:text-white shadow-sm" : "text-[#64748b] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white"}`}
                >
                  Board
                </button>
              </div>
            )}
          </div>
          <div className="p-5 min-h-[200px]">
            {!selectedSprint ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-[#64748b] dark:text-slate-400">No sprint selected.</p>
                <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">Pick one from the list to see and update items.</p>
              </div>
            ) : sprintTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-[#64748b] dark:text-slate-400">No items in this sprint.</p>
              </div>
            ) : viewMode === "board" ? (
              <div className="grid grid-cols-3 gap-3">
                {(["todo", "in_progress", "done"] as const).map((status) => (
                  <div key={status} className="rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900/50 p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b] dark:text-slate-400 mb-2">
                      {status === "done" ? "Done" : status === "in_progress" ? "In progress" : "To do"}
                    </p>
                    <div className="space-y-2">
                      {sprintTasks
                        .filter((t) => t.status === status)
                        .map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between gap-2 p-2.5 rounded-md border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <span className="text-sm font-medium text-[#0f172a] dark:text-white truncate min-w-0">{t.title}</span>
                            {canWrite && !selectedSprint.completed && (
                              <select
                                value={t.status}
                                onChange={(e) => updateTaskStatus(t.id, e.target.value as Task["status"])}
                                className="shrink-0 text-xs rounded border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-2 py-1 text-[#0f172a] dark:text-white"
                              >
                                <option value="todo">To do</option>
                                <option value="in_progress">In progress</option>
                                <option value="done">Done</option>
                              </select>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-2">
                {sprintTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-lg border border-[#e2e8f0] dark:border-slate-700 bg-[#f8fafc] dark:bg-slate-900/30"
                  >
                    <span className="text-sm font-medium text-[#0f172a] dark:text-white truncate min-w-0">{t.title}</span>
                    {canWrite && !selectedSprint.completed ? (
                      <select
                        value={t.status}
                        onChange={(e) => updateTaskStatus(t.id, e.target.value as Task["status"])}
                        className="shrink-0 h-7 text-xs rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-800 px-2 text-[#0f172a] dark:text-white"
                      >
                        <option value="todo">To do</option>
                        <option value="in_progress">In progress</option>
                        <option value="done">Done</option>
                      </select>
                    ) : (
                      <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#e2e8f0] dark:bg-slate-700 text-[#475569] dark:text-slate-300">
                        {t.status.replace("_", " ")}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
