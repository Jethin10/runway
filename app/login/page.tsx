"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RunwayLogo } from "@/components/RunwayLogo";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle, user, isConfigured } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  if (user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
      // Redirect flow: page will navigate to Google; when user returns, onAuthStateChanged will fire and we redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Sign in with Google failed");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isConfigured) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-background-light dark:bg-background-dark">
        <div className="flex items-center gap-2 mb-8">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <RunwayLogo className="size-6" />
          </div>
          <h1 className="text-xl font-extrabold">Runway</h1>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 max-w-md text-center">
          <p className="font-semibold text-amber-800 dark:text-amber-200">Firebase not configured</p>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
            Add <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env.local</code> with
            NEXT_PUBLIC_FIREBASE_* variables. See .env.example.
          </p>
          <Link href="/" className="inline-block mt-4 text-primary font-bold hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative min-h-screen flex flex-col items-center justify-center px-6 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url(/login-bg.png)" }}
    >
      <div className="absolute inset-0 bg-white/30 dark:bg-black/30 pointer-events-none" aria-hidden />
      <div className="relative w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2 mb-8 justify-center">
          <div className="bg-primary p-1.5 rounded-lg text-white">
            <RunwayLogo className="size-6" />
          </div>
          <h1 className="text-xl font-extrabold text-[#111418] dark:text-white">Runway</h1>
        </Link>
        <div className="rounded-2xl border border-white/80 dark:border-white/10 bg-white/90 dark:bg-gray-900/90 shadow-xl backdrop-blur-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold text-center text-[#111418] dark:text-white">Sign in</h2>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-3 font-medium text-[#111418] dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <svg className="size-5" viewBox="0 0 24 24" aria-hidden>
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-600" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white/90 dark:bg-gray-900/90 px-2 text-gray-500 dark:text-gray-400">or continue with email</span>
              </div>
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-[#111418] dark:text-gray-200">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-[#111418] dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-[#111418] dark:text-gray-200">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-[#111418] dark:text-white"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white rounded-lg py-3 font-bold hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Sign in with email"}
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
            No account?{" "}
            <Link href="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
