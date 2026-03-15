"use client";

import { useCurrency } from "@/providers/currency-provider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CurrencyToggle() {
  const { currency, setCurrency } = useCurrency();
  const isARS = currency === "ARS";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setCurrency(isARS ? "USD" : "ARS")}
          className="flex items-center gap-1.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-cyan-400 transition-colors hover:border-cyan-500/70 hover:bg-cyan-500/20"
        >
          <span className={isARS ? "font-semibold text-cyan-300" : "text-cyan-500/60"}>ARS</span>
          <span className="text-cyan-500/40">/</span>
          <span className={!isARS ? "font-semibold text-cyan-300" : "text-cyan-500/60"}>USD</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Moneda activa: {currency} — Click para cambiar a {isARS ? "USD" : "ARS"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
