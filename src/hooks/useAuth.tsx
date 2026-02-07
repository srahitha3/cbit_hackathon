import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { testDatabaseAccess } from "./test-database";
type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  user: User | null;
  role: AppRole | null;
  profile: { full_name: string; department: string | null; enrollment_number: string | null } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}
testDatabaseAccess();
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes
const FETCH_TIMEOUT_MS = 10000; // 10 second timeout for database queries

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();

  const fetchUserData = useCallback(async (userId: string) => {
    console.log("🔍 fetchUserData called for userId:", userId);
    
    try {
      // Add timeout protection
      const fetchPromise = Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
        supabase.from("profiles").select("full_name, department, enrollment_number").eq("user_id", userId).maybeSingle(),
      ]);
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Database query timeout")), FETCH_TIMEOUT_MS)
      );
      
      const [roleRes, profileRes] = await Promise.race([fetchPromise, timeoutPromise]) as any;
      
      console.log("📊 Role response:", roleRes);
      console.log("📊 Profile response:", profileRes);
      
      if (roleRes.error) {
        console.error("❌ Error fetching role:", roleRes.error);
        throw new Error(`Role fetch error: ${roleRes.error.message}`);
      }
      if (profileRes.error) {
        console.error("❌ Error fetching profile:", profileRes.error);
        throw new Error(`Profile fetch error: ${profileRes.error.message}`);
      }
      
      setRole(roleRes.data?.role ?? null);
      setProfile(profileRes.data ?? null);
      
      console.log("✅ User data set - Role:", roleRes.data?.role, "Profile:", profileRes.data);
    } catch (error) {
      console.error("❌ Exception in fetchUserData:", error);
      // Set default values on error so user can still proceed
      setRole(null);
      setProfile(null);
      
      // Optionally sign out on critical errors
      // await signOut();
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log("👋 signOut called");
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    setProfile(null);
  }, []);

  // Idle timeout
  useEffect(() => {
    if (!user) return;
    const resetTimer = () => {
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => signOut(), IDLE_TIMEOUT_MS);
    };
    const events = ["mousedown", "keydown", "scroll", "touchstart"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [user, signOut]);

  useEffect(() => {
    console.log("🔧 Setting up auth listener");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔔 Auth state changed:", event, "Session exists:", !!session);
      
      if (session?.user) {
        console.log("✅ User found in session:", session.user.id);
        setUser(session.user);
        await fetchUserData(session.user.id);
      } else {
        console.log("❌ No user in session");
        setUser(null);
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log("🔍 Initial getSession - Session exists:", !!session, "Error:", error);
      
      if (error) {
        console.error("❌ getSession error:", error);
      }
      
      if (session?.user) {
        console.log("✅ Initial session user:", session.user.id);
        setUser(session.user);
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => {
      console.log("🧹 Cleaning up auth listener");
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    console.log("🔐 signIn called with email:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      console.log("📬 signInWithPassword response - Data:", data, "Error:", error);
      
      if (error) {
        console.error("❌ Sign in error:", error);
        return { error: "Invalid credentials. Please try again." };
      }
      
      console.log("✅ Sign in successful");
      return { error: null };
    } catch (exception) {
      console.error("❌ Exception during sign in:", exception);
      return { error: "An unexpected error occurred. Please try again." };
    }
  };

  console.log("🎨 AuthProvider render - User:", !!user, "Role:", role, "Loading:", loading);

  return (
    <AuthContext.Provider value={{ user, role, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}