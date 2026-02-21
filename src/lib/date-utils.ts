import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import type { DateRange } from "@/types/dashboard";

export function formatDateForApi(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function getDefaultDateRange(): DateRange {
  const today = new Date();
  return {
    startDate: formatDateForApi(today),
    endDate: formatDateForApi(today),
  };
}

export function getPreviousPeriod(range: DateRange): DateRange {
  const start = new Date(range.startDate);
  const end = new Date(range.endDate);
  const durationMs = end.getTime() - start.getTime();
  const previousEnd = new Date(start.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - durationMs);
  return {
    startDate: formatDateForApi(previousStart),
    endDate: formatDateForApi(previousEnd),
  };
}

export type DatePreset = {
  label: string;
  getValue: () => DateRange;
};

export const datePresets: DatePreset[] = [
  {
    label: "Hoy",
    getValue: () => {
      const today = new Date();
      return {
        startDate: formatDateForApi(today),
        endDate: formatDateForApi(today),
      };
    },
  },
  {
    label: "Hoy y ayer",
    getValue: () => ({
      startDate: formatDateForApi(subDays(new Date(), 1)),
      endDate: formatDateForApi(new Date()),
    }),
  },
  {
    label: "Últimos 3 días",
    getValue: () => ({
      startDate: formatDateForApi(subDays(new Date(), 2)),
      endDate: formatDateForApi(new Date()),
    }),
  },
  {
    label: "Últimos 7 días",
    getValue: () => ({
      startDate: formatDateForApi(subDays(new Date(), 7)),
      endDate: formatDateForApi(new Date()),
    }),
  },
  {
    label: "Últimos 30 días",
    getValue: () => ({
      startDate: formatDateForApi(subDays(new Date(), 30)),
      endDate: formatDateForApi(new Date()),
    }),
  },
  {
    label: "Este mes",
    getValue: () => ({
      startDate: formatDateForApi(startOfMonth(new Date())),
      endDate: formatDateForApi(new Date()),
    }),
  },
  {
    label: "Mes anterior",
    getValue: () => {
      const lastMonth = subMonths(new Date(), 1);
      return {
        startDate: formatDateForApi(startOfMonth(lastMonth)),
        endDate: formatDateForApi(endOfMonth(lastMonth)),
      };
    },
  },
];
