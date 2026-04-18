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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // restore from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { user: User; accessToken: string };
      setUser(parsed.user);
      setAccessToken(parsed.accessToken);
    } catch {
      /* ignore */
    }
  }, []);

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
