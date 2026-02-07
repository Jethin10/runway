/**
 * Server-only Slack API helpers.
 * Used by API routes for OAuth, channel list, and sending execution event messages.
 */

const SLACK_OAUTH_URL = "https://slack.com/oauth/v2/authorize";
const SLACK_TOKEN_URL = "https://slack.com/api/oauth.v2.access";
const SLACK_API_BASE = "https://slack.com/api";

export const SLACK_SCOPES = "chat:write,channels:read,channels:join,groups:read";

export function getSlackOAuthRedirectUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (!base) return "http://localhost:3000/api/slack/callback";
  const trimmed = base.replace(/\/$/, "").split("?")[0];
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return `${trimmed}/api/slack/callback`;
  }
  const host = trimmed.split("/")[0] || "localhost:3000";
  const protocol = host === "localhost:3000" ? "http://" : "https://";
  return `${protocol}${host}/api/slack/callback`;
}

export function getSlackAuthorizeUrl(state: string): string {
  const clientId = process.env.SLACK_CLIENT_ID;
  if (!clientId) throw new Error("SLACK_CLIENT_ID not set");
  const redirectUri = encodeURIComponent(getSlackOAuthRedirectUrl());
  const scope = encodeURIComponent(SLACK_SCOPES);
  const stateEnc = encodeURIComponent(state);
  return `${SLACK_OAUTH_URL}?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${stateEnc}`;
}

export interface SlackOAuthResult {
  access_token: string;
  team: { id: string; name: string };
}

export async function exchangeCodeForToken(code: string): Promise<SlackOAuthResult> {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Slack OAuth not configured");
  const redirectUri = getSlackOAuthRedirectUrl();
  const res = await fetch(SLACK_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const data = (await res.json()) as { ok: boolean; error?: string; access_token?: string; team?: { id: string; name: string } };
  if (!data.ok || !data.access_token || !data.team) {
    throw new Error(data.error || "Slack OAuth failed");
  }
  return { access_token: data.access_token, team: data.team };
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private?: boolean;
}

export async function listChannels(botToken: string): Promise<SlackChannel[]> {
  const res = await fetch(`${SLACK_API_BASE}/conversations.list?types=public_channel,private_channel&limit=200`, {
    headers: { Authorization: `Bearer ${botToken}` },
  });
  const data = (await res.json()) as { ok: boolean; channels?: { id: string; name: string; is_private?: boolean }[] };
  if (!data.ok || !data.channels) return [];
  return data.channels.map((c) => ({ id: c.id, name: c.name, is_private: c.is_private }));
}

/** Join a channel so the bot can post. Call when saving the integration so the bot is in the channel. */
export async function joinChannel(botToken: string, channelId: string): Promise<boolean> {
  const res = await fetch(`${SLACK_API_BASE}/conversations.join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel: channelId }),
  });
  const data = (await res.json()) as { ok: boolean };
  return !!data.ok;
}

export async function sendSlackMessage(botToken: string, channelId: string, text: string): Promise<boolean> {
  const res = await fetch(`${SLACK_API_BASE}/chat.postMessage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${botToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ channel: channelId, text }),
  });
  const data = (await res.json()) as { ok: boolean };
  return !!data.ok;
}
