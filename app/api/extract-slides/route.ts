/**
 * Step 1: Extract raw text from uploaded pitch deck (PDF).
 * File is processed in memory only; nothing is persisted.
 * Returns slide-order-preserved text for use in structured extraction.
 */

import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json(
        { error: "Missing file. Upload a PDF or PPT." },
        { status: 400 }
      );
    }

    const contentType = file.type.toLowerCase();
    if (!contentType.includes("pdf")) {
      return NextResponse.json(
        { error: "Only PDF is supported. Please upload a PDF or export your deck as PDF." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uint8 = new Uint8Array(buffer);

    // Dynamic import: pdf-parse uses pdfjs under the hood; works in Node with data.
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: uint8 });
    const textResult = await parser.getText();
    await parser.destroy();

    const slides: { slideIndex: number; text: string }[] = (textResult.pages ?? []).map(
      (p: { num: number; text: string }) => ({
        slideIndex: p.num - 1,
        text: (p.text || "").trim(),
      })
    );

    if (slides.length === 0 && textResult.text) {
      slides.push({ slideIndex: 0, text: String(textResult.text).trim() });
    }

    return NextResponse.json({ slides });
  } catch (err) {
    console.error("extract-slides:", err);
    return NextResponse.json(
      { error: "Failed to extract text from file. Try a different PDF." },
      { status: 500 }
    );
  }
}
