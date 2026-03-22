"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileTab } from "./profile-tab";
import { SecurityTab } from "./security-tab";

interface AccountSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
}: AccountSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Mi cuenta</DialogTitle>
          <DialogDescription>
            Gestiona tu perfil y seguridad
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="perfil">
          <TabsList className="w-full">
            <TabsTrigger value="perfil" className="flex-1">
              Perfil
            </TabsTrigger>
            <TabsTrigger value="seguridad" className="flex-1">
              Seguridad
            </TabsTrigger>
          </TabsList>
          <TabsContent value="perfil">
            <ProfileTab />
          </TabsContent>
          <TabsContent value="seguridad">
            <SecurityTab />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
