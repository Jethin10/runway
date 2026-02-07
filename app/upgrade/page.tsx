"use client";

import { useState } from "react";
import Link from "next/link";
import { RunwayLogo } from "@/components/RunwayLogo";

export default function UpgradePage() {
  const [clicked, setClicked] = useState(false);

  return (
    <div className="min-h-screen bg-[#f5f6f8] dark:bg-background-dark flex flex-col items-center justify-center px-6 py-12">
      <Link href="/dashboard" className="flex items-center gap-2 mb-10">
        <div className="bg-primary p-1.5 rounded-lg text-white">
          <RunwayLogo className="size-6" />
        </div>
        <span className="text-xl font-extrabold text-[#111418] dark:text-white">Runway</span>
      </Link>

      <div className="w-full max-w-4xl">
        <h1 className="text-3xl font-extrabold text-center text-[#111418] dark:text-white mb-2">
          Choose your plan
        </h1>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-10">
          Mock subscription flow — no real payment required. For hackathon demo.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#1a2530] rounded-2xl border-2 border-[#e8eaed] dark:border-white/10 p-8">
            <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-1">Free</h2>
            <p className="text-3xl font-extrabold text-[#111418] dark:text-white mb-4">
              ₹0 <span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <li>1 workspace</li>
              <li>Unlimited tasks</li>
              <li>Basic analytics</li>
              <li>Investor pitch outline</li>
            </ul>
            <Link
              href="/dashboard"
              className="block w-full text-center rounded-lg py-3 border-2 border-gray-200 dark:border-gray-600 text-[#111418] dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-white/5"
            >
              Current plan
            </Link>
          </div>

          <div className="bg-white dark:bg-[#1a2530] rounded-2xl border-2 border-primary p-8 relative">
            <div className="absolute top-4 right-4 px-2 py-0.5 rounded bg-primary/20 text-primary text-xs font-bold">
              Pro
            </div>
            <h2 className="text-xl font-bold text-[#111418] dark:text-white mb-1">Pro</h2>
            <p className="text-3xl font-extrabold text-primary mb-4">
              ₹999 <span className="text-sm font-normal text-gray-500">/month</span>
            </p>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <li>Unlimited workspaces</li>
              <li>AI-powered insights & suggestions</li>
              <li>Advanced analytics & exports</li>
              <li>Priority support</li>
              <li>Execution ledger & audit trail</li>
            </ul>
            <button
              type="button"
              onClick={() => setClicked(true)}
              className="w-full rounded-lg py-3 bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
            >
              Subscribe (demo)
            </button>
            {clicked && (
              <p className="mt-3 text-center text-sm text-green-600 dark:text-green-400 font-medium">
                Demo only — no payment charged. In production this would integrate a payment gateway.
              </p>
            )}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
          <Link href="/dashboard" className="text-primary hover:underline">Back to dashboard</Link>
        </p>
      </div>
    </div>
  );
}
