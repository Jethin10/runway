/**
 * Send execution event to Slack. Called after sprint lock/close or milestone complete.
 * Fails silently if Slack not connected or token invalid.
 */

import { NextResponse } from "next/server";
import { getAuthUserIdFromRequest } from "@/lib/auth-api";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { sendSlackMessage } from "@/lib/slack-server";

export type SlackNotifyEventType = "sprint_locked" | "sprint_closed" | "milestone_completed";

export interface SlackNotifyBody {
  workspaceId: string;
  eventType: SlackNotifyEventType;
  metadata: {
    sprintLabel?: string;
    sprintGoals?: string[];
    tasksCompleted?: number;
    tasksTotal?: number;
    milestonesDelivered?: number;
    validationsLogged?: number;
    milestoneTitle?: string;
    sprintLabelForMilestone?: string;
  };
}

function buildMessage(eventType: SlackNotifyEventType, metadata: SlackNotifyBody["metadata"]): string {
  switch (eventType) {
    case "sprint_locked": {
      const label = metadata.sprintLabel ?? "Sprint";
      const goals = metadata.sprintGoals ?? [];
      const goalLines = goals.length ? goals.map((g) => `• ${g}`).join("\n") : "• (no goals set)";
      return `🚀 Sprint locked: ${label}\nGoals committed:\n${goalLines}`;
    }
    case "sprint_closed": {
      const label = metadata.sprintLabel ?? "Sprint";
      const tasks = `${metadata.tasksCompleted ?? 0}/${metadata.tasksTotal ?? 0}`;
      const milestones = metadata.milestonesDelivered ?? 0;
      const validations = metadata.validationsLogged ?? 0;
      return `✅ Sprint closed: ${label}\n• Tasks completed: ${tasks}\n• Milestones delivered: ${milestones}\n• Validations logged: ${validations}`;
    }
    case "milestone_completed": {
      const title = metadata.milestoneTitle ?? "Milestone";
      const sprint = metadata.sprintLabelForMilestone ? `\nSprint: ${metadata.sprintLabelForMilestone}` : "";
      return `🎯 Milestone completed: ${title}${sprint}`;
    }
    default:
      return "";
  }
}

export async function POST(request: Request) {
  const uid = await getAuthUserIdFromRequest(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SlackNotifyBody;
  try {
    body = (await request.json()) as SlackNotifyBody;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { workspaceId, eventType, metadata } = body;
  if (!workspaceId || !eventType || !metadata) {
    return NextResponse.json({ error: "workspaceId, eventType, metadata required" }, { status: 400 });
  }

  const validTypes: SlackNotifyEventType[] = ["sprint_locked", "sprint_closed", "milestone_completed"];
  if (!validTypes.includes(eventType)) {
    return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ ok: false });
  }

  const snap = await db
    .collection(COLLECTIONS.WORKSPACE_INTEGRATIONS)
    .where("workspaceId", "==", workspaceId)
    .where("type", "==", "slack")
    .limit(1)
    .get();

  if (snap.empty) {
    return NextResponse.json({ ok: false });
  }

  const doc = snap.docs[0];
  const config = doc.data()?.config;
  if (!config?.botToken || !config?.channelId) {
    return NextResponse.json({ ok: false });
  }

  const text = buildMessage(eventType, metadata);
  if (!text) {
    return NextResponse.json({ ok: false });
  }

  try {
    const sent = await sendSlackMessage(config.botToken, config.channelId, text);
    if (!sent) {
      console.error("slack/notify: chat.postMessage failed for workspace", workspaceId);
    }
    return NextResponse.json({ ok: sent });
  } catch (e) {
    console.error("slack/notify:", e);
    return NextResponse.json({ ok: false });
  }
}
