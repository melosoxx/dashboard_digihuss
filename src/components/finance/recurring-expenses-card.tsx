"use client";

import { Repeat, Pencil, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCurrency } from "@/providers/currency-provider";
import type { Expense } from "@/types/finance";

interface RecurringExpensesCardProps {
  expenses: Expense[];
  isLoading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function RecurringExpensesCard({
  expenses,
  isLoading,
  onEdit,
  onDelete,
}: RecurringExpensesCardProps) {
  const { formatMoney } = useCurrency();
  const recurring = expenses.filter((e) => e.isRecurring);
  const effectiveAmount = (e: Expense) =>
    e.isGeneral && e.splitAmong && e.splitAmong > 1
      ? e.amount / e.splitAmong
      : e.amount;
  const monthlyTotal = recurring.reduce((sum, e) => sum + effectiveAmount(e), 0);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[80px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (recurring.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Repeat className="h-4 w-4 text-violet-500" />
            Gastos Fijos Mensuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No hay gastos recurrentes configurados. Agrega uno marcando
            &quot;Recurrente&quot; al crear un gasto.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Repeat className="h-4 w-4 text-violet-500" />
            Gastos Fijos Mensuales
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            Total: {formatMoney(monthlyTotal)}/mes
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {recurring.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between py-1.5 group"
            >
              <div className="flex items-center gap-2 min-w-0">
                {expense.categoryColor && (
                  <div
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: expense.categoryColor }}
                  />
                )}
                <span className="text-sm truncate">{expense.description}</span>
                {expense.isGeneral && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 shrink-0">
                    <Users className="h-2.5 w-2.5" />
                    General
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground shrink-0">
                  dia {expense.recurrenceDay}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {expense.isGeneral && expense.splitAmong && expense.splitAmong > 1 ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="cursor-help border-b border-dashed border-muted-foreground/40">
                          {formatMoney(effectiveAmount(expense))}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        Total: {formatMoney(expense.amount)} / {expense.splitAmong} negocios
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    formatMoney(expense.amount)
                  )}
                </span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => onEdit(expense)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive"
                    onClick={() => onDelete(expense.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
