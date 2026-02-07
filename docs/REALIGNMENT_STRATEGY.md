# Runway — Product Realignment Strategy

**Purpose:** Align Runway with hackathon judging criteria, honest positioning, and defensible innovation.  
**Based on:** Deep audit (Feb 2025).  
**Constraints:** No UI redesign, no complex new tech, no overclaiming.

---

## STEP 1 — BUSINESS-FIRST REALIGNMENT

### Product Positioning (Judge Pitch)

**Who is the exact initial customer?**  
Early-stage founders (pre-seed to seed) with 1–5 people, running weekly sprints, who need to prove execution to investors or co-founders.

**What painful, expensive problem do they have?**  
Founders juggle tasks in Notion, validation in spreadsheets, and metrics in slides. When an investor asks "what did you ship last month?", they scramble to piece together evidence. Progress is assumed, not proven.

**What does that problem cost them?**  
- **Time:** 2–5 hours/week assembling updates, digging through tools, rebuilding context  
- **Money:** Missed funding rounds or delayed terms when they can't demonstrate execution  
- **Credibility:** Investors and co-founders lose trust when commitments are vague or unverifiable

**Why existing tools fail to solve it?**  
- Project tools (Jira, Asana): built for software teams, not startup milestones or validation  
- Validation tools: separate from execution; no link to sprints or tasks  
- Pitch decks: static snapshots, not live evidence of progress

**What is Runway's core promise?**  
*One workspace where founders plan weekly goals, track execution, log validation, and generate an investor-ready record—so progress is visible, not assumed.*

---

## STEP 2 — CORE PRODUCT DEFINITION

### What Runway IS

Runway is an **execution workspace for early-stage founders** that combines weekly sprint planning, milestone and task tracking, validation logging, and an audit trail of commitments and completions—all in one place, designed for investor readiness.

### What Runway is NOT

- **Not** a full project management tool (no Gantt, Kanban, dependencies)  
- **Not** an AI-powered platform (insights are rule-based)  
- **Not** a blockchain product (ledger uses hashes in Firestore; chain integration is optional/future)  
- **Not** an integrations hub (Slack/GitHub etc. are planned, not shipped)

### Core Weekly Usage Loop

| Phase | What happens | Data generated |
|-------|--------------|----------------|
| **Start of week** | Founder creates sprint (dates, goals, tasks) → **Locks** sprint | Commitment hash written to ledger |
| **During execution** | Team updates task status (todo → in progress → done) | Task status changes |
| **During week** | Founder logs validation (interview/survey/experiment) per milestone | Validation entries |
| **End of week** | Founder **Closes** sprint | Completion hash + stats written to ledger |
| **Review** | Founder views analytics, insights, investor summary | KPIs, charts, pitch outline |

**Data flow:** Sprints → Tasks → Validations → Ledger. Analytics and insights derive from this.

---

## STEP 3 — FEATURE RESCOPING (RUTHLESS)

| Feature | Category | Rationale | Demo treatment |
|---------|----------|-----------|----------------|
| Workspaces, milestones, tasks | **A) CORE** | Core execution value | Show first, emphasize |
| Sprints (create, lock, close) | **A) CORE** | Core loop; ledger trigger | Full walkthrough |
| Validation logging | **A) CORE** | Mandatory hackathon module | Show flow + recent entries |
| Analytics (KPIs, charts) | **A) CORE** | Mandatory analytics module | Show 4 KPIs + 2 charts |
| Ledger (hashes, timestamps) | **A) CORE** | Trust layer; defensible | Show entries; say "hash-based audit trail" |
| Team roles (founder/team/investor) | **A) CORE** | Mandatory roles | Show Team page + role badges |
| Execution insights (stalled, low completion) | **B) SUPPORTING** | Rule-based, honest | Show if data triggers; say "rule-based alerts" |
| Validation insights (missing/weak) | **B) SUPPORTING** | Rule-based, honest | Same |
| Investor pitch outline | **B) SUPPORTING** | Generated from data | Show; say "auto-generated from your data" |
| Integrations (Slack, GitHub, etc.) | **C) MOCKED** | UI only, no OAuth | Remove from prominent nav OR add "Coming soon" |
| Upgrade / Pro plan | **C) MOCKED** | No payment | Keep; add "Demo — no payment" label |
| Social proof (Stripe, Netflix logos) | **D) CUT** | Fake | Remove from landing |
| AI forecasting / prediction claims | **D) CUT** | Not implemented | Replace with "rule-based insights" |

