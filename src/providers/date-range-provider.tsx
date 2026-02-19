"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { getDefaultDateRange } from "@/lib/date-utils";
import type { DateRange } from "@/types/dashboard";

interface DateRangeContextValue {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange);

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}
