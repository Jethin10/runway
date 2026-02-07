"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { RunwayLogo } from "@/components/RunwayLogo";
import { useAuth } from "@/contexts/AuthContext";

function safeRedirectPath(redirect: string | null): string {
  if (!redirect || typeof redirect !== "string") return "/dashboard";
  const path = redirect.startsWith("/") ? redirect : `/${redirect}`;
  if (path.startsWith("/join/") || path.startsWith("/dashboard")) return path;
  return "/dashboard";
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp, user, isConfigured } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get("redirect");

  useEffect(() => {
    if (user) router.replace(safeRedirectPath(redirectParam));
  }, [user, router, redirectParam]);

  if (user) return null;

  const targetPath = safeRedirectPath(redirectParam);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signUp(email, password, displayName);
      router.push(targetPath);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background-light dark:bg-background-dark">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <RunwayLogo className="size-6" />
          </div>
          <h1 className="text-xl font-extrabold">Runway</h1>
        </Link>
        <p className="text-amber-600 dark:text-amber-400">Configure Firebase in .env.local first.</p>
        <Link href="/" className="mt-4 text-primary font-bold hover:underline">Back to home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background-light dark:bg-background-dark">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <div className="bg-primary p-1.5 rounded-lg text-white">
          <RunwayLogo className="size-6" />
        </div>
        <h1 className="text-xl font-extrabold text-[#111418] dark:text-white">Runway</h1>
      </Link>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold text-center">Create account</h2>
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium mb-1">
            Display name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Founder name"
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-[#111418] dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-[#111418] dark:text-white"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-[#111418] dark:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white rounded-lg py-3 font-bold hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Sign up"}
        </button>
        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href={redirectParam ? `/login?redirect=${encodeURIComponent(redirectParam)}` : "/login"}
            className="text-primary font-semibold hover:underline"
          >
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
