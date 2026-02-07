/**
 * List workspace integrations (safe: no botToken). Founder-only: disconnect.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserIdFromRequest } from "@/lib/auth-api";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import type { WorkspaceIntegrationSafe } from "@/lib/types";

function toSafe(
  id: string,
  data: Record<string, unknown>
): WorkspaceIntegrationSafe | null {
  if (data.type !== "slack") return null;
  const config = (data.config as Record<string, unknown>) ?? {};
  const connectedAt = (data.connectedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? Date.now();
  return {
    id,
    workspaceId: data.workspaceId as string,
    type: "slack",
    connectedAt,
    createdBy: data.createdBy as string,
    config: {
      slackTeamId: config.slackTeamId as string,
      channelId: config.channelId as string,
      channelName: config.channelName as string,
    },
  };
}

export async function GET(request: NextRequest) {
  const uid = await getAuthUserIdFromRequest(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const workspaceRef = db.collection(COLLECTIONS.WORKSPACES).doc(workspaceId);
  const wsSnap = await workspaceRef.get();
  if (!wsSnap.exists) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  const members = (wsSnap.data()?.members ?? []) as { userId: string }[];
  if (!members.some((m) => m.userId === uid)) {
    return NextResponse.json({ error: "Not a workspace member" }, { status: 403 });
  }

  const snap = await db
    .collection(COLLECTIONS.WORKSPACE_INTEGRATIONS)
    .where("workspaceId", "==", workspaceId)
    .get();

  const list = snap.docs
    .map((d) => toSafe(d.id, d.data() ?? {}))
    .filter(Boolean) as WorkspaceIntegrationSafe[];
  return NextResponse.json({ integrations: list });
}

export async function DELETE(request: NextRequest) {
  const uid = await getAuthUserIdFromRequest(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  const integrationId = request.nextUrl.searchParams.get("integrationId");
  if (!workspaceId || !integrationId) {
    return NextResponse.json({ error: "workspaceId and integrationId required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const workspaceRef = db.collection(COLLECTIONS.WORKSPACES).doc(workspaceId);
  const wsSnap = await workspaceRef.get();
  if (!wsSnap.exists) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  const members = (wsSnap.data()?.members ?? []) as { userId: string; role: string }[];
  if (!members.some((m) => m.userId === uid && m.role === "founder")) {
    return NextResponse.json({ error: "Only founders can disconnect integrations" }, { status: 403 });
  }

  const intRef = db.collection(COLLECTIONS.WORKSPACE_INTEGRATIONS).doc(integrationId);
  const intSnap = await intRef.get();
  if (!intSnap.exists || intSnap.data()?.workspaceId !== workspaceId) {
    return NextResponse.json({ error: "Integration not found" }, { status: 404 });
  }

  await intRef.delete();
  return NextResponse.json({ ok: true });
}
