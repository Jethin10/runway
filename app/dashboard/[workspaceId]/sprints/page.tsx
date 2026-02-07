"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleInWorkspace } from "@/contexts/AuthContext";
import {
  getWorkspace,
  getSprints,
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
import type { StartupWorkspace, Sprint, Task } from "@/lib/types";

export default function SprintsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
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
  const [newItems, setNewItems] = useState<{ title: string }[]>([]);
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
      getTasksForWorkspace(workspaceId),
    ]).then(([ws, sp, t]) => {
      setWorkspace(ws ?? null);
      setSprints(sp);
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
    if (!newItemTitle.trim()) return;
    setNewItems((prev) => [...prev, { title: newItemTitle.trim() }]);
    setNewItemTitle("");
  };
  const removeNewItem = (index: number) => setNewItems((prev) => prev.filter((_, i) => i !== index));

  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !workspaceId || !weekStart || !weekEnd) return;
    const allTaskIds = [...selectedTaskIds];
    for (const item of newItems) {
      const taskId = await createTask(workspaceId, null, null, item.title, null);
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Sprints</h1>
        {isFounder && (
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold hover:bg-primary/90"
          >
            New sprint
          </button>
        )}
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreateSprint}
          className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <h3 className="font-bold text-lg">Create sprint</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Week start (YYYY-MM-DD)</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Week end (YYYY-MM-DD)</label>
              <input
                type="date"
                value={weekEnd}
                onChange={(e) => setWeekEnd(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Sprint items</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select existing tasks or add new items (goals and tasks in one list).</p>
            <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto mb-3">
              {tasks.filter((t) => !t.sprintId || t.sprintId === "").map((t) => (
                <label key={t.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(t.id)}
                    onChange={() => toggleTaskInSprint(t.id)}
                  />
                  <span className="text-sm">{t.title}</span>
                </label>
              ))}
              {tasks.every((t) => t.sprintId) && tasks.length > 0 && (
                <p className="text-xs text-gray-500">All tasks are already in a sprint.</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 items-end">
              <input
                type="text"
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                placeholder="New item title"
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm min-w-[160px]"
              />
              <button
                type="button"
                onClick={addNewItem}
                disabled={!newItemTitle.trim()}
                className="rounded-lg h-9 px-3 bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 disabled:opacity-50"
              >
                + Add item
              </button>
            </div>
            {newItems.length > 0 && (
              <ul className="mt-2 space-y-1">
                {newItems.map((item, i) => (
                  <li key={i} className="flex items-center justify-between text-sm py-1">
                    <span>{item.title}</span>
                    <button type="button" onClick={() => removeNewItem(i)} className="text-red-500 hover:underline">Remove</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create sprint"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg h-10 px-4 bg-gray-200 dark:bg-gray-700 text-sm font-bold"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="font-bold">Sprint list</h3>
          {sprints.length === 0 ? (
            <p className="text-gray-500 text-sm">No sprints yet. Create one to start the weekly loop.</p>
          ) : (
            <ul className="space-y-2">
              {sprints.map((s) => (
                <li
                  key={s.id}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedSprint?.id === s.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 dark:border-gray-700 hover:border-primary/30"
                  }`}
                  onClick={() => setSelectedSprint(s)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold">{s.weekStartDate} → {s.weekEndDate}</p>
                      <p className="text-xs text-gray-500">
                        {s.taskIds.length} item{s.taskIds.length !== 1 ? "s" : ""}
                        {s.locked && " · Locked"}
                        {s.completed && " · Closed"}
                      </p>
                    </div>
                    {s.completed && s.completionStats && (
                      <span className="text-sm font-bold text-primary">
                        {s.completionStats.completionPercentage}%
                      </span>
                    )}
                  </div>
                  {isFounder && !s.locked && !s.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLockSprint(s);
                      }}
                      disabled={locking}
                      className="mt-2 text-xs font-bold text-primary hover:underline disabled:opacity-50"
                    >
                      Lock sprint
                    </button>
                  )}
                  {isFounder && s.locked && !s.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseSprint(s);
                      }}
                      disabled={closing}
                      className="mt-2 text-xs font-bold text-amber-600 hover:underline disabled:opacity-50"
                    >
                      Close sprint
                    </button>
                  )}
                  {isFounder && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSprint(s);
                      }}
                      disabled={deleting}
                      className="mt-2 text-xs font-bold text-red-600 dark:text-red-400 hover:underline disabled:opacity-50 ml-2"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-bold">Sprint items</h3>
            {selectedSprint && sprintTasks.length > 0 && (
              <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === "list" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                >
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("board")}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${viewMode === "board" ? "bg-primary text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"}`}
                >
                  Board
                </button>
              </div>
            )}
          </div>
          {!selectedSprint ? (
            <p className="text-gray-500 text-sm">Select a sprint to see and update items.</p>
          ) : sprintTasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No items in this sprint.</p>
          ) : viewMode === "board" ? (
            <div className="grid grid-cols-3 gap-4">
              {(["todo", "in_progress", "done"] as const).map((status) => (
                <div key={status} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-white/5 p-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
                    {status === "done" ? "Done" : status === "in_progress" ? "In progress" : "To do"}
                  </h4>
                  <div className="space-y-2">
                    {sprintTasks
                      .filter((t) => t.status === status)
                      .map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                        >
                          <span className="text-sm font-medium truncate">{t.title}</span>
                          {canWrite && !selectedSprint.completed && (
                            <select
                              value={t.status}
                              onChange={(e) => updateTaskStatus(t.id, e.target.value as Task["status"])}
                              className="text-xs rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-1.5 py-0.5"
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
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700"
                >
                  <span className="font-medium text-sm">{t.title}</span>
                  {canWrite && !selectedSprint.completed ? (
                    <select
                      value={t.status}
                      onChange={(e) => updateTaskStatus(t.id, e.target.value as Task["status"])}
                      className="text-sm rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-1"
                    >
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  ) : (
                    <span className="text-xs font-bold px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 uppercase">
                      {t.status}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
