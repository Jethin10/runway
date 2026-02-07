/**
 * Slack OAuth callback: exchange code for token, fetch channels, store in temp doc, redirect to channel picker.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { exchangeCodeForToken, listChannels } from "@/lib/slack-server";

const INTEGRATIONS_PATH = "/dashboard";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state"); // workspaceId
  const errorParam = request.nextUrl.searchParams.get("error");

  if (errorParam) {
    const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(`${base}${INTEGRATIONS_PATH}?slack_error=denied`);
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(`${INTEGRATIONS_PATH}?slack_error=missing`, request.nextUrl.origin)
    );
  }

  const workspaceId = state;

  try {
    const result = await exchangeCodeForToken(code);
    const channels = await listChannels(result.access_token);
    const db = getAdminDb();
    if (!db) {
      console.error("slack/callback: Firebase Admin not configured");
      return NextResponse.redirect(
        new URL(`${INTEGRATIONS_PATH}?slack_error=config`, request.nextUrl.origin)
      );
    }
    const ref = db.collection(COLLECTIONS.SLACK_OAUTH_TEMP).doc();
    await ref.set({
      workspaceId,
      botToken: result.access_token,
      slackTeamId: result.team.id,
      teamName: result.team.name,
      channels: channels.map((c) => ({ id: c.id, name: c.name })),
      createdAt: new Date(),
    });
    const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(
      `${base}${INTEGRATIONS_PATH}/${workspaceId}/integrations?slack_setup=${ref.id}`
    );
  } catch (e) {
    console.error("slack/callback:", e);
    const base = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    return NextResponse.redirect(`${base}${INTEGRATIONS_PATH}?slack_error=exchange`);
  }
}
