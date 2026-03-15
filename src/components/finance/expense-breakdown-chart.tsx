"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrency } from "@/providers/currency-provider";

interface CategoryBreakdown {
  categoryName: string;
  categoryColor: string;
  total: number;
  percentage: number;
}

interface ExpenseBreakdownChartProps {
  data: CategoryBreakdown[];
  isLoading: boolean;
}

const TOOLTIP_STYLE = {
  backgroundColor: "rgba(15, 20, 35, 0.95)",
  border: "1px solid rgba(100, 120, 180, 0.2)",
  borderRadius: "10px",
  backdropFilter: "blur(8px)",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
};

export function ExpenseBreakdownChart({
  data,
  isLoading,
}: ExpenseBreakdownChartProps) {
  const { formatMoney } = useCurrency();

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 py-3">
          <Skeleton className="h-5 w-44" />
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader className="flex-shrink-0 py-3">
          <CardTitle className="text-sm font-semibold">
            Desglose de Egresos
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Sin egresos en este periodo
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex-shrink-0 py-3">
        <CardTitle className="text-sm font-semibold">
          Desglose de Egresos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 flex flex-col pb-3">
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="total"
                nameKey="categoryName"
                cx="50%"
                cy="50%"
                innerRadius="35%"
                outerRadius="65%"
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell key={index} fill={entry.categoryColor} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                contentStyle={TOOLTIP_STYLE}
                itemStyle={{ color: "rgba(220, 230, 255, 0.9)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div className="space-y-1.5 mt-2 flex-shrink-0">
          {data.map((entry) => (
            <div
              key={entry.categoryName}
              className="flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.categoryColor }}
                />
                <span className="text-muted-foreground">
                  {entry.categoryName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {formatMoney(entry.total)}
                </span>
                <span className="text-muted-foreground w-10 text-right">
                  {entry.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
