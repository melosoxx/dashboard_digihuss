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
          className="flex items-center gap-1.5 rounded-full border border-slate-200 dark:border-cyan-500/40 bg-slate-100 dark:bg-cyan-500/10 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-cyan-400 transition-colors hover:border-slate-300 hover:bg-slate-200"
        >
          <span className={isARS ? "font-semibold text-cyan-600 dark:text-cyan-300" : "text-slate-400 dark:text-cyan-500/60"}>ARS</span>
          <span className="text-slate-300">/</span>
          <span className={!isARS ? "font-semibold text-cyan-600 dark:text-cyan-300" : "text-slate-400 dark:text-cyan-500/60"}>USD</span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Moneda activa: {currency} — Click para cambiar a {isARS ? "USD" : "ARS"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
