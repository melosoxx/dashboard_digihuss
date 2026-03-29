"use client";

import { useBusinessProfile } from "@/providers/business-profile-provider";
import { ProfileList } from "@/components/settings/profile-list";
import { ProfileEditor } from "@/components/settings/profile-editor";
import { AIConfigSection } from "@/components/settings/ai-config-section";
import { SubscriptionSection } from "@/components/settings/subscription-section";

import { CreateFirstProfileFlow } from "@/components/onboarding/create-first-profile";
import { Settings } from "lucide-react";

export default function ConfiguracionPage() {
  const { profiles, isHydrated } = useBusinessProfile();

  // Show loading state while hydrating
  if (!isHydrated) {
    return null;
  }

  // Show onboarding for new users with no profiles
  if (profiles.length === 0) {
    return <CreateFirstProfileFlow />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Configuracion
        </h1>
        <p className="text-muted-foreground">
          Gestiona tus perfiles de negocio y claves API
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
        <ProfileList />
        <div className="space-y-6">
          <ProfileEditor />
        </div>
      </div>

      <SubscriptionSection />
      <AIConfigSection />
    </div>
  );
}
