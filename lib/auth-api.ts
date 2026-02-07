/**
 * Server-side auth for API routes: verify Firebase ID token from Authorization header.
 * Returns uid or null if missing/invalid.
 */

import { getAuth } from "firebase-admin/auth";
import { getAdminApp } from "./firebase-admin";

export async function getAuthUserIdFromRequest(request: Request): Promise<string | null> {
  const app = getAdminApp();
  if (!app) return null;
  try {
    const auth = getAuth(app);
    const header = request.headers.get("Authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return null;
    const decoded = await auth.verifyIdToken(token);
    return decoded.uid ?? null;
  } catch {
    return null;
  }
}

