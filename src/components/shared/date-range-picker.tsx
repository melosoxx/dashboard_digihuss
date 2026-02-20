"use client";

import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDateRange } from "@/providers/date-range-provider";
import { datePresets, formatDateForApi } from "@/lib/date-utils";
import { useState } from "react";
import type { DateRange as DayPickerRange } from "react-day-picker";

export function DateRangePicker() {
  const { dateRange, setDateRange } = useDateRange();
  const [open, setOpen] = useState(false);

  const selected: DayPickerRange = {
    from: new Date(dateRange.startDate + "T00:00:00"),
    to: new Date(dateRange.endDate + "T00:00:00"),
  };

  const handleSelect = (range: DayPickerRange | undefined) => {
    if (range?.from && range?.to) {
      setDateRange({
        startDate: formatDateForApi(range.from),
        endDate: formatDateForApi(range.to),
      });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal w-[260px]",
            !dateRange && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(selected.from!, "d MMM")} - {format(selected.to!, "d MMM yyyy")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="border-r p-3 space-y-1">
            {datePresets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => {
                  setDateRange(preset.getValue());
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <Calendar
            mode="range"
            selected={selected}
            onSelect={handleSelect}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
