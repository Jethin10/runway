# Runway — Techpreneur Round 2 (24-Hour) Hackathon Checklist

**Event:** Udyamitsav '26 — StartupOps: Digital Infrastructure for Early Stage Founders  
**Goal:** Align Runway with mandatory modules, bonus items, and judging criteria to maximize score.

---

## Judging criteria (weights)

| Criteria | Weight | What to show |
|----------|--------|----------------|
| **Tech Implementation** | 30% | Next.js 15, Firebase Auth + Firestore, clean architecture, type safety |
| **Problem Understanding** | 20% | Demo script that maps each problem statement item to a feature |
| **Business Logic** | 20% | Roles, validation flow, sprint lifecycle, workspace + team |
| **UI/UX** | 15% | Consistent design, clear navigation, one clear demo path |
| **Innovation & Scalability** | 15% | AI insights, investor pitch generator, ledger, future scope |

---

## Mandatory core modules — coverage

### 1. Authentication & Authorization
- [x] **Secure login** — Firebase Auth (email/password + Google)
- [x] **Founder and team member roles** — `UserRole`: founder, team_member, investor in workspace
- [x] **Role-based access** — Founder: full; Team: write execution/validation; Investor: read-only (Investor view founder-only)
- **Demo:** Sign in → Dashboard → open a workspace → Team page shows roles; invite member (team_member / investor)

### 2. Startup Profile & Workspace
- [x] **Startup details** — Workspace name, stage (Idea / MVP / Early Traction)
- [x] **Centralized workspace** — One workspace = one startup; list on /dashboard
- [x] **Editable and scalable structure** — Team page: edit workspace name & stage; milestones/tasks scale
- **Demo:** Dashboard → create workspace → open it → Team → edit name/stage → Save

### 3. Feedback & Validation System
- [x] **Collect internal or external feedback** — Log validation (interview / survey / experiment)
- [x] **Idea validation metrics or qualitative inputs** — Summary + qualitative notes per entry
- [x] **Support for iteration** — Log per sprint + milestone; recent validations on Overview
- **Demo:** Overview → scroll to “Log validation” → choose sprint, milestone, type, summary, notes → Add validation

### 4. Task & Milestone Tracking
- [x] **Task creation, assignment, status** — Create task under milestone; ownerId; status: todo / in_progress / done
- [x] **Milestone-based progress** — Milestones with tasks; status (planned / active / completed)
- [x] **Visualization of execution flow** — Overview: metrics, “Execution over time” chart, milestones list
- [x] **Progress indicators** — Completion %, task counts, sprint progress
- **Demo:** Overview → Add milestone → Add task (assign to milestone) → Sprints → create sprint, assign tasks, lock/close

### 5. Analytics Dashboard
- [x] **Task completion trends** — Chart “Tasks completed over time” (per sprint)
- [x] **Milestones achieved** — Count and completion in Analytics
- [x] **Meaningful data representation** — KPI cards + bar charts on Analytics page
- **Demo:** Analytics → show 4 KPIs + “Tasks completed over time” + “Validation activity per sprint”

---

## Bonus (score enhancers)

| Bonus | Status | Notes |
|-------|--------|--------|
| **AI-Based Insights (mock allowed)** | Done | Execution insights (stalled milestone, no activity, low sprint completion) + validation insights (missing/weak). Rule-based in `lib/ai-mock.ts`. |
| **Investor Pitch Generator** | Done | Investor view: auto-generated outline with **Problem, Solution, Traction, Roadmap** from workspace data. |
| **Payment Integration (dummy)** | Done | `/upgrade` — Free vs Pro plans; “Subscribe (demo)” shows “no payment charged” message. |
| **Cloud Deployment** | You | Deploy to Vercel (or similar); add **Deployed Application Link** to submission. |
| **GitHub Repository** | You | Clean repo; README with setup + features. |
| **Demo pitch** | You | Live demo: problem understanding, key features walkthrough, innovation & future scope. |

---

## Demo script (5–7 min suggested)

1. **Problem (30 s)**  
   “Early-stage founders juggle many tools and lack a single place to track execution, validate ideas, and get investor-ready. Runway is a single workspace for that.”

2. **Auth & workspace (1 min)**  
   Sign in (or show already logged in) → Dashboard → create/open workspace.  
   **Team:** Show “Team & workspace” → edit startup name/stage (Save) → Invite member (email + role). Emphasize: “Founder and team member roles; investors read-only.”

3. **Execution (1.5 min)**  
   Overview → Add milestone → Add task (assign to milestone).  
   Sprints → New sprint (dates, goals, assign tasks) → Lock sprint (“commitment hash to ledger”) → update task statuses → Close sprint (“completion hash”).  
   Show “Execution over time” chart and metrics.

4. **Validation (45 s)**  
   Scroll to “Log validation” → pick sprint, milestone, type (interview/survey/experiment), summary, notes → Add. Show “Recent validation entries.”

5. **Analytics (45 s)**  
   Analytics tab → KPIs (tasks, milestones, sprint reliability, validation count) + both charts.

6. **AI & investor (1 min)**  
   Overview: if there’s data, show “Insights” (execution + validation).  
   Investor view: “Auto-generated pitch outline: Problem, Solution, Traction, Roadmap from our data.”

7. **Trust / ledger (30 s)**  
   Ledger tab → list of commitment & completion hashes + timestamps. “No tokens; verifiable execution history.”

8. **Bonus: Payment (20 s)**  
   “We also have a dummy upgrade flow.” Open `/upgrade` → show Free vs Pro → click “Subscribe (demo)” → “No payment charged.”

9. **Tech & innovation (30 s)**  
   “Built with Next.js 15, Firebase, TypeScript. Rule-based AI today; we can plug in an LLM. Ledger can move to a real chain later.”

---

## Pre-submission checklist

- [ ] **Deploy** app (e.g. Vercel) and get live URL.
- [ ] **README** has: one-line pitch, setup (npm install, Firebase env, firestore rules), and list of features matching this doc.
- [ ] **.env** not committed; README or .env.example documents `NEXT_PUBLIC_FIREBASE_*`.
- [ ] **Firestore rules** deployed (`firebase deploy --only firestore:rules`).
- [ ] **Final deliverables:** Deployed application link, GitHub repo link, and (if required) short demo video or slide linking to this checklist.

---

## Quick reference — where everything is

| Requirement | Where in Runway |
|-------------|------------------|
| Login / roles | `/login`, `/signup`; Team page shows roles |
| Startup profile & edit | Dashboard → workspace → **Team** (edit name/stage + invite) |
| Validation | Overview → “Log validation” + recent validations |
| Tasks & milestones | Overview (add milestone/task); Sprints (assign, status) |
| Analytics | **Analytics** tab |
| AI insights | Overview “Insights” block; rule-based |
| Investor pitch | **Investor view** (Problem, Solution, Traction, Roadmap) |
| Ledger | **Ledger** tab |
| Dummy payment | **/upgrade** |

Good luck — you’ve got the features; nail the deployment and the demo.
