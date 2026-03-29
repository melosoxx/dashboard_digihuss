"use client";

import { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { CreditCard, Loader2 } from "lucide-react";

export default function PendingPaymentPage() {
  const { signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/payments/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "mercadopago",
          amount: Number(process.env.NEXT_PUBLIC_MP_PRICE_AMOUNT ?? 0),
          currency: process.env.NEXT_PUBLIC_MP_PRICE_CURRENCY ?? "ARS",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear la sesion de pago");
        setLoading(false);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Error de conexion. Intenta de nuevo.");
      setLoading(false);
    }
  }

  return (
    <div
      className="flex h-screen w-full items-center justify-center"
      style={{ backgroundColor: "#202124" }}
    >
      <div className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10">
          <CreditCard className="h-7 w-7 text-blue-400" />
        </div>

        <h1 className="mb-2 text-xl font-semibold text-white">
          Completa tu suscripcion
        </h1>

        <p className="mb-6 text-sm text-white/60">
          Tu cuenta fue creada exitosamente. Para acceder al dashboard,
          completa el pago de tu suscripcion mensual.
        </p>

        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}

        <button
          onClick={handleCheckout}
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#009ee3] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#0087c9] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          Pagar con MercadoPago
        </button>

        <button
          onClick={signOut}
          className="mt-4 w-full rounded-lg px-4 py-2.5 text-sm text-white/50 transition-colors hover:text-white/80"
        >
          Cerrar sesion
        </button>
      </div>
    </div>
  );
}
