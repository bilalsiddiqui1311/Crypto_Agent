import { useCallback, useState } from "react";

import { updateInvestmentProfile } from "../api/profile";
import { DEFAULT_PROFILE, NUMERIC_PROFILE_FIELDS } from "../constants/profile";
import { loadSession } from "../utils/storage";

export function useInvestmentProfile({ onError }) {
  const savedProfile = loadSession()?.profile;
  const [currency, setCurrency] = useState(() => savedProfile?.currency || "usd");
  const [selectedId, setSelectedId] = useState(() => savedProfile?.holding_coin || "bitcoin");
  const [profile, setProfile] = useState(() => ({ ...DEFAULT_PROFILE, ...(savedProfile || {}) }));
  const [profileStatus, setProfileStatus] = useState("");

  const hydrateProfile = useCallback((nextProfile) => {
    const merged = { ...DEFAULT_PROFILE, ...(nextProfile || {}) };
    setProfile(merged);
    setCurrency(merged.currency || "usd");
    setSelectedId(merged.holding_coin || "bitcoin");
  }, []);

  const resetProfile = useCallback(() => {
    setProfile({ ...DEFAULT_PROFILE });
    setCurrency("usd");
    setSelectedId("bitcoin");
    setProfileStatus("");
  }, []);

  const updateProfile = useCallback((field, value) => {
    setProfileStatus("");
    setProfile((current) => ({
      ...current,
      currency,
      [field]: NUMERIC_PROFILE_FIELDS.includes(field) ? Number(value || 0) : value
    }));
  }, [currency]);

  const changeCurrency = useCallback((nextCurrency) => {
    setCurrency(nextCurrency);
    setProfile((current) => ({ ...current, currency: nextCurrency }));
  }, []);

  const saveProfile = useCallback(
    async ({ token, session, updateSession }) => {
      if (!token || !session) return;

      try {
        const saved = await updateInvestmentProfile(token, { ...profile, currency });
        const nextSession = { ...session, profile: saved };
        updateSession(nextSession);
        hydrateProfile(saved);
        setProfileStatus("Saved to database");
        window.setTimeout(() => setProfileStatus(""), 1600);
      } catch (requestError) {
        onError(`Could not save profile: ${requestError.message}`);
      }
    },
    [currency, hydrateProfile, onError, profile]
  );

  return {
    profile,
    setProfile,
    currency,
    selectedId,
    setSelectedId,
    profileStatus,
    hydrateProfile,
    resetProfile,
    updateProfile,
    changeCurrency,
    saveProfile
  };
}
