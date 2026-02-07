# Task, Sprint & Hierarchy in Runway

Quick reference for how **workspace → milestones → tasks → sprints** fit together.

---

## The hierarchy (top to bottom)

```
Workspace (your startup)
  ├── Milestones (big goals, e.g. "Launch MVP", "First 100 users")
  │     └── each milestone has a list of Tasks
  ├── Tasks (individual to-dos; each task belongs to one Milestone)
  │     └── a task can be in no sprint (backlog) OR in one Sprint
  └── Sprints (time-boxed periods, e.g. one week)
        └── each sprint has a list of Tasks committed to that week
```

---

## 1. Workspace

- **What:** One startup / one product (e.g. "Acme Inc").
- **Contains:** Members, stage (Idea / MVP / Early Traction), and a list of **milestone** IDs.
- **Where:** Dashboard home; you pick a workspace to work in.

---

## 2. Milestone

- **What:** A high-level goal or phase (e.g. "Launch MVP", "Get first 100 users").
- **Belongs to:** One workspace.
- **Has:** Title, description, status (`planned` → `active` → `completed`), progress %, and a list of **task** IDs.
- **Role:** Groups tasks by “what we’re building toward.” Tasks are always created under a milestone.

---

## 3. Task

- **What:** A single to-do (e.g. "Set up auth", "Design landing page").
- **Belongs to:** One workspace and **one milestone** (required).
- **Optionally in a sprint:** `sprintId` is either `null` (backlog) or the ID of one sprint.
- **Has:** Title, status (`todo` / `in_progress` / `done`), optional owner.
- **Flow:** You create tasks under milestones. Some stay in the backlog; others get added to a sprint when you plan a week.

---

## 4. Sprint

- **What:** A fixed time window (e.g. one week: 2025-02-10 → 2025-02-16).
- **Belongs to:** One workspace.
- **Has:**
  - **Dates:** `weekStartDate`, `weekEndDate`
  - **Tasks:** `taskIds` = tasks you committed to this week (those tasks get `sprintId` set to this sprint)
  - **Locked:** When you “lock” the sprint, the commitment is fixed and written to the ledger (audit trail)
  - **Completed:** When the week is over, you “close” the sprint and record how many tasks were done (completion %); that’s also written to the ledger

**Sprint lifecycle:**

1. **Create** – Pick dates, add tasks (existing or new); those tasks are now “in this sprint.”
2. **Lock** – Commit the plan (recorded on the ledger).
3. **Close** – Week over; you set completion stats (e.g. 3/5 tasks done); recorded on the ledger.

---

## How they connect

| Concept    | Lives in        | Points to                          |
|-----------|------------------|------------------------------------|
| Workspace | —                | Has `milestoneIds`                 |
| Milestone | Workspace        | Has `taskIds`                      |
| Task      | Workspace + Milestone | Optional `sprintId` (which sprint it’s in) |
| Sprint    | Workspace        | Has `taskIds` (tasks in this week) |

- A **task** always has one **milestone** (the “goal” it supports).
- A **task** has at most one **sprint** (the week it’s committed to); if `sprintId` is null, it’s backlog.
- A **sprint** “contains” tasks by listing their IDs; those same tasks have `sprintId` set to that sprint.

---

## Example

1. **Workspace:** “Acme”
2. **Milestone:** “Launch MVP” (active)
3. **Tasks under “Launch MVP”:** “Set up auth”, “Build landing page”, “Stripe integration” (all `sprintId: null` → backlog)
4. **Sprint:** Week Feb 10–16. You add “Set up auth” and “Build landing page” to this sprint.
   - Those two tasks now have `sprintId` = this sprint’s ID.
   - “Stripe integration” stays in backlog.
5. You **lock** the sprint → commitment written to ledger.
6. End of week you **close** the sprint: e.g. 1/2 tasks done (50%) → completion written to ledger.

---

## Where in the app

- **Workspace overview** (`/dashboard/[workspaceId]`): Milestones, add task to milestone, validations, see current sprint.
- **Sprints** (`/dashboard/[workspaceId]/sprints`): Create sprints, add tasks (by milestone), lock, close, delete.
- **Analytics**: Execution over time (sprint completion), task completion, AI insights.
- **Investor**: AI-generated summary from milestones, tasks, sprints, validations.

This is the full **task ↔ sprint ↔ milestone** hierarchy in Runway.
