import type { Session, User } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { must, sb } from "./supabase";

type Auth = {
  ready: boolean;
  user: User | null;
  displayName: string | null;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  signOut: () => Promise<void>;
  rename: (name: string) => Promise<void>;
};
export const AuthContext = createContext<Auth | null>(null);
const Ctx = AuthContext;
export const useAuth = () => useContext(Ctx)!;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true); });
    const { data } = sb.auth.onAuthStateChange((_e, s) => { setSession(s); setReady(true); });
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user.id;
  useEffect(() => {
    if (!uid) { setDisplayName(null); return; }
    sb.from("profiles").select("display_name").eq("id", uid).single()
      .then(({ data }) => setDisplayName((data as any)?.display_name ?? null), () => {});
  }, [uid]);

  // Same calls as the website (members/core.js): a 6-digit code by email; a new email makes a new account.
  const sendCode = useCallback(async (email: string) => {
    must(await sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } }));
  }, []);
  const verifyCode = useCallback(async (email: string, code: string) => {
    must(await sb.auth.verifyOtp({ email: email.trim(), token: code.replace(/\D/g, ""), type: "email" }));
  }, []);
  const signOut = useCallback(async () => { await sb.auth.signOut(); }, []);
  const rename = useCallback(async (name: string) => {
    if (!uid) return;
    must(await sb.from("profiles").update({ display_name: name.trim() }).eq("id", uid));
    setDisplayName(name.trim());
  }, [uid]);

  return (
    <Ctx.Provider value={{ ready, user: session?.user ?? null, displayName, sendCode, verifyCode, signOut, rename }}>
      {children}
    </Ctx.Provider>
  );
}
