# Pitch-deck–to–workspace onboarding

This document describes the onboarding flow for judges and future maintainers.

## Principle

- **Extract structure, not strategy.** AI (or the mock) only extracts fields from the deck; it does not advise, score, or predict.
- **Suggest, not decide.** The founder sees a draft and must click "Create workspace from this draft" after editing.
- **No auto-commit.** Nothing is written to the ledger during onboarding. Sprints are created in draft (not locked).

## Flow

1. **Upload** — User uploads a PDF pitch deck on `/onboarding`. File is sent to `POST /api/extract-slides`; the server extracts text per page in memory and returns `{ slides: [{ slideIndex, text }] }`. File is not stored.

2. **Extract** — Client sends `{ slides }` to `POST /api/extract-pitch`. The server runs a **deterministic mock extractor** (see `app/api/extract-pitch/route.ts`) that derives:
   - Startup name (e.g. first slide)
   - Problem / solution / traction (keyword-based, first occurrence)
   - Up to 3 milestones (roadmap-like bullets or lines)
   - Confidence notes (what was found / missing)
   No data is invented; missing fields are `null`.

3. **Review** — User sees an editable draft: name, problem, solution, milestones, first sprint dates, traction. Copy states: "This is a draft created from your pitch. Review and edit before continuing." Creation only happens when the user clicks "Create workspace from this draft".

4. **Create** — On confirm, the app creates via existing Firestore helpers:
   - One workspace (name, stage "Idea", current user as founder)
   - Up to 3 milestones (status `planned`, no tasks yet)
   - One sprint (week start/end from draft, empty `taskIds`, `locked: false`, `completed: false`)
   No ledger writes, no hashes, no lock.

5. **Land** — Redirect to `/dashboard/[workspaceId]?fromOnboarding=1`. Overview shows a short message: "This workspace was created from your pitch deck. Review and adjust before starting your sprint." and a "Review sprint" link if a draft sprint exists.

## Entry points

- **Dashboard** — "From pitch deck" card links to `/onboarding`.
- **Onboarding** — "Skip to dashboard" and logo link back to `/dashboard`.

## Technical notes

- **PDF only** for hackathon. Non-PDF uploads get a clear error; PPT could be added via a server-side parser.
- **Mock extractor** in `app/api/extract-pitch/route.ts` is deterministic and explainable. It can be replaced by an LLM that obeys the same contract: extract only, return `null` when missing, no invention.
- **Types** — `lib/onboarding-types.ts`: `SlideText`, `PitchExtraction`, `OnboardingDraft`.
- **No automatic task generation** — The first sprint has zero tasks; the founder adds them from the Sprints page.

## Copy (no hype)

- "Used to extract structure from your pitch deck."
- "This is a draft created from your pitch. Review and edit before continuing."
- "Create workspace from this draft"
- "This workspace was created from your pitch deck. Review and adjust before starting your sprint."

We avoid phrases like "AI understands" or "intelligent"; AI is framed as extraction only.
