/**
 * Firebase Admin SDK for server-side only operations.
 * Used for public validation link: read workspace/milestone context and create
 * external validation entries without client auth. Scope intentionally limited.
 *
 * Config: set either FIREBASE_SERVICE_ACCOUNT_KEY (JSON string) or
 * FIREBASE_SERVICE_ACCOUNT_PATH (path to JSON file). File path is easier locally
 * and keeps keys out of .env; add the key file to .gitignore.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

let adminApp: App | null = null;

function loadServiceAccountJson(): Record<string, string> | null {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      return JSON.parse(key) as Record<string, string>;
    } catch {
      return null;
    }
  }
  const pathEnv =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (pathEnv) {
    try {
      const path = resolve(process.cwd(), pathEnv);
      const raw = readFileSync(path, "utf8");
      return JSON.parse(raw) as Record<string, string>;
    } catch {
      return null;
    }
  }
  return null;
}

export function getAdminApp(): App | null {
  if (adminApp) return adminApp;
  const credJson = loadServiceAccountJson();
  if (!credJson) return null;
  try {
    const credential = cert(credJson);
    if (getApps().length === 0) {
      adminApp = initializeApp({ credential });
    } else {
      adminApp = getApps()[0] as App;
    }
    return adminApp;
  } catch {
    return null;
  }
}

export function getAdminDb(): ReturnType<typeof getFirestore> | null {
  const app = getAdminApp();
  return app ? getFirestore(app) : null;
}

export function isAdminConfigured(): boolean {
  return getAdminApp() != null;
}
