"use client";

import { CalendarIcon, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDateRange } from "@/providers/date-range-provider";
import { datePresets, formatDateForApi } from "@/lib/date-utils";
import { useState, useEffect } from "react";
import type { DateRange as DayPickerRange } from "react-day-picker";
import { useIsMobile } from "@/hooks/use-is-mobile";

export function DateRangePicker() {
  const { dateRange, setDateRange } = useDateRange();
  const [open, setOpen] = useState(false);
  const isMobile = useIsMobile();

  // Pending selection (not yet applied)
  const [pending, setPending] = useState<DayPickerRange | undefined>(undefined);

  // Sync pending with actual dateRange when popover opens
  useEffect(() => {
    if (open) {
      setPending({
        from: new Date(dateRange.startDate + "T00:00:00"),
        to: new Date(dateRange.endDate + "T00:00:00"),
      });
    }
  }, [open, dateRange.startDate, dateRange.endDate]);

  const applied: DayPickerRange = {
    from: new Date(dateRange.startDate + "T00:00:00"),
    to: new Date(dateRange.endDate + "T00:00:00"),
  };

  const canApply =
    pending?.from &&
    pending?.to &&
    (formatDateForApi(pending.from) !== dateRange.startDate ||
      formatDateForApi(pending.to) !== dateRange.endDate);

  const handleApply = () => {
    if (pending?.from && pending?.to) {
      setDateRange({
        startDate: formatDateForApi(pending.from),
        endDate: formatDateForApi(pending.to),
      });
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal w-full sm:w-[260px]",
            !dateRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(applied.from!, "d MMM")} - {format(applied.to!, "d MMM yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0"
        align={isMobile ? "center" : "end"}
      >
        <div className={cn(
          "flex",
          isMobile ? "flex-col max-h-[70vh] overflow-y-auto" : "flex-row"
        )}>
          {/* Presets: fila horizontal scrollable en mobile, sidebar vertical en desktop */}
          <div className={cn(
            isMobile
              ? "flex overflow-x-auto gap-1.5 p-3 border-b scrollbar-none"
              : "border-r p-3 space-y-1"
          )}>
            {datePresets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className={cn(
                  "text-xs",
                  isMobile
                    ? "whitespace-nowrap flex-shrink-0"
                    : "w-full justify-start"
                )}
                onClick={() => {
                  setDateRange(preset.getValue());
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="flex flex-col">
            <Calendar
              mode="range"
              selected={pending}
              onSelect={setPending}
              numberOfMonths={isMobile ? 1 : 2}
              disabled={{ after: new Date() }}
            />
            <div className="border-t px-4 py-2 flex justify-end">
              <Button
                size="sm"
                disabled={!canApply}
                onClick={handleApply}
              >
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
