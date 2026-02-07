"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
} from "firebase/auth";
import { isFirebaseConfigured, getFirebaseAuth } from "@/lib/firebase";
import type { UserRole } from "@/lib/types";

type AuthState = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  isConfigured: boolean;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isConfigured = isFirebaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });
    // Handle redirect result after Google sign-in (avoids popup + COOP issues)
    getRedirectResult(auth)
      .then(() => {})
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => unsub();
  }, [isConfigured]);

  const signIn = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
    // Page will reload and getRedirectResult() in useEffect will complete the sign-in
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const auth = getFirebaseAuth();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && cred.user) {
      // Firebase Auth displayName update would go here if needed
    }
  };

  const signOut = async () => {
    const auth = getFirebaseAuth();
    await fbSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signInWithGoogle,
        signUp,
        signOut,
        isConfigured,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/** Resolve current user's role in a workspace (from workspace.members). */
export function getRoleInWorkspace(
  userId: string | undefined,
  members: { userId: string; role: UserRole }[]
): UserRole | null {
  if (!userId) return null;
  const m = members.find((x) => x.userId === userId);
  return m?.role ?? null;
}
