import { useCallback, useEffect, useState } from "react";

import { saveThemePreference } from "../api/profile";
import { loadSession, loadTheme, persistTheme } from "../utils/storage";

export function useTheme() {
  const [theme, setTheme] = useState(() => loadSession()?.user?.theme || loadTheme() || "light");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    persistTheme(theme);
  }, [theme]);

  const applyTheme = useCallback((nextTheme) => {
    setTheme(nextTheme || "light");
  }, []);

  const toggleTheme = useCallback(
    async ({ token, session, updateSession }) => {
      const nextTheme = theme === "dark" ? "light" : "dark";
      setTheme(nextTheme);

      if (!token || !session) return;
      try {
        const user = await saveThemePreference(token, nextTheme);
        updateSession({ ...session, user });
      } catch {
        // Local theme stays responsive even when preference persistence is delayed.
      }
    },
    [theme]
  );

  return {
    theme,
    setTheme: applyTheme,
    toggleTheme
  };
}