### Specific Rescoping Decisions

- **AI:** Rebrand from "AI-powered" to "Rule-based insights" everywhere. Keep the logic; change the framing.
- **Blockchain:** Rebrand from "Blockchain Ledger" to "Hash-based execution ledger" or "Audit trail". No chain claim.
- **Integrations:** Either remove from sidebar and add "Integrations (coming soon)" in footer, or keep page with "Connect (coming soon)" on each card.
- **Social proof:** Remove logo row. Replace with "Built for early-stage founders" or similar, no fake logos.

---

## STEP 4 — AI REALIGNMENT (NO HYPE)

### AI Features (Rule-Based) — Honest Specification

| Feature | Input data | Rule/logic | Output to user | Decision helped |
|---------|------------|------------|----------------|-----------------|
| Execution insights | Milestones, tasks, sprints | Stalled: active milestone + &lt;20% task completion + ≥2 tasks | "Milestone progressing slowly" | Reprioritize or unblock |
| | | Stale: no task update in 14 days | "No recent activity" | Check if blocked |
| | | Risk: 2+ sprints &lt;50% completion | "Sprint completion rate low" | Smaller goals or address blockers |
| Validation insights | Milestones, validations | Missing: active milestone + 0 validations | "No validation recorded" | Log interviews/surveys |
| | | Weak: 1 validation only | "Single validation source" | Add more validation |
| Investor summary | Workspace, milestones, tasks, validations, sprints | Aggregate counts, percentages, list next milestones | Problem, Solution, Traction, Roadmap | Prepare pitch, share with investor |

### Copy Rewrites — AI-Related

| Location | Current (overclaim) | Replace with |
|----------|---------------------|--------------|
| Landing hero / execution | "AI-powered insights and verifiable blockchain milestones" | "Structured workspaces with rule-based insights and an audit trail" |
| Features grid | "AI-enhanced precision and blockchain-grade security" | "Structured tracking with an audit trail of commitments and completions" |
| Features grid (Execution card) | "automated status reporting and AI forecasting" | "automated status aggregation and rule-based alerts" |
| Insights section | "AI-driven insights layer... blockchain-verified precision" | "Rule-based alerts and progress metrics" |
| AI section headline | "AI-Powered Intelligence" | "Smart Alerts & Summaries" |
| AI section subhead | "Leverage our AI layer to navigate complexity" | "Get alerts and summaries from your execution and validation data" |
| AI card 1 | "AI-assisted execution insights... Our models predict delays" | "Execution alerts — Identify stalled milestones and low completion from your task and sprint data" |
| AI card 2 | "Validation signal analysis... Turn raw customer interviews into actionable roadmap items" | "Validation alerts — Highlight milestones with no or weak validation so you can de-risk" |
| AI card 3 | "Investor-ready summaries... Auto-generate a structured snapshot" | "Investor outline — Generate a structured snapshot (problem, solution, traction, roadmap) from your workspace data" |
| Pro plan (Upgrade) | "AI-powered insights & suggestions" | "Advanced insights & export" |
| Footer | "Powered by AI, secured by Blockchain" | "Execution workspace for early-stage founders" |

---

## STEP 5 — BLOCKCHAIN REALIGNMENT (TRUST-ONLY)

### Chosen Path: **Option 2 — Remove blockchain branding, keep cryptographic integrity via hashes**

**Rationale:**  
- No chain exists; claiming "blockchain" is overclaim and gimmicky.  
- Hash + timestamp in Firestore already provides tamper-evident integrity.  
- "Audit trail" or "execution ledger" is honest and defensible.  
- Future chain integration can be optional; no need to promise it now.

### What is stored

- **Commitment:** Hash of sprint ID + goals + task IDs, written when sprint is locked.  
- **Completion:** Hash of sprint ID + completion stats (tasks done, %, blocked), written when sprint is closed.  
- **Metadata:** Workspace ID, sprint ID, type, payload summary, timestamp. Stored in Firestore `ledger` collection; entries immutable (update/delete disallowed in rules).

### When it is written

- **Lock sprint** → commitment hash  
- **Close sprint** → completion hash  

