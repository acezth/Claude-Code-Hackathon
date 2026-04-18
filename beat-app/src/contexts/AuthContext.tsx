import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setGoogleAccessToken } from "@/services/google";

export interface User {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

interface AuthValue {
  user: User | null;
  accessToken: string | null;
  isAuthed: boolean;
  signIn: (user: User, accessToken: string) => void;
  signOut: () => void;
}

const STORAGE_KEY = "beat.auth";
const AuthContext = createContext<AuthValue | null>(null);

function readStoredAuth(): { user: User | null; accessToken: string | null } {
  if (typeof window === "undefined") {
    return { user: null, accessToken: null };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { user: null, accessToken: null };
  }

  try {
    const parsed = JSON.parse(raw) as { user?: User; accessToken?: string };
    return {
      user: parsed.user ?? null,
      accessToken: parsed.accessToken ?? null,
    };
  } catch {
    return { user: null, accessToken: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredAuth().user);
  const [accessToken, setAccessToken] = useState<string | null>(() => readStoredAuth().accessToken);

  // push token into the google service layer whenever it changes
  useEffect(() => {
    setGoogleAccessToken(accessToken);
  }, [accessToken]);

  const signIn = useCallback((u: User, token: string) => {
    setUser(u);
    setAccessToken(token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, accessToken: token }));
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user, accessToken, isAuthed: Boolean(user), signIn, signOut }),
    [user, accessToken, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
