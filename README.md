# Runway

Unified operational workspace for early-stage startup founders. Built for IIT Jammu Techpreneur Hackathon.

- **Execution tracking** — Startup workspaces, milestones, tasks, weekly sprints
- **Roles** — Founder (full), Team member (limited write), Investor (read-only)
- **Validation** — Log interviews, surveys, experiments per sprint/milestone
- **Analytics** — Tasks completed over time, sprint reliability, validation activity
- **AI layer** — Rule-based execution and validation insights; investor summary generator
- **Trust layer** — Execution & Validation Ledger (hashes + timestamps, no tokens/wallets)

## Tech stack

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind; Stitch-derived UI preserved
- **Backend:** Firebase Auth + Firestore
- **State:** React state / context
- **AI / Blockchain:** Mocked rule-based logic and hash ledger

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Firebase**

   - Create a project at [Firebase Console](https://console.firebase.google.com)
   - Enable **Authentication** (Email/Password; optionally Google)
   - Create a **Firestore** database
   - Copy config into `.env.local` (see `.env.example`)

   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

3. **Firestore rules**

   Deploy `firestore.rules` from the project root (e.g. `firebase deploy --only firestore:rules`).

4. **Indexes (if prompted by Firestore)**

   Create composite indexes for:

   - `milestones`: `workspaceId` (Asc), `order` (Asc)
   - `tasks`: `workspaceId` (Asc), `updatedAt` (Desc)
   - `tasks`: `sprintId` (Asc), `updatedAt` (Desc)
   - `sprints`: `workspaceId` (Asc), `createdAt` (Desc)
   - `validations`: `workspaceId` (Asc), `createdAt` (Desc)
   - `ledger`: `workspaceId` (Asc), `timestamp` (Desc)

5. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Sign up, create a workspace, add milestones and tasks, then create/lock/close sprints.

## Deploy (e.g. Vercel)

1. **Push to GitHub** (if not already).

2. **Import on [Vercel](https://vercel.com)**  
   New Project → Import your repo → Framework: **Next.js** (auto-detected).

3. **Environment variables**  
   In the Vercel project → Settings → Environment Variables, add the same Firebase vars you use locally:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`

4. **Firebase Auth (production domain)**  
   In [Firebase Console](https://console.firebase.google.com) → Authentication → Sign-in method → Authorized domains, add your Vercel domain (e.g. `your-app.vercel.app`).

5. **Deploy**  
   Deploy from the Vercel dashboard or by pushing to your linked branch. Preview URLs get a unique domain; add those to Authorized domains if you want to sign in on previews.

**CLI option:** Install Vercel CLI (`npm i -g vercel`), run `vercel` in the project root, and follow the prompts (and add env vars when asked or in the dashboard).

## Demo flow

1. **Sign up** → Create a **Startup workspace** (you’re the founder).
2. **Overview** → Add **milestones**, then **tasks** under milestones.
3. **Sprints** → **New sprint** (week range, goals, assign tasks) → **Lock sprint** (writes commitment hash to ledger) → During week, update task statuses → **Close sprint** (completion summary + completion hash to ledger).
4. **Log validation** on the overview (sprint, milestone, type, summary).
5. **Analytics** — View tasks over time and sprint reliability.
6. **Investor view** (founder only) — Generated summary (problem, execution, validation, roadmap).
7. **Ledger** — List commitment/completion hashes and timestamps.

## Hackathon notes

- **AI:** Execution/validation insights and investor summary are **rule-based** (see `lib/ai-mock.ts`). Replace with LLM/API when needed.
- **Blockchain:** Ledger uses **local hashes** only (see `lib/ledger-mock.ts`). Replace with testnet/chain writes for production.
- **Workspace membership:** Adding team members/investors to a workspace is not implemented in the UI; extend `workspace.members` and role checks as needed.

## License

MIT.
