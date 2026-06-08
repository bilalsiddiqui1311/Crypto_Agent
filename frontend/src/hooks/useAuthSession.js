import { useCallback, useEffect, useMemo, useState } from "react";

import { fetchSession } from "../api/auth";
import { clearSession, loadSession, persistSession } from "../utils/storage";

export function useAuthSession() {
  const initialSession = useMemo(() => loadSession(), []);
  const [session, setSession] = useState(initialSession);
  const [booting, setBooting] = useState(Boolean(initialSession?.token));
  const token = session?.token;

  useEffect(() => {
    if (!token) {
      setBooting(false);
      return undefined;
    }

    let active = true;
    fetchSession(token)
      .then((payload) => {
        if (!active) return;
        const nextSession = { token, user: payload.user, profile: payload.profile };
        persistSession(nextSession);
        setSession(nextSession);
      })
      .catch(() => {
        if (!active) return;
        clearSession();
        setSession(null);
      })
      .finally(() => {
        if (active) setBooting(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const acceptSession = useCallback((nextSession) => {
    persistSession(nextSession);
    setSession(nextSession);
  }, []);

  const updateSession = useCallback((nextSession) => {
    persistSession(nextSession);
    setSession(nextSession);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  return {
    session,
    booting,
    token,
    acceptSession,
    updateSession,
    logout
  };
}
