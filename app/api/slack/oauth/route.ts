/**
 * Start Slack OAuth: redirect to Slack with state=workspaceId.
 * Only founders should hit this (UI hides Connect for non-founders).
 */

import { NextRequest, NextResponse } from "next/server";
import { getSlackAuthorizeUrl } from "@/lib/slack-server";

export async function GET(request: NextRequest) {
  const workspaceId = request.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId || typeof workspaceId !== "string") {
    return NextResponse.json({ error: "workspaceId required" }, { status: 400 });
  }
  try {
    const url = getSlackAuthorizeUrl(workspaceId);
    return NextResponse.redirect(url);
  } catch (e) {
    console.error("slack/oauth:", e);
    return NextResponse.json({ error: "Slack not configured" }, { status: 503 });
  }
}
