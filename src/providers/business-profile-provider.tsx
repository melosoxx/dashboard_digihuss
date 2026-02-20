"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  BusinessProfile,
  BusinessProfilesState,
  ServiceCredentials,
} from "@/types/business";

const STORAGE_KEY = "wwh-business-profiles";

const PROFILE_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

interface BusinessProfileContextValue {
  profiles: BusinessProfile[];
  activeProfile: BusinessProfile | null;
  activeProfileId: string | null;
  aggregateMode: boolean;
  selectedProfileIds: string[];
  isHydrated: boolean;
  setActiveProfileId: (id: string | null) => void;
  setAggregateMode: (enabled: boolean) => void;
  setSelectedProfileIds: (ids: string[]) => void;
  addProfile: (
    data: Pick<BusinessProfile, "name"> & Partial<Pick<BusinessProfile, "color" | "credentials">>
  ) => BusinessProfile;
  updateProfile: (id: string, updates: Partial<Omit<BusinessProfile, "id" | "createdAt">>) => void;
  deleteProfile: (id: string) => void;
  getCredentialHeaders: (profileId?: string) => Record<string, string>;
}

const BusinessProfileContext =
  createContext<BusinessProfileContextValue | null>(null);

const defaultState: BusinessProfilesState = {
  profiles: [],
  activeProfileId: null,
  aggregateMode: false,
  selectedProfileIds: [],
};

function loadState(): BusinessProfilesState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return JSON.parse(raw) as BusinessProfilesState;
  } catch {
    return defaultState;
  }
}

function saveState(state: BusinessProfilesState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable
  }
}

function buildHeaders(creds: ServiceCredentials): Record<string, string> {
  const headers: Record<string, string> = {};

  if (creds.shopify) {
    headers["X-Shopify-Domain"] = creds.shopify.storeDomain;
    headers["X-Shopify-Api-Version"] = creds.shopify.adminApiVersion;
    headers["X-Shopify-Token"] = creds.shopify.adminAccessToken;
  }

  if (creds.meta) {
    headers["X-Meta-Account-Id"] = creds.meta.adAccountId;
    headers["X-Meta-Token"] = creds.meta.accessToken;
    headers["X-Meta-Api-Version"] = creds.meta.apiVersion;
  }

  if (creds.clarity) {
    headers["X-Clarity-Project-Id"] = creds.clarity.projectId;
    headers["X-Clarity-Token"] = creds.clarity.apiToken;
  }

  return headers;
}

export function BusinessProfileProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BusinessProfilesState>(defaultState);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setState(loadState());
    setIsHydrated(true);
  }, []);

  // Persist to localStorage on state changes (after hydration)
  useEffect(() => {
    if (isHydrated) {
      saveState(state);
    }
  }, [state, isHydrated]);

  const activeProfile =
    state.profiles.find((p) => p.id === state.activeProfileId) ?? null;

  const setActiveProfileId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, activeProfileId: id }));
  }, []);

  const setAggregateMode = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, aggregateMode: enabled }));
  }, []);

  const setSelectedProfileIds = useCallback((ids: string[]) => {
    setState((prev) => ({ ...prev, selectedProfileIds: ids }));
  }, []);

  const addProfile = useCallback(
    (
      data: Pick<BusinessProfile, "name"> &
        Partial<Pick<BusinessProfile, "color" | "credentials">>
    ): BusinessProfile => {
      const now = new Date().toISOString();
      const profile: BusinessProfile = {
        id: crypto.randomUUID(),
        name: data.name,
        color:
          data.color ??
          PROFILE_COLORS[state.profiles.length % PROFILE_COLORS.length],
        credentials: data.credentials ?? {},
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({
        ...prev,
        profiles: [...prev.profiles, profile],
        activeProfileId: profile.id,
      }));
      return profile;
    },
    [state.profiles.length]
  );

  const updateProfile = useCallback(
    (id: string, updates: Partial<Omit<BusinessProfile, "id" | "createdAt">>) => {
      setState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === id
            ? { ...p, ...updates, updatedAt: new Date().toISOString() }
            : p
        ),
      }));
    },
    []
  );

  const deleteProfile = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      profiles: prev.profiles.filter((p) => p.id !== id),
      activeProfileId:
        prev.activeProfileId === id ? null : prev.activeProfileId,
      selectedProfileIds: prev.selectedProfileIds.filter((pid) => pid !== id),
    }));
  }, []);

  const getCredentialHeaders = useCallback(
    (profileId?: string): Record<string, string> => {
      const targetId = profileId ?? state.activeProfileId;
      if (!targetId) return {};
      const profile = state.profiles.find((p) => p.id === targetId);
      if (!profile) return {};
      return buildHeaders(profile.credentials);
    },
    [state.activeProfileId, state.profiles]
  );

  return (
    <BusinessProfileContext.Provider
      value={{
        profiles: state.profiles,
        activeProfile,
        activeProfileId: state.activeProfileId,
        aggregateMode: state.aggregateMode,
        selectedProfileIds: state.selectedProfileIds,
        isHydrated,
        setActiveProfileId,
        setAggregateMode,
        setSelectedProfileIds,
        addProfile,
        updateProfile,
        deleteProfile,
        getCredentialHeaders,
      }}
    >
      {children}
    </BusinessProfileContext.Provider>
  );
}

export function useBusinessProfile() {
  const context = useContext(BusinessProfileContext);
  if (!context) {
    throw new Error(
      "useBusinessProfile must be used within a BusinessProfileProvider"
    );
  }
  return context;
}
