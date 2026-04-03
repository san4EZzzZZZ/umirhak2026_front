import { createContext, useCallback, useContext, useMemo, useState } from "react";

const STORAGE_KEY = "diasoft_auth";

function parseUser(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data?.role || typeof data.login !== "string") return null;
    return { role: data.role, login: data.login.trim() };
  } catch {
    return null;
  }
}

function readStored() {
  try {
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal) {
      const u = parseUser(fromLocal);
      if (u) return u;
    }
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession) {
      const u = parseUser(fromSession);
      if (u) return u;
    }
  } catch {
    /* ignore */
  }
  return null;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStored);

  const signIn = useCallback(({ role, login, persist = true }) => {
    const next = { role, login: String(login).trim() };
    const payload = JSON.stringify(next);
    setUser(next);
    if (persist) {
      localStorage.setItem(STORAGE_KEY, payload);
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, payload);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo(() => ({ user, signIn, signOut }), [user, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth: оберните приложение в AuthProvider");
  return ctx;
}
