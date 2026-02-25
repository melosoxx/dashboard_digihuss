"use client";

import { useMetaAccount } from "@/hooks/use-meta-account";
import { useDateRange } from "@/providers/date-range-provider";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function MetaDataInspector() {
  const { dateRange } = useDateRange();
  const meta = useMetaAccount();

  if (meta.isLoading) {
    return (
      <Card className="p-4 bg-slate-900/50 border-slate-800">
        <p className="text-sm text-slate-400">Cargando datos de Meta...</p>
      </Card>
    );
  }

  if (meta.error) {
    return (
      <Card className="p-4 bg-red-900/20 border-red-800">
        <h3 className="font-semibold text-red-400 mb-2">Error en Meta API</h3>
        <p className="text-sm text-slate-300">{String(meta.error)}</p>
      </Card>
    );
  }

  const dailyMetrics = meta.data?.dailyMetrics ?? [];
  const daysWithSpend = dailyMetrics.filter((d) => d.spend > 0).length;
  const daysWithoutSpend = dailyMetrics.filter((d) => d.spend === 0).length;
  const lastDayWithSpend = dailyMetrics
    .filter((d) => d.spend > 0)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <Card className="p-4 bg-slate-900/50 border-slate-800">
      <h3 className="font-semibold text-slate-200 mb-3">
        🔍 Inspector de Datos Meta
      </h3>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Rango consultado:</span>
          <span className="text-slate-200 font-mono">
            {dateRange.startDate} → {dateRange.endDate}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Total de días:</span>
          <span className="text-slate-200">{dailyMetrics.length} días</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Días con gasto:</span>
          <span className="text-emerald-400">{daysWithSpend} días</span>
        </div>

        <div className="flex justify-between">
          <span className="text-slate-400">Días sin gasto:</span>
          <span className="text-orange-400">{daysWithoutSpend} días</span>
        </div>

        {lastDayWithSpend && (
          <div className="flex justify-between pt-2 border-t border-slate-700">
            <span className="text-slate-400">Último día con gasto:</span>
            <span className="text-blue-400 font-mono">
              {lastDayWithSpend.date} ({formatCurrency(lastDayWithSpend.spend)})
            </span>
          </div>
        )}

        <div className="pt-3 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-2">Últimos 7 días:</p>
          <div className="space-y-1">
            {dailyMetrics
              .slice(-7)
              .reverse()
              .map((day) => (
                <div
                  key={day.date}
                  className="flex justify-between text-xs font-mono"
                >
                  <span className="text-slate-400">{day.date}</span>
                  <span
                    className={
                      day.spend > 0 ? "text-emerald-400" : "text-slate-600"
                    }
                  >
                    {day.spend > 0 ? formatCurrency(day.spend) : "Sin gasto"}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {daysWithoutSpend >= 3 && (
          <div className="pt-3 border-t border-slate-700">
            <div className="bg-yellow-900/20 border border-yellow-800/50 rounded p-2">
              <p className="text-xs text-yellow-400">
                ⚠️ <strong>Posibles causas:</strong>
              </p>
              <ul className="text-xs text-slate-300 mt-1 ml-4 space-y-1">
                <li>• Delay de API de Meta (24-48h normal)</li>
                <li>• Campañas pausadas o sin presupuesto</li>
                <li>• Límite de cuenta alcanzado</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
