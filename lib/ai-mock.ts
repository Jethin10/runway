/**
 * AI layer: rule-based assistive insights. No external LLM.
 * No milestones; insights from tasks, sprints, validations only.
 */

import type { Task, Sprint, ValidationEntry } from "./types";

export interface ExecutionInsight {
  id: string;
  type: "stalled_tasks" | "repeated_blocker" | "risk";
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  taskIds?: string[];
}

export interface ValidationInsight {
  id: string;
  type: "weak_signal" | "missing_validation" | "trend";
  title: string;
  description: string;
}

export interface InvestorSummary {
  problem: string;
  solution: string;
  traction: string;
  executionProgress: string;
  validationStatus: string;
  roadmap: string;
  generatedAt: number;
}

/** Stale tasks and sprint completion risk. */
export function getExecutionInsights(
  _milestones: unknown,
  tasks: Task[],
  sprints: Sprint[]
): ExecutionInsight[] {
  const insights: ExecutionInsight[] = [];
  const now = Date.now();
  const staleMs = 14 * 24 * 60 * 60 * 1000; // 14 days

  const incompleteTasks = tasks.filter((t) => t.status !== "done");
  const staleTasks = incompleteTasks.filter((t) => now - t.updatedAt > staleMs);
  if (staleTasks.length >= 2) {
    insights.push({
      id: "stale-tasks",
      type: "repeated_blocker",
      title: "No recent activity on tasks",
      description: `${staleTasks.length} tasks have had no updates in over two weeks. They may be blocked.`,
      severity: "high",
      taskIds: staleTasks.map((t) => t.id),
    });
  }

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const total = tasks.length;
  const progress = total ? (doneCount / total) * 100 : 0;
  if (total >= 3 && progress < 25) {
    insights.push({
      id: "low-progress",
      type: "stalled_tasks",
      title: "Low task completion",
      description: `Only ${Math.round(progress)}% of tasks are done (${doneCount}/${total}). Consider reprioritizing.`,
      severity: "medium",
    });
  }

  const completedSprints = sprints.filter((s) => s.completed && s.completionStats);
  const lowCompletion = completedSprints.filter(
    (s) => s.completionStats && s.completionStats.completionPercentage < 50
  );
  if (lowCompletion.length >= 2) {
    insights.push({
      id: "sprint-reliability",
      type: "risk",
      title: "Sprint completion rate low",
      description: `${lowCompletion.length} recent sprints completed below 50%. Consider smaller goals or addressing blockers.`,
      severity: "high",
    });
  }

  return insights;
}

/** Highlight weak or missing validation. */
export function getValidationInsights(
  _milestones: unknown,
  validations: ValidationEntry[],
  _sprints: Sprint[]
): ValidationInsight[] {
  const insights: ValidationInsight[] = [];
  if (validations.length === 0) {
    insights.push({
      id: "missing-validation",
      type: "missing_validation",
      title: "No validation recorded",
      description: "Log customer interviews, surveys, or experiments to de-risk your roadmap.",
    });
  } else if (validations.length === 1) {
    insights.push({
      id: "weak-signal",
      type: "weak_signal",
      title: "Single validation source",
      description: "Multiple sources (e.g. interviews + survey) strengthen signal.",
    });
  }
  return insights;
}

/** Generate investor-ready summary (rule-based). */
export function generateInvestorSummary(
  workspaceName: string,
  stage: string,
  _milestones: unknown,
  tasks: Task[],
  validations: ValidationEntry[],
  sprints: Sprint[]
): InvestorSummary {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const taskPct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const completedSprints = sprints.filter((s) => s.completed);
  const avgCompletion =
    completedSprints.length > 0 && completedSprints.every((s) => s.completionStats)
      ? Math.round(
          completedSprints.reduce((a, s) => a + (s.completionStats!.completionPercentage ?? 0), 0) /
            completedSprints.length
        )
      : 0;

  const tractionParts: string[] = [];
  tractionParts.push(`${doneTasks}/${totalTasks} tasks completed (${taskPct}%)`);
  tractionParts.push(`${completedSprints.length} sprints closed with ${avgCompletion}% avg completion`);
  if (validations.length > 0) tractionParts.push(`${validations.length} validation entries (interviews/surveys/experiments)`);

  return {
    problem: `${workspaceName} is in ${stage} stage, focused on validating product-market fit and scaling execution discipline.`,
    solution: `Unified operational workspace for ${workspaceName}: execution tracking (tasks, sprints), structured validation, and verifiable progress via sprint commitments and completion records.`,
    traction: tractionParts.join(". ") || "Early stage; tracking execution and validation from first sprint.",
    executionProgress: `${doneTasks}/${totalTasks} tasks done (${taskPct}%). Sprint reliability: ${avgCompletion}% average completion.`,
    validationStatus:
      validations.length > 0
        ? `${validations.length} validation entries (interviews, surveys, experiments) recorded.`
        : "No validation entries yet. Recommend adding customer interviews and experiment logs.",
    roadmap: completedSprints.length > 0
      ? `Continue weekly sprints; ${totalTasks - doneTasks} tasks in progress.`
      : "Define sprints and tasks to build execution history.",
    generatedAt: Date.now(),
  };
}
