/**
 * Get Slack setup state for channel picker (teamName + channels). No token returned.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthUserIdFromRequest } from "@/lib/auth-api";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";

const TEMP_TTL_MS = 15 * 60 * 1000; // 15 min

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const uid = await getAuthUserIdFromRequest(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: setupId } = await params;
  if (!setupId) {
    return NextResponse.json({ error: "Setup ID required" }, { status: 400 });
  }

  const db = getAdminDb();
  if (!db) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const ref = db.collection(COLLECTIONS.SLACK_OAUTH_TEMP).doc(setupId);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ error: "Setup expired or invalid" }, { status: 404 });
  }

  const data = snap.data()!;
  const createdAt = data.createdAt?.toMillis?.() ?? 0;
  if (Date.now() - createdAt > TEMP_TTL_MS) {
    await ref.delete();
    return NextResponse.json({ error: "Setup expired" }, { status: 404 });
  }

  const workspaceId = data.workspaceId;
  const workspaceRef = db.collection(COLLECTIONS.WORKSPACES).doc(workspaceId);
  const wsSnap = await workspaceRef.get();
  if (!wsSnap.exists) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }
  const members = (wsSnap.data()?.members ?? []) as { userId: string; role: string }[];
  const isFounder = members.some((m) => m.userId === uid && m.role === "founder");
  if (!isFounder) {
    return NextResponse.json({ error: "Only founders can complete Slack setup" }, { status: 403 });
  }

  return NextResponse.json({
    teamName: data.teamName ?? "Slack",
    channels: data.channels ?? [],
  });
}
