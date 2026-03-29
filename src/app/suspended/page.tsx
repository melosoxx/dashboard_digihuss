"use client";

import { useAuth } from "@/providers/auth-provider";
import { AlertCircle, Mail } from "lucide-react";

export default function SuspendedPage() {
  const { signOut, accountStatus } = useAuth();

  const isCancelled = accountStatus === "cancelled";

  return (
    <div
      className="flex h-screen w-full items-center justify-center"
      style={{ backgroundColor: "#202124" }}
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertCircle className="h-7 w-7 text-red-400" />
        </div>

        <h1 className="mb-2 text-xl font-semibold text-white">
          {isCancelled ? "Cuenta cancelada" : "Cuenta suspendida"}
        </h1>

        <p className="mb-6 text-sm text-white/60">
          {isCancelled
            ? "Tu suscripcion fue cancelada. Si crees que esto es un error o queres reactivar tu cuenta, contactanos."
            : "Tu cuenta esta temporalmente suspendida. Esto puede deberse a un problema con tu metodo de pago. Contactanos para resolverlo."}
        </p>

        <a
          href="mailto:soporte@wwhustle.com"
          className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <Mail className="h-4 w-4" />
          Contactar soporte
        </a>

        <button
          onClick={signOut}
          className="w-full rounded-lg px-4 py-2.5 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
