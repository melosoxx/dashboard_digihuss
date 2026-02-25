"use client";

import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/auth-provider";
import type { BusinessProfile, ServiceName } from "@/types/business";

const PROFILE_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

interface ProfilesApiResponse {
  profiles: Array<{
    id: string;
    name: string;
    color: string;
    created_at: string;
    updated_at: string;
    configuredServices: string[];
    validationStatus?: {
      [service: string]: {
        status: "untested" | "valid" | "invalid";
        lastValidatedAt?: string;
        lastErrorMessage?: string;
      };
    };
  }>;
  preferences: {
    active_profile_id: string;
    aggregate_mode: boolean;
    selected_profile_ids: string[];
  };
}

interface BusinessProfileContextValue {
  profiles: BusinessProfile[];
  activeProfile: BusinessProfile | null;
  activeProfileId: string;
  aggregateMode: boolean;
  selectedProfileIds: string[];
  isHydrated: boolean;
  isLoading: boolean;
  setActiveProfileId: (id: string) => void;
  setAggregateMode: (enabled: boolean) => void;
  setSelectedProfileIds: (ids: string[]) => void;
  addProfile: (data: { name: string; color?: string }) => Promise<BusinessProfile>;
  updateProfile: (id: string, updates: { name?: string; color?: string }) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  saveCredentials: (profileId: string, service: ServiceName, credentials: Record<string, string>) => Promise<void>;
  deleteCredentials: (profileId: string, service: ServiceName) => Promise<void>;
  refetchProfiles: () => void;
}

const BusinessProfileContext =
  createContext<BusinessProfileContextValue | null>(null);

function mapProfile(raw: ProfilesApiResponse["profiles"][0]): BusinessProfile {
  return {
    id: raw.id,
    name: raw.name,
    color: raw.color,
    configuredServices: raw.configuredServices as ServiceName[],
    validationStatus: raw.validationStatus,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

export function BusinessProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ProfilesApiResponse>({
    queryKey: ["profiles"],
    queryFn: async () => {
      const res = await fetch("/api/profiles");
      if (!res.ok) throw new Error("Failed to fetch profiles");
      return res.json();
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const profiles = (data?.profiles ?? []).map(mapProfile);
  const activeProfileId = data?.preferences.active_profile_id ?? profiles[0]?.id ?? "";
  const aggregateMode = data?.preferences.aggregate_mode ?? false;
  const selectedProfileIds = data?.preferences.selected_profile_ids ?? [];
  const activeProfile = profiles.find((p) => p.id === activeProfileId) ?? null;

  // --- Preference mutations ---

  const updatePreferences = useCallback(
    async (updates: Record<string, unknown>) => {
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
    [queryClient]
  );

  const setActiveProfileId = useCallback(
    (id: string) => {
      // Optimistic update
      queryClient.setQueryData<ProfilesApiResponse>(["profiles"], (old) => {
        if (!old) return old;
        return {
          ...old,
          preferences: { ...old.preferences, active_profile_id: id },
        };
      });
      updatePreferences({ active_profile_id: id });
    },
    [queryClient, updatePreferences]
  );

  const setAggregateMode = useCallback(
    (enabled: boolean) => {
      queryClient.setQueryData<ProfilesApiResponse>(["profiles"], (old) => {
        if (!old) return old;
        return {
          ...old,
          preferences: { ...old.preferences, aggregate_mode: enabled },
        };
      });
      updatePreferences({ aggregate_mode: enabled });
    },
    [queryClient, updatePreferences]
  );

  const setSelectedProfileIds = useCallback(
    (ids: string[]) => {
      queryClient.setQueryData<ProfilesApiResponse>(["profiles"], (old) => {
        if (!old) return old;
        return {
          ...old,
          preferences: { ...old.preferences, selected_profile_ids: ids },
        };
      });
      updatePreferences({ selected_profile_ids: ids });
    },
    [queryClient, updatePreferences]
  );

  // --- Profile CRUD mutations ---

  const addProfileMutation = useMutation({
    mutationFn: async (input: { name: string; color?: string }) => {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: input.name,
          color: input.color ?? PROFILE_COLORS[profiles.length % PROFILE_COLORS.length],
        }),
      });
      if (!res.ok) throw new Error("Failed to create profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  const addProfile = useCallback(
    async (input: { name: string; color?: string }): Promise<BusinessProfile> => {
      const raw = await addProfileMutation.mutateAsync(input);
      return {
        id: raw.id,
        name: raw.name,
        color: raw.color,
        configuredServices: [],
        createdAt: raw.created_at,
        updatedAt: raw.updated_at,
      };
    },
    [addProfileMutation]
  );

  const updateProfileMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: { name?: string; color?: string } }) => {
      const res = await fetch(`/api/profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update profile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  const updateProfile = useCallback(
    async (id: string, updates: { name?: string; color?: string }) => {
      await updateProfileMutation.mutateAsync({ id, updates });
    },
    [updateProfileMutation]
  );

  const deleteProfileMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/profiles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete profile");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
    },
  });

  const deleteProfile = useCallback(
    async (id: string) => {
      await deleteProfileMutation.mutateAsync(id);
    },
    [deleteProfileMutation]
  );

  // --- Credential mutations ---

  const saveCredentialsMutation = useMutation({
    mutationFn: async ({
      profileId,
      service,
      credentials,
    }: {
      profileId: string;
      service: ServiceName;
      credentials: Record<string, string>;
    }) => {
      const res = await fetch(`/api/profiles/${profileId}/credentials`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, credentials }),
      });
      if (!res.ok) throw new Error("Failed to save credentials");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["shopify"] });
      queryClient.invalidateQueries({ queryKey: ["meta"] });
      queryClient.invalidateQueries({ queryKey: ["clarity"] });
    },
  });

  const saveCredentials = useCallback(
    async (profileId: string, service: ServiceName, credentials: Record<string, string>) => {
      await saveCredentialsMutation.mutateAsync({ profileId, service, credentials });
    },
    [saveCredentialsMutation]
  );

  const deleteCredentialsMutation = useMutation({
    mutationFn: async ({ profileId, service }: { profileId: string; service: ServiceName }) => {
      const res = await fetch(`/api/profiles/${profileId}/credentials?service=${service}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete credentials");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["shopify"] });
      queryClient.invalidateQueries({ queryKey: ["meta"] });
      queryClient.invalidateQueries({ queryKey: ["clarity"] });
    },
  });

  const deleteCredentials = useCallback(
    async (profileId: string, service: ServiceName) => {
      await deleteCredentialsMutation.mutateAsync({ profileId, service });
    },
    [deleteCredentialsMutation]
  );

  const refetchProfiles = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["profiles"] });
  }, [queryClient]);

  return (
    <BusinessProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        activeProfileId,
        aggregateMode,
        selectedProfileIds,
        isHydrated: !isLoading,
        isLoading,
        setActiveProfileId,
        setAggregateMode,
        setSelectedProfileIds,
        addProfile,
        updateProfile,
        deleteProfile,
        saveCredentials,
        deleteCredentials,
        refetchProfiles,
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