### Who benefits

Founders (and investors) who want verifiable proof that commitments were made and outcomes recorded. No third-party verification; integrity is local and auditable.

### One-sentence explanation for judges

*"Sprint commitments and completions are hashed and timestamped in an audit trail so you can prove what was planned and what was delivered."*

### Copy Rewrites — Blockchain-Related

| Location | Current (overclaim) | Replace with |
|----------|---------------------|--------------|
| Execution section (floating card) | "On-Chain Ledger / Execution Verified" | "Audit Trail / Execution Recorded" |
| Features grid (Team roles) | "On-chain accountability for critical decisions" | "Role-based access; execution history is recorded" |
| Insights section | "blockchain-verified precision" | "audit trail" |
| Trust section headline | "Trust Layer: Blockchain Ledger" | "Trust Layer: Execution Audit Trail" |
| Trust section body | "cryptographically hashed and time-stamped... tamper-resistant" | Keep "cryptographically hashed and time-stamped"; remove "blockchain" |
| Trust sub-card | "Practical blockchain integration" | "Verifiable execution history" |
| Trust sub-card | "Proof of execution for VCs" | Keep |
| Ledger page title | "Execution & Validation Ledger" | Keep (no blockchain in title) |
| Ledger page body | "No tokens or wallets" | "Hashes and timestamps stored in Firestore. No tokens or wallets." |
| Footer | "Powered by AI, secured by Blockchain" | "Execution workspace for early-stage founders" |
| Stitch/landing hash card | "EXECUTION_HASH_V2.0" | Keep (it's accurate—it's a hash) |

---

## STEP 6 — BUSINESS MODEL & COSTS

### Free Tier

- **Who:** Solo founders, very early teams  
- **What:** 1 workspace, unlimited milestones/tasks/sprints/validations, basic analytics, rule-based insights, investor outline, audit trail  
- **Price:** ₹0/month  
- **Goal:** Get them in the loop; prove value before asking for payment

### Paid Tier (Pro)

- **Who:** Teams with multiple workspaces, need exports, want support  
- **What:** Unlimited workspaces, advanced analytics (export), priority support, full audit trail  
- **Price:** ₹999/month (or similar)  
- **Value tie:** "Prove execution faster — spend less time building investor updates"

### Who pays and why

Founders who are actively fundraising or managing a team. They pay because Runway saves time assembling proof of progress and reduces the credibility risk of vague updates.

### Rough cost per customer

- **Infra (Firebase):** ~₹50–200/user/month at scale (Firestore, Auth)  
- **AI (if added later):** LLM calls could add ₹100–500/user/month  
- **Current (rule-based):** Near-zero marginal cost for insights  

### Main maintenance costs

- Firebase (Auth, Firestore)  
- Hosting (Vercel)  
- No blockchain gas or wallet infra (none implemented)

---

## STEP 7 — CONCRETE ACTION PLAN

### 1. Exact Copy Changes

**Landing (`app/page.tsx`):**

- Hero: Remove "AI-powered" and "blockchain" from any hero/subhero copy. Use "Structured execution workspace" and "audit trail".
- Execution section: "On-Chain Ledger" → "Audit Trail"; "verifiable blockchain milestones" → "audit trail of commitments".
- Features: "AI-enhanced precision and blockchain-grade security" → "structured tracking with an audit trail".
- Execution card: "AI forecasting" → "rule-based alerts".
- Team roles card: "On-chain accountability" → "Role-based access; execution history recorded".
- Insights: "AI-driven" and "blockchain-verified" → "Rule-based alerts and progress metrics".
- AI section: Full rewrite per Step 4 table.
- Trust section: "Blockchain Ledger" → "Execution Audit Trail"; keep hash/timestamp language; remove "blockchain".
- Footer: "Powered by AI, secured by Blockchain" → "Execution workspace for early-stage founders".
- Social proof: Remove logo row (Stripe, Netflix, etc.); replace with simple "Built for early-stage founders" or similar.

**Upgrade (`app/upgrade/page.tsx`):**

- Pro plan: "AI-powered insights & suggestions" → "Advanced insights & export".
- Keep "Mock subscription" / "Demo only" messaging.

**Ledger page (`app/dashboard/[workspaceId]/ledger/page.tsx`):**

