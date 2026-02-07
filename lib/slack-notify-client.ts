/**
 * Client helper: fire-and-forget Slack notify. Does not block execution.
 * Call after sprint lock/close or milestone complete. Fails silently.
 */

import type { User } from "firebase/auth";

export type SlackNotifyEventType = "sprint_locked" | "sprint_closed" | "milestone_completed";

export interface SlackNotifyMetadata {
  sprintLabel?: string;
  sprintGoals?: string[];
  tasksCompleted?: number;
  tasksTotal?: number;
  milestonesDelivered?: number;
  validationsLogged?: number;
  milestoneTitle?: string;
  sprintLabelForMilestone?: string;
}

export function notifySlack(
  user: User | null,
  workspaceId: string,
  eventType: SlackNotifyEventType,
  metadata: SlackNotifyMetadata
): void {
  if (!user) return;
  user
    .getIdToken()
    .then((token) =>
      fetch("/api/slack/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workspaceId, eventType, metadata }),
      })
    )
    .catch(() => {});
}
