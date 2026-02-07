/**
 * Client-side PDF text extraction (browser only).
 * Loads PDF.js from CDN to avoid Next.js webpack chunk issues with pdfjs-dist.
 * Call only from client components.
 */

import type { SlideText } from "./onboarding-types";

const PDFJS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174";
const PDF_SCRIPT_ID = "pdfjs-script";

declare global {
  interface Window {
    pdfjsLib?: {
      getDocument: (params: { data: ArrayBuffer }) => { promise: Promise<{ numPages: number; getPage: (i: number) => Promise<{ getTextContent: () => Promise<{ items: { str?: string }[] }> }> }> };
    };
  }
}

function loadPdfScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("Not in browser"));
  if (window.pdfjsLib) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (document.getElementById(PDF_SCRIPT_ID)) {
      if (window.pdfjsLib) resolve();
      else reject(new Error("PDF.js failed to load"));
      return;
    }
    const script = document.createElement("script");
    script.id = PDF_SCRIPT_ID;
    script.src = `${PDFJS_CDN}/pdf.min.js`;
    script.onload = () => {
      if (window.pdfjsLib) {
        resolve();
      } else {
        reject(new Error("PDF.js global not found"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });
}

export async function extractTextFromPdfFile(file: File): Promise<SlideText[]> {
  await loadPdfScript();
  const pdfjsLib = window.pdfjsLib;
  if (!pdfjsLib?.getDocument) throw new Error("PDF.js not available");

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = doc.numPages;
  const slides: SlideText[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => item.str ?? "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    slides.push({ slideIndex: i - 1, text });
  }

  return slides;
}