- Subhead: Add "Hashes and timestamps stored in Firestore. No tokens or wallets." (or similar) for clarity.

**Investor page:**  
- Subhead: "Auto-generated from your workspace data" (already close; ensure no "AI" claim).

### 2. Backend Logic

- **No changes** to `lib/ai-mock.ts` or `lib/ledger-mock.ts` logic. Only framing changes.
- Optionally add a comment at top of `ai-mock.ts`: "Rule-based insights. No LLM. Honest framing: 'insights' or 'alerts', not 'AI'."
- Optionally add comment in `ledger-mock.ts`: "Hash-based audit trail. No blockchain. Chain integration optional for future."

### 3. Data Model

- **No changes** required. Current model supports the realigned positioning.

### 4. Features to Mock Clearly

| Feature | How to mark |
|---------|-------------|
| Integrations | Add "Coming soon" to each integration card; or remove Integrations from sidebar and add to footer as "Integrations (coming soon)". |
| Upgrade / Pro | Keep "Mock subscription flow" and "Demo only — no payment charged" visible. |
| Team invites | Keep; add note in UI or docs: "Invites create placeholder entries; full invite flow coming soon." |

### 5. What to Highlight vs Downplay in Demo

**Highlight (in order):**

1. Execution loop: Create milestone → Add task → Create sprint → Lock (commitment hash) → Update tasks → Close (completion hash).  
2. Ledger: Show commitment + completion entries; say "audit trail of what you planned and what you delivered."  
3. Validation: Log interview/survey/experiment; show recent validations.  
4. Analytics: 4 KPIs + 2 charts.  
5. Investor outline: Generated from data; say "auto-generated from your workspace."  
6. Insights: If any trigger, say "rule-based alerts from your execution and validation data."  
7. Team roles: Founder, team member, investor; show role badges.

**Downplay:**

- Integrations: "Planned, not shipped."  
- AI: "Rule-based alerts and summaries, not LLM."  
- Blockchain: Don't say "blockchain"; say "hash-based audit trail."  
- Social proof: Don't mention "500+ startups" or logo row if removed.

---

## STEP 8 — JUDGE-READY EXPLANATIONS

### 20-Second AI Explanation (Honest, No Hype)

*"Runway doesn't use an LLM. We use rule-based logic: for example, if a milestone has been active for two weeks with no task updates, we flag it. If you have no validation logged for a milestone, we alert you. And we generate an investor outline by aggregating your task counts, milestone status, and validation entries. It's deterministic and transparent—you can see exactly why each insight appears. We can plug in an LLM later for richer summaries, but today it's rule-based and defensible."*

### 20-Second Blockchain Explanation (Trust-Focused)

*"We don't use a blockchain. When you lock a sprint, we hash the commitment—goals and tasks—and store that hash with a timestamp in Firestore. When you close a sprint, we hash the completion stats. The ledger is immutable: you can't edit or delete entries. That gives you a verifiable record of what you planned and what you delivered. It's cryptographic integrity without tokens or a chain. If an investor wants proof, you can show them the ledger."*

### 30-Second Business Pitch for Runway

*"Early-stage founders waste hours every week pulling together proof of progress—tasks here, validation there, metrics in slides. When investors ask 'what did you ship?', the answer is scattered. Runway is one workspace: you plan weekly sprints, track milestones and tasks, log validation, and get an audit trail of commitments and completions. Progress is visible, not assumed. We start with a free tier for solo founders; teams that need multiple workspaces and exports pay. The core value is execution clarity and investor readiness—less scrambling, more credibility."*

---

## Summary Checklist

- [ ] Landing: Remove AI/blockchain overclaim; add audit trail framing  
- [ ] AI section: Rewrite as "Smart Alerts & Summaries"; rule-based only  
- [ ] Trust section: "Execution Audit Trail"; no blockchain branding  
- [ ] Social proof: Remove fake logos  
- [ ] Upgrade: "Advanced insights" not "AI-powered"  
- [ ] Integrations: "Coming soon" or remove from nav  
- [ ] Demo script: Emphasize execution loop + ledger + honest AI/blockchain framing  
- [ ] Judge explanations: Memorize 20s AI + 20s blockchain + 30s pitch  

---

*Document version: 1.0 | Based on Runway audit, Feb 2025*
