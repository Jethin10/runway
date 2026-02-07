/**
 * Step 2: Structured extraction from pitch deck text.
 * AI scope: extraction and classification ONLY. No strategy, no invention, no scoring.
 * When OPENAI_API_KEY is set, uses OpenAI to extract. Otherwise uses a deterministic mock.
 */

import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { PitchExtraction } from "@/lib/onboarding-types";

export interface ExtractPitchBody {
  slides: { slideIndex: number; text: string }[];
}

const EXTRACTION_SYSTEM = `You extract structure from pitch deck text. Output valid JSON only. No markdown, no explanation.
Rules:
- Extract only what is explicitly stated. If something is missing, use null.
- Do NOT invent, infer, or add content.
- startupName: string or null (e.g. from title slide).
- problemStatement: 1-2 sentences or null.
- solutionDescription: 1-2 sentences or null.
- milestones: array of up to 3 strings (roadmap/timeline items). Empty array if none.
- traction: string or null (users, pilots, revenue, validation signals).
- confidenceNotes: one short sentence listing what was found and what was missing.

Output format: {"startupName":...|null,"problemStatement":...|null,"solutionDescription":...|null,"milestones":[...],"traction":...|null,"confidenceNotes":"..."}`;

/**
 * Mock extractor: derives structure from slide order and simple patterns.
 * - Slide 0: often title → startup name
 * - Problem/solution/roadmap/traction: first occurrence of keywords or first slides.
 * Does NOT invent data; returns null for missing fields. Max 3 milestones.
 */
function mockExtract(slides: { slideIndex: number; text: string }[]): PitchExtraction {
  const fullText = slides.map((s) => s.text).join("\n\n");
  const lines = fullText.split(/\n/).map((l) => l.trim()).filter(Boolean);

  let startupName: string | null = null;
  if (slides[0]?.text) {
    const firstSlide = slides[0].text.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (firstSlide[0]) startupName = firstSlide[0].slice(0, 80);
  }

  const problemKeywords = /problem|pain|challenge|issue/i;
  const solutionKeywords = /solution|product|we build|our (product|app)/i;
  const roadmapKeywords = /roadmap|timeline|milestone|phase|quarter|q1|q2|launch/i;
  const tractionKeywords = /traction|users|revenue|pilot|interview|validation|beta/i;

  let problemStatement: string | null = null;
  let solutionDescription: string | null = null;
  const milestoneCandidates: string[] = [];
  let traction: string | null = null;

  for (const s of slides) {
    const t = s.text;
    if (!t) continue;
    if (!problemStatement && problemKeywords.test(t))
      problemStatement = t.slice(0, 300);
    if (!solutionDescription && solutionKeywords.test(t))
      solutionDescription = t.slice(0, 300);
    if (roadmapKeywords.test(t)) {
      const bullets = t.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 10 && /^[-*•\d.]/i.test(l) || /q[1-4]|phase|launch|milestone/i.test(l));
      for (const b of bullets.slice(0, 5)) if (b.length > 0 && b.length < 120) milestoneCandidates.push(b);
    }
    if (!traction && tractionKeywords.test(t)) traction = t.slice(0, 200);
  }

  const milestones = milestoneCandidates.slice(0, 3);
  if (milestones.length === 0 && lines.length >= 3) {
    lines.slice(0, 3).forEach((l) => { if (l.length > 15 && l.length < 100) milestoneCandidates.push(l); });
  }
  const finalMilestones = (milestoneCandidates.length ? milestoneCandidates : lines).slice(0, 3).filter(Boolean);

  const confidenceNotes = [
    startupName ? "Startup name from first slide." : "Startup name not detected.",
    problemStatement ? "Problem section found." : "Problem section not found.",
    solutionDescription ? "Solution section found." : "Solution section not found.",
    finalMilestones.length ? `Up to 3 milestones extracted (${finalMilestones.length}).` : "No clear roadmap/milestones; review suggested items.",
    traction ? "Traction/validation text found." : "Traction not found.",
  ].join(" ");

  return {
    startupName,
    problemStatement,
    solutionDescription,
    milestones: finalMilestones,
    traction: traction || null,
    confidenceNotes,
  };
}

/** Use OpenAI to extract structure. Same contract: extract only, null when missing. */
async function openaiExtract(slides: { slideIndex: number; text: string }[]): Promise<PitchExtraction> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");

  const text = slides.map((s) => `[Slide ${s.slideIndex + 1}]\n${s.text}`).join("\n\n");
  const openai = new OpenAI({ apiKey });

  const res = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: EXTRACTION_SYSTEM },
      { role: "user", content: `Extract from this pitch deck text:\n\n${text.slice(0, 12000)}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
  });

  const raw = res.choices[0]?.message?.content?.trim();
  if (!raw) throw new Error("Empty OpenAI response");

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const milestones = Array.isArray(parsed.milestones)
    ? (parsed.milestones as string[]).slice(0, 3)
    : [];

  return {
    startupName: typeof parsed.startupName === "string" ? parsed.startupName : null,
    problemStatement: typeof parsed.problemStatement === "string" ? parsed.problemStatement : null,
    solutionDescription: typeof parsed.solutionDescription === "string" ? parsed.solutionDescription : null,
    milestones,
    traction: typeof parsed.traction === "string" ? parsed.traction : null,
    confidenceNotes: typeof parsed.confidenceNotes === "string" ? parsed.confidenceNotes : "Extracted with OpenAI.",
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ExtractPitchBody;
    const { slides } = body;
    if (!Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json(
        { error: "Missing or empty slides array." },
        { status: 400 }
      );
    }

    const useOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const extraction = useOpenAI
      ? await openaiExtract(slides)
      : mockExtract(slides);
    return NextResponse.json(extraction);
  } catch (err) {
    console.error("extract-pitch:", err);
    return NextResponse.json(
      { error: "Extraction failed." },
      { status: 500 }
    );
  }
}
