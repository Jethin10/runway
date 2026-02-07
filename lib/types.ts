/**
 * Runway domain model types.
 * Workspace, tasks, sprints, validation. No milestones.
 */

export type UserRole = "founder" | "team_member" | "investor";

export interface WorkspaceMember {
  userId: string;
  role: UserRole;
  email?: string;
  displayName?: string;
}

export type WorkspaceStage = "Idea" | "MVP" | "Early Traction";

export interface StartupWorkspace {
  id: string;
  name: string;
  stage: WorkspaceStage;
  createdBy: string;
  members: WorkspaceMember[];
  createdAt: number;
}

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  workspaceId: string;
  milestoneId: string | null; // legacy; unused in app
  sprintId: string | null;
  title: string;
  ownerId: string | null;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
}

export interface SprintGoal {
  id: string;
  text: string;
}

export interface SprintCompletionStats {
  tasksCompleted: number;
  tasksTotal: number;
  completionPercentage: number;
  blockedTaskIds: string[];
  missedGoalIds: string[];
  closedAt: number;
}

export interface Sprint {
  id: string;
  workspaceId: string;
  weekStartDate: string; // ISO date
  weekEndDate: string;
  goals: SprintGoal[];
  taskIds: string[];
  locked: boolean;
  completed: boolean;
  completionStats: SprintCompletionStats | null;
  createdAt: number;
  createdBy: string;
}

export type ValidationType = "interview" | "survey" | "experiment";

export interface ValidationEntry {
  id: string;
  workspaceId: string;
  sprintId: string;
  milestoneId: string | null; // legacy; optional
  type: ValidationType;
  summary: string;
  qualitativeNotes: string;
  createdBy: string;
  createdAt: number;
}

/** Ledger entry for Execution & Validation Ledger (blockchain mock) */
export interface LedgerEntry {
  id: string;
  workspaceId: string;
  sprintId: string;
  type: "commitment" | "completion";
  hash: string;
  timestamp: number;
  payloadSummary: string;
}
