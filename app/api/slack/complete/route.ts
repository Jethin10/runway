/**
 * Complete Slack setup: save WorkspaceIntegration and delete temp doc.
 */

import { NextResponse } from "next/server";
import { getAuthUserIdFromRequest } from "@/lib/auth-api";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { joinChannel } from "@/lib/slack-server";
import type { WorkspaceIntegration } from "@/lib/types";

const TEMP_TTL_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  const uid = await getAuthUserIdFromRequest(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { setupId?: string; channelId?: string; channelName?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { setupId, channelId, channelName } = body;
  if (!setupId || !channelId || typeof channelName !== "string") {
    return NextResponse.json(
      { error: "setupId, channelId, and channelName required" },
      { status: 400 }
    );
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const tempRef = db.collection(COLLECTIONS.SLACK_OAUTH_TEMP).doc(setupId);
  const tempSnap = await tempRef.get();
  if (!tempSnap.exists) {
    return NextResponse.json({ error: "Setup expired or invalid" }, { status: 404 });
  }

  const data = tempSnap.data()!;
  const workspaceId = data.workspaceId as string;
  const createdAt = data.createdAt?.toMillis?.() ?? 0;
  if (Date.now() - createdAt > TEMP_TTL_MS) {
    await tempRef.delete();
    return NextResponse.json({ error: "Setup expired" }, { status: 404 });
  }

  const workspaceRef = db.collection(COLLECTIONS.WORKSPACES).doc(workspaceId);
  const wsSnap = await workspaceRef.get();
  if (!wsSnap.exists) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  const members = (wsSnap.data()?.members ?? []) as { userId: string; role: string }[];
  if (!members.some((m) => m.userId === uid && m.role === "founder")) {
    return NextResponse.json({ error: "Only founders can complete Slack setup" }, { status: 403 });
  }

  const botToken = data.botToken as string;
  const slackTeamId = data.slackTeamId as string;

  await joinChannel(botToken, channelId);

  const intRef = db.collection(COLLECTIONS.WORKSPACE_INTEGRATIONS).doc();
  const integration: Omit<WorkspaceIntegration, "id"> = {
    workspaceId,
    type: "slack",
    connectedAt: Date.now(),
    createdBy: uid,
    config: {
      slackTeamId,
      channelId,
      channelName: channelName.trim() || channelId,
      botToken,
    },
  };
  await intRef.set({
    ...integration,
    id: intRef.id,
    connectedAt: new Date(integration.connectedAt),
  });
  await tempRef.delete();

  return NextResponse.json({
    ok: true,
    integrationId: intRef.id,
  });
}
