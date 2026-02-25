"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";

export function CreateFirstProfileFlow() {
  const { addProfile } = useBusinessProfile();
  const router = useRouter();
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    try {
      await addProfile({ name: "Mi Negocio" });
      router.push("/configuracion");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Bienvenido al Dashboard</CardTitle>
          <CardDescription>
            Para comenzar, crea tu primer perfil de negocio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleCreate} disabled={creating} className="w-full">
            {creating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            Crear mi primer perfil
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
