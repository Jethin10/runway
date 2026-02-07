"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getWorkspace,
  getSprints,
  getTasksForWorkspace,
  getValidationsForWorkspace,
} from "@/lib/firestore";
import type { StartupWorkspace, Sprint, Task, ValidationEntry } from "@/lib/types";

export default function AnalyticsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;
  const [workspace, setWorkspace] = useState<StartupWorkspace | null>(null);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [validations, setValidations] = useState<ValidationEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    Promise.all([
      getWorkspace(workspaceId),
      getSprints(workspaceId),
      getTasksForWorkspace(workspaceId),
      getValidationsForWorkspace(workspaceId),
    ])
      .then(([ws, sp, t, v]) => {
        setWorkspace(ws ?? null);
        setSprints(sp);
        setTasks(t);
        setValidations(v);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  if (loading || !workspace) {
    return (
      <div className="py-12">
        {loading ? <p className="text-gray-500">Loading…</p> : <p className="text-gray-500">Workspace not found.</p>}
      </div>
    );
  }

  const completedSprints = sprints.filter((s) => s.completed && s.completionStats);
  const sprintReliability =
    completedSprints.length > 0
      ? Math.round(
          completedSprints.reduce((a, s) => a + (s.completionStats!.completionPercentage ?? 0), 0) /
            completedSprints.length
        )
      : 0;

  const tasksCompletedOverTime = completedSprints.map((s) => ({
    label: s.weekStartDate,
    completed: s.completionStats!.tasksCompleted,
    total: s.completionStats!.tasksTotal,
    pct: s.completionStats!.completionPercentage,
  }));

  const validationsPerSprint = completedSprints.map((s) => ({
    label: s.weekStartDate,
    count: validations.filter((v) => v.sprintId === s.id).length,
  }));

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskCompletionPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Analytics</h1>
        <p className="text-gray-500 text-sm">
          Derived from workspace execution and validation data.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-500 mb-1">Tasks completed</p>
          <p className="text-4xl font-extrabold text-primary">{doneTasks}</p>
          <p className="text-xs text-gray-400">{totalTasks} total ({taskCompletionPct}%)</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-500 mb-1">Sprint reliability</p>
          <p className="text-4xl font-extrabold">{sprintReliability}%</p>
          <p className="text-xs text-gray-400">avg completion</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700">
          <p className="text-sm font-semibold text-gray-500 mb-1">Validation activity</p>
          <p className="text-4xl font-extrabold text-[#111418] dark:text-white">{validations.length}</p>
          <p className="text-xs text-gray-400">entries</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg mb-6">Tasks completed over time</h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {tasksCompletedOverTime.slice(-8).map((d, i) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary rounded-t min-h-[4px] transition-all"
                style={{ height: `${Math.max(4, d.pct)}%` }}
              />
              <span className="text-[10px] font-bold text-gray-500 truncate w-full text-center">
                {d.label.slice(5)}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">% completion per closed sprint</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6">
        <h3 className="font-bold text-lg mb-6">Validation activity per sprint</h3>
        <div className="flex items-end justify-between gap-2 h-32">
          {validationsPerSprint.slice(-8).map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-primary/70 rounded-t min-h-[4px]"
                style={{ height: `${Math.max(4, Math.min(100, d.count * 20))}%` }}
              />
              <span className="text-[10px] font-bold text-gray-500 truncate w-full text-center">
                {d.label.slice(5)}
              </span>
              <span className="text-[10px] text-gray-400">{d.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
