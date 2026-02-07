/** Firestore collection names */
export const COLLECTIONS = {
  WORKSPACES: "workspaces",
  MILESTONES: "milestones",
  TASKS: "tasks",
  SPRINTS: "sprints",
  VALIDATIONS: "validations",
  LEDGER: "ledger",
  USER_PROFILES: "userProfiles",
  WORKSPACE_INVITES: "workspaceInvites",
  WORKSPACE_INTEGRATIONS: "workspaceIntegrations",
  /** Server-only: Slack OAuth temp state (token + channels). Not in client rules. */
  SLACK_OAUTH_TEMP: "slackOAuthTemp",
  FUNDING_ROUNDS: "fundingRounds",
  FUNDING_ALLOCATIONS: "fundingAllocations",
  SPEND_LOGS: "spendLogs",
  EXECUTION_AUDIT_LOG: "executionAuditLog",
} as const;
