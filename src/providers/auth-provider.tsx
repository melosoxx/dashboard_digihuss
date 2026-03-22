"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { User, SupabaseClient } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateUser: (attributes: {
    password?: string;
    data?: Record<string, unknown>;
  }) => Promise<{ error: Error | null }>;
  refreshUser: () => Promise<void>;
  verifyPassword: (password: string) => Promise<{ error: Error | null }>;
  sendPasswordReset: () => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  const supabase = useMemo<SupabaseClient | null>(() => {
    if (!isSupabaseConfigured()) return null;
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const refreshUser = useCallback(async () => {
    if (!supabase) return;
    const { data: { user: freshUser } } = await supabase.auth.getUser();
    if (freshUser) setUser(freshUser);
  }, [supabase]);

  const updateUser = useCallback(
    async (attributes: { password?: string; data?: Record<string, unknown> }) => {
      if (!supabase) return { error: new Error("Supabase not configured") };
      const { error } = await supabase.auth.updateUser(attributes);
      if (!error) await refreshUser();
      return { error: error ? new Error(error.message) : null };
    },
    [supabase, refreshUser]
  );

  const verifyPassword = useCallback(
    async (password: string) => {
      if (!supabase || !user?.email)
        return { error: new Error("Not authenticated") };
      const { error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });
      return { error: error ? new Error(error.message) : null };
    },
    [supabase, user?.email]
  );

  const sendPasswordReset = useCallback(async () => {
    if (!supabase || !user?.email)
      return { error: new Error("Not authenticated") };
    const { error } = await supabase.auth.resetPasswordForEmail(user.email);
    return { error: error ? new Error(error.message) : null };
  }, [supabase, user?.email]);

  const signOut = useCallback(async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    queryClient.clear();
    router.push("/login");
  }, [supabase, queryClient, router]);

  return (
    <AuthContext.Provider value={{ user, loading, signOut, updateUser, refreshUser, verifyPassword, sendPasswordReset }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
