import type { BusinessProfile, ServiceName } from "@/types/business";

/**
 * Returns profile IDs that have the given service enabled (not in disabledServices).
 * Used by aggregate hooks to skip profiles where the user turned off a service.
 */
export function getEnabledProfileIds(
  profiles: BusinessProfile[],
  service: ServiceName,
  selectedIds: string[]
): string[] {
  return selectedIds.filter((id) => {
    const profile = profiles.find((p) => p.id === id);
    return profile && !profile.disabledServices?.includes(service);
  });
}
