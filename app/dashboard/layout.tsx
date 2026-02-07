"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { RunwayLogo } from "@/components/RunwayLogo";
import { useEffect } from "react";

const SIDEBAR_NAV = [
  { href: "/dashboard", label: "Workspaces", icon: "grid_view" },
] as const;

const WORKSPACE_NAV = [
  { label: "Overview", icon: "home", pathPart: "" },
  { label: "Sprints", icon: "update", pathPart: "/sprints" },
  { label: "Analytics", icon: "analytics", pathPart: "/analytics" },
  { label: "Funding", icon: "payments", pathPart: "/funding" },
  { label: "Team", icon: "groups", pathPart: "/team" },
  { label: "Integrations", icon: "hub", pathPart: "/integrations" },
  { label: "Investor readiness", icon: "summarize", pathPart: "/investor" },
] as const;

export default function DashboardLayout({
  children,
}: { children: React.ReactNode }) {
  const { user, loading, signOut, isConfigured } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const segments = pathname.split("/").filter(Boolean);
  const workspaceId = segments[1];

  useEffect(() => {
    if (loading) return;
    if (!user && isConfigured) {
      router.replace("/login");
      return;
    }
  }, [user, loading, isConfigured, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f6f8] dark:bg-background-dark">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex bg-[#f5f6f8] dark:bg-background-dark">
      {/* Left sidebar - Dreelio style */}
      <aside className="w-[240px] min-w-[240px] flex flex-col border-r border-[#e8eaed] dark:border-white/10 bg-white dark:bg-[#1a2530]">
        <div className="p-4 border-b border-[#e8eaed] dark:border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
              <RunwayLogo className="size-5" />
            </div>
            <span className="text-lg font-bold text-[#111418] dark:text-white tracking-tight">
              Runway
            </span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/dashboard"
                ? "bg-primary/10 text-primary"
                : "text-[#5f6368] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#111418] dark:hover:text-white"
            }`}
          >
            <span className="material-symbols-outlined text-[22px]">grid_view</span>
            Workspaces
          </Link>
          {workspaceId && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#9aa0a6] dark:text-gray-500">
                  Workspace
                </p>
              </div>
              {WORKSPACE_NAV.map((item) => {
                const href = `/dashboard/${workspaceId}${item.pathPart}`;
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-[#5f6368] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#111418] dark:hover:text-white"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </>
          )}
        </nav>
        <div className="p-3 border-t border-[#e8eaed] dark:border-white/10">
          <Link
            href="/upgrade"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#5f6368] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#111418] dark:hover:text-white mb-1"
          >
            <span className="material-symbols-outlined text-[22px]">workspace_premium</span>
            Upgrade
          </Link>
          <div className="px-3 py-2 text-xs text-[#9aa0a6] dark:text-gray-500 truncate">
            {user.email}
          </div>
          <button
            onClick={() => signOut().then(() => router.push("/"))}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#5f6368] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-[#111418] dark:hover:text-white"
          >
            <span className="material-symbols-outlined text-[22px]">logout</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#f5f6f8] dark:bg-background-dark">
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
