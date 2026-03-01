"use client";

import { Pencil, Trash2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";
import type { Expense } from "@/types/finance";

interface ExpenseTableProps {
  expenses: Expense[];
  isLoading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export function ExpenseTable({
  expenses,
  isLoading,
  onEdit,
  onDelete,
}: ExpenseTableProps) {
  // Only show non-recurring expenses in this table
  const nonRecurring = expenses.filter((e) => !e.isRecurring);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Fecha
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Descripcion
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider">
                Categoria
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right">
                Monto
              </TableHead>
              <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-right w-20">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {nonRecurring.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center text-sm text-muted-foreground py-8"
                >
                  Sin gastos en este periodo. Usa el boton &quot;Agregar
                  Gasto&quot; para registrar uno.
                </TableCell>
              </TableRow>
            ) : (
              nonRecurring.map((expense) => (
                <TableRow
                  key={expense.id}
                  className="hover:bg-white/[0.03]"
                >
                  <TableCell className="text-[13px]">
                    {new Date(expense.expenseDate + "T00:00:00").toLocaleDateString(
                      "es-AR",
                      { day: "2-digit", month: "short" }
                    )}
                  </TableCell>
                  <TableCell className="text-[13px] max-w-[200px]">
                    <div className="flex items-center gap-1.5 truncate">
                      {expense.description}
                      {expense.isGeneral && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1 shrink-0">
                          <Users className="h-2.5 w-2.5" />
                          General
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="text-[11px] gap-1.5"
                    >
                      {expense.categoryColor && (
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{
                            backgroundColor: expense.categoryColor,
                          }}
                        />
                      )}
                      {expense.categoryName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[13px] font-medium text-right">
                    {expense.isGeneral && expense.splitAmong && expense.splitAmong > 1 ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help border-b border-dashed border-muted-foreground/40">
                            {formatCurrency(expense.amount / expense.splitAmong)}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Total: {formatCurrency(expense.amount)} / {expense.splitAmong} negocios
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      formatCurrency(expense.amount)
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => onEdit(expense)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        onClick={() => onDelete(expense.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
