import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Profile = {
  id: string;
  tenant_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  onboarded: boolean;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  ready: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const qc = useQueryClient();
  const lastUserIdRef = useRef<string | null>(null);

  const loadProfile = async (uid: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("id, tenant_id, full_name, email, phone, onboarded")
      .eq("id", uid)
      .maybeSingle();
    setProfile(data as Profile | null);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, s) => {
      setSession(s);
      const newUserId = s?.user?.id ?? null;
      const userChanged = newUserId !== lastUserIdRef.current;

      if (userChanged) {
        lastUserIdRef.current = newUserId;
        if (s?.user) {
          setTimeout(() => void loadProfile(s.user.id), 0);
          // Se houver aceite pendente (fluxo OAuth do cadastro), registra agora.
          try {
            const raw = sessionStorage.getItem("agenday.pending_terms_accept");
            if (raw) {
              const { t, p } = JSON.parse(raw) as { t: string; p: string };
              sessionStorage.removeItem("agenday.pending_terms_accept");
              import("@/lib/legal.functions").then(({ recordTermsAcceptance }) => {
                recordTermsAcceptance({ data: { termsVersion: t, privacyVersion: p } }).catch(() => {});
              });
            }
          } catch { /* noop */ }
        } else {
          setProfile(null);
        }
        // Only invalidate queries on real user change (login/logout), not on token refresh
        qc.invalidateQueries();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      lastUserIdRef.current = data.session?.user?.id ?? null;
      if (data.session?.user) void loadProfile(data.session.user.id);
      setLoading(false);
      setReady(true);
    });

    return () => sub.subscription.unsubscribe();
  }, [qc]);

  const value: AuthContextValue = {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    ready,
    signOut: async () => {
      await supabase.auth.signOut();
    },
    refreshProfile: async () => {
      if (session?.user) await loadProfile(session.user.id);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
