/**
 * Types for pitch-deck–to–workspace onboarding.
 * AI scope: extraction and classification only. No strategy, no predictions.
 */

/** Raw text from one slide (or one chunk). Preserves order for extraction. */
export interface SlideText {
  slideIndex: number;
  text: string;
}

/**
 * Structured extraction from pitch deck text.
 * All fields are extracted only; missing data is null.
 * No invented or inferred data. No scoring or advice.
 */
export interface PitchExtraction {
  /** Startup name, e.g. from title slide. */
  startupName: string | null;
  /** Problem statement (1–2 sentences). */
  problemStatement: string | null;
  /** Solution description (1–2 sentences). */
  solutionDescription: string | null;
  /** Roadmap / milestones. Max 3 items. Bullet-like or timeline items. */
  milestones: string[];
  /** Traction or validation signals if present. */
  traction: string | null;
  /**
   * Explicit confidence notes for judges: what was found, what was missing.
   * Used for transparency only.
   */
  confidenceNotes?: string;
}

/** Draft workspace payload shown on review screen. Founder edits before confirm. */
export interface OnboardingDraft {
  startupName: string;
  problemStatement: string;
  solutionDescription: string;
  milestones: string[];
  traction: string;
  /** First sprint duration: week start (YYYY-MM-DD). */
  sprintWeekStart: string;
  /** First sprint duration: week end (YYYY-MM-DD). */
  sprintWeekEnd: string;
}
