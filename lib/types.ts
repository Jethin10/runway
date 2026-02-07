/**
 * Runway domain model types.
 * Startup-oriented semantics: workspace, milestones, sprints, validation.
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
  createdBy: string; // founderId
  members: WorkspaceMember[];
  milestoneIds: string[];
  createdAt: number; // Firestore timestamp as ms
}

/** Invite-by-link: one-time token for joining a workspace. No email sending. */
export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  role: UserRole;
  token: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number | null;
  used: boolean;
  usedBy?: string | null;
  usedAt?: number | null;
}

export type MilestoneStatus = "planned" | "active" | "completed";

export interface Milestone {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  progressPercentage: number;
  taskIds: string[];
  order: number;
  createdAt: number;
}

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  workspaceId: string;
  milestoneId: string;
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

/** Source of respondent for external validation link (public form). */
export type ValidationSourceType =
  | "customer"
  | "potential_customer"
  | "investor"
  | "team_member"
  | "other";

export interface ValidationEntry {
  id: string;
  workspaceId: string;
  /** Optional for external_link entries (no active sprint when submitted). */
  sprintId: string | null;
  milestoneId: string;
  type: ValidationType;
  summary: string;
  qualitativeNotes: string;
  /** Optional for external_link entries (anonymous respondent). */
  createdBy: string | null;
  createdAt: number;
  /**
   * "external_link" = submitted via public validation link; immutable.
   * Omitted or "internal" = logged inside Runway by team.
   */
  origin?: "internal" | "external_link";
  /** Set only when origin === "external_link". */
  sourceType?: ValidationSourceType | null;
  /** Set only when origin === "external_link"; main feedback text. */
  feedbackText?: string | null;
  /** 1–5 when origin === "external_link" and respondent provided it. */
  confidenceScore?: number | null;
}

/** Slack integration config (botToken never exposed to client). */
export interface SlackIntegrationConfig {
  slackTeamId: string;
  channelId: string;
  channelName: string;
  botToken: string;
}

/** Workspace integration: Slack is the only supported type. Stored in Firestore; botToken server-only. */
export interface WorkspaceIntegration {
  id: string;
  workspaceId: string;
  type: "slack";
  connectedAt: number;
  createdBy: string;
  config: SlackIntegrationConfig;
}

/** Safe view of integration for UI (no botToken). */
export interface WorkspaceIntegrationSafe {
  id: string;
  workspaceId: string;
  type: "slack";
  connectedAt: number;
  createdBy: string;
  config: Omit<SlackIntegrationConfig, "botToken">;
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
