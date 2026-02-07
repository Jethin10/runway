"use client";

/**
 * Pitch-deck–to–workspace onboarding.
 * Flow: Upload → Extract (server) → Review (founder edits) → Create (draft only).
 * AI scope: extraction only. No auto-commit, no ledger writes.
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import {
  createWorkspace,
  createMilestone,
  createSprint,
} from "@/lib/firestore";
import type { PitchExtraction, OnboardingDraft } from "@/lib/onboarding-types";
import { extractTextFromPdfFile } from "@/lib/pdf-extract-client";
import { RunwayLogo } from "@/components/RunwayLogo";

type Step = "upload" | "extracting" | "review" | "creating";

function getDefaultSprintWeek(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() + (7 - now.getDay()) % 7);
  if (start <= now) start.setDate(start.getDate() + 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function extractionToDraft(ext: PitchExtraction): OnboardingDraft {
  const week = getDefaultSprintWeek();
  return {
    startupName: ext.startupName?.trim() || "My startup",
    problemStatement: ext.problemStatement?.trim() || "",
    solutionDescription: ext.solutionDescription?.trim() || "",
    milestones: ext.milestones?.length ? [...ext.milestones] : ["Milestone 1"],
    traction: ext.traction?.trim() || "",
    sprintWeekStart: week.start,
    sprintWeekEnd: week.end,
  };
}

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [draft, setDraft] = useState<OnboardingDraft | null>(null);
  const [confidenceNotes, setConfidenceNotes] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, loading, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    setFile(f || null);
    setExtractError(null);
  };

  const handleUploadAndExtract = async () => {
    if (!file) return;
    setExtractError(null);
    setStep("extracting");

    try {
      // PDF: extract text in the browser (avoids server-side pdf-parse/webpack issues)
      const isPdf = file.type.toLowerCase().includes("pdf");
      let slides: { slideIndex: number; text: string }[];
      if (isPdf) {
        slides = await extractTextFromPdfFile(file);
      } else {
        setExtractError("Only PDF is supported. Please upload a PDF or export your deck as PDF.");
        setStep("upload");
        return;
      }
      if (!slides?.length) throw new Error("No text could be extracted from the file.");

      const resPitch = await fetch("/api/extract-pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });
      if (!resPitch.ok) throw new Error("Failed to extract structure from your pitch.");
      const extraction: PitchExtraction = await resPitch.json();

      setConfidenceNotes(extraction.confidenceNotes ?? null);
      setDraft(extractionToDraft(extraction));
      setStep("review");
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : "Something went wrong.");
      setStep("upload");
    }
  };

  const handleCreateWorkspace = async () => {
    if (!user || !draft) return;
    setCreateError(null);
    setStep("creating");

    try {
      const workspaceId = await createWorkspace(
        draft.startupName.trim() || "My startup",
        "Idea",
        user.uid,
        user.email ?? "",
        user.displayName ?? ""
      );

      for (let i = 0; i < draft.milestones.length; i++) {
        await createMilestone(
          workspaceId,
          draft.milestones[i].trim() || `Milestone ${i + 1}`,
          "",
          i
        );
      }

      await createSprint(
        workspaceId,
        draft.sprintWeekStart,
        draft.sprintWeekEnd,
        [],
        [],
        user.uid
      );

      router.replace(`/dashboard/${workspaceId}?fromOnboarding=1`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create workspace.");
      setStep("review");
    }
  };

  const updateDraft = (updates: Partial<OnboardingDraft>) => {
    setDraft((d) => (d ? { ...d, ...updates } : null));
  };

  const removeMilestone = (index: number) => {
    setDraft((d) => d && d.milestones.length > 1 ? { ...d, milestones: d.milestones.filter((_, i) => i !== index) } : d);
  };

  const addMilestone = () => {
    setDraft((d) => d ? { ...d, milestones: [...d.milestones, ""] } : null);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-slate-900">
        <p className="text-sm text-[#64748b]">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-900">
      <header className="border-b border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a]">
              <RunwayLogo className="size-5" />
            </div>
            <span className="font-semibold text-[#0f172a] dark:text-white">Runway</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-[#64748b] dark:text-slate-400 hover:text-[#0f172a] dark:hover:text-white">
            Skip to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-xl font-semibold text-[#0f172a] dark:text-white mb-1">
          Create workspace from your pitch deck
        </h1>
        <p className="text-sm text-[#64748b] dark:text-slate-400 mb-8">
          Used to extract structure from your pitch deck. You review and edit before anything is created.
        </p>

        {step === "upload" && (
          <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm">
            <p className="text-sm font-medium text-[#0f172a] dark:text-white mb-2">Upload your pitch deck (PDF)</p>
            <p className="text-xs text-[#64748b] dark:text-slate-400 mb-4">
              We extract text from your slides to suggest a draft workspace. File is not stored.
            </p>
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-[#64748b] file:mr-4 file:rounded-md file:border-0 file:bg-[#0f172a] file:px-4 file:py-2 file:text-white file:text-sm"
            />
            {extractError && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">{extractError}</p>
            )}
            <button
              type="button"
              onClick={handleUploadAndExtract}
              disabled={!file}
              className="mt-4 h-9 px-4 rounded-md bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] text-sm font-medium disabled:opacity-50"
            >
              Extract and continue
            </button>
          </div>
        )}

        {step === "extracting" && (
          <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center">
            <p className="text-sm text-[#64748b] dark:text-slate-400">Extracting structure from your pitch…</p>
            <p className="text-xs text-[#94a3b8] dark:text-slate-500 mt-1">You will review the draft before anything is created.</p>
          </div>
        )}

        {step === "review" && draft && (
          <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 p-6 shadow-sm space-y-6">
            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                This is a draft created from your pitch. Review and edit before continuing.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1">Startup name</label>
              <input
                type="text"
                value={draft.startupName}
                onChange={(e) => updateDraft({ startupName: e.target.value })}
                className="w-full h-9 rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1">Problem (optional)</label>
              <textarea
                value={draft.problemStatement}
                onChange={(e) => updateDraft({ problemStatement: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1">Solution (optional)</label>
              <textarea
                value={draft.solutionDescription}
                onChange={(e) => updateDraft({ solutionDescription: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400">Suggested milestones (max 3)</label>
                <button type="button" onClick={addMilestone} className="text-xs font-medium text-[#0f172a] dark:text-white hover:underline">
                  Add
                </button>
              </div>
              {draft.milestones.map((m, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={m}
                    onChange={(e) => {
                      const next = [...draft.milestones];
                      next[i] = e.target.value;
                      updateDraft({ milestones: next });
                    }}
                    className="flex-1 h-9 rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeMilestone(i)}
                    disabled={draft.milestones.length <= 1}
                    className="text-sm text-red-600 dark:text-red-400 disabled:opacity-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1">Traction / validation (optional)</label>
              <textarea
                value={draft.traction}
                onChange={(e) => updateDraft({ traction: e.target.value })}
                rows={2}
                className="w-full rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#64748b] dark:text-slate-400 mb-1">Suggested first sprint duration (1 week)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={draft.sprintWeekStart}
                  onChange={(e) => updateDraft({ sprintWeekStart: e.target.value })}
                  className="h-9 rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
                />
                <input
                  type="date"
                  value={draft.sprintWeekEnd}
                  onChange={(e) => updateDraft({ sprintWeekEnd: e.target.value })}
                  className="h-9 rounded-md border border-[#e2e8f0] dark:border-slate-600 bg-white dark:bg-slate-900 px-3 text-sm"
                />
              </div>
            </div>
            {confidenceNotes && (
              <p className="text-xs text-[#64748b] dark:text-slate-500 border-t border-[#e2e8f0] dark:border-slate-700 pt-3">
                {confidenceNotes}
              </p>
            )}
            {createError && <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>}
            <button
              type="button"
              onClick={handleCreateWorkspace}
              className="w-full h-10 rounded-md bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] text-sm font-medium"
            >
              Create workspace from this draft
            </button>
          </div>
        )}

        {step === "creating" && (
          <div className="rounded-xl border border-[#e2e8f0] dark:border-slate-700 bg-white dark:bg-slate-800 p-8 text-center">
            <p className="text-sm text-[#64748b] dark:text-slate-400">Creating your workspace…</p>
          </div>
        )}
      </main>
    </div>
  );
}
