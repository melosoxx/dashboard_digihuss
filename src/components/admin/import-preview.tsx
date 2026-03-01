"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ColumnMapping } from "./column-mapper";
import type { ExpenseCategory } from "@/types/finance";

// --- Parsing utilities ---

export function parseAmount(raw: string): number | null {
  if (typeof raw === "number") return raw > 0 ? raw : null;
  let s = String(raw).trim();
  if (!s) return null;
  // Remove currency symbols and spaces
  s = s.replace(/[$€£\s]/g, "");
  // Detect AR/EU format (1.234,56) vs US format (1,234.56)
  const hasCommaDecimal = /\d\.\d{3},\d{1,2}$/.test(s);
  if (hasCommaDecimal) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    // US format or simple number - remove thousand separators
    s = s.replace(/,/g, "");
  }
  const n = parseFloat(s);
  return isNaN(n) || n <= 0 ? null : n;
}

export function parseDate(raw: string | number): string | null {
  if (typeof raw === "number") {
    // Excel serial date (days since 1899-12-30)
    const epoch = new Date(1899, 11, 30);
    epoch.setDate(epoch.getDate() + raw);
    const y = epoch.getFullYear();
    const m = String(epoch.getMonth() + 1).padStart(2, "0");
    const d = String(epoch.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  const s = String(raw).trim();
  if (!s) return null;

  // Try YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, y, m, d] = isoMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // Try DD/MM/YYYY or D/M/YYYY
  const slashMatch = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (slashMatch) {
    const [, dayOrMonth, monthOrDay, year] = slashMatch;
    const a = parseInt(dayOrMonth);
    const b = parseInt(monthOrDay);
    // If first number > 12, it must be DD/MM/YYYY
    // Otherwise default to DD/MM/YYYY (common in Argentina)
    let day: number, month: number;
    if (a > 12) {
      day = a;
      month = b;
    } else {
      day = a;
      month = b;
      // Default: DD/MM/YYYY
    }
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  // Try parsing with Date constructor as fallback
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }

  return null;
}

// --- Types ---

export interface ParsedRow {
  index: number;
  description: string | null;
  amount: number | null;
  expenseDate: string | null;
  categoryName: string | null;
  notes: string | null;
  currency: string | null;
  errors: string[];
  warnings: string[];
  excluded: boolean;
  resolvedCategoryId: string | null;
}

// --- Component ---

interface ImportPreviewProps {
  data: string[][];
  mapping: ColumnMapping;
  categories: ExpenseCategory[];
  profiles: Array<{ id: string; name: string; color: string }>;
  activeProfileId: string;
  onImport: (
    rows: ParsedRow[],
    defaultCategoryId: string,
    profileId: string
  ) => void;
  isImporting: boolean;
}

export function ImportPreview({
  data,
  mapping,
  categories,
  profiles,
  activeProfileId,
  onImport,
  isImporting,
}: ImportPreviewProps) {
  const [defaultCategoryId, setDefaultCategoryId] = useState<string>(
    categories[0]?.id ?? ""
  );
  const [profileId, setProfileId] = useState<string>(activeProfileId);
  const [excludedRows, setExcludedRows] = useState<Set<number>>(new Set());

  const parsedRows: ParsedRow[] = useMemo(() => {
    return data.map((row, index) => {
      const rawDesc =
        mapping.description !== null
          ? String(row[mapping.description] ?? "").trim()
          : "";
      const rawAmount =
        mapping.amount !== null
          ? String(row[mapping.amount] ?? "").trim()
          : "";
      const rawDate =
        mapping.expenseDate !== null
          ? row[mapping.expenseDate] ?? ""
          : "";
      const rawCategory =
        mapping.categoryName !== null
          ? String(row[mapping.categoryName] ?? "").trim()
          : null;
      const rawNotes =
        mapping.notes !== null
          ? String(row[mapping.notes] ?? "").trim() || null
          : null;
      const rawCurrency =
        mapping.currency !== null
          ? String(row[mapping.currency] ?? "").trim() || null
          : null;

      const description = rawDesc || null;
      const amount = parseAmount(rawAmount);
      const expenseDate = parseDate(rawDate);

      const errors: string[] = [];
      const warnings: string[] = [];

      if (!description) errors.push("Descripcion vacia");
      else if (description.length > 200)
        errors.push("Descripcion muy larga (max 200)");
      if (amount === null) errors.push("Monto invalido");
      if (expenseDate === null) errors.push("Fecha invalida");

      // Resolve category
      let resolvedCategoryId: string | null = null;
      if (rawCategory) {
        const normalizedCat = rawCategory.toLowerCase().trim();
        const match = categories.find(
          (c) => c.name.toLowerCase().trim() === normalizedCat
        );
        if (match) {
          resolvedCategoryId = match.id;
        } else {
          warnings.push(`Categoria "${rawCategory}" no encontrada`);
        }
      }

      return {
        index,
        description,
        amount,
        expenseDate,
        categoryName: rawCategory,
        notes: rawNotes,
        currency: rawCurrency,
        errors,
        warnings,
        excluded: false,
        resolvedCategoryId,
      };
    });
  }, [data, mapping, categories]);

  const rows = parsedRows.map((r) => ({
    ...r,
    excluded: excludedRows.has(r.index),
  }));

  const validRows = rows.filter((r) => r.errors.length === 0 && !r.excluded);
  const errorRows = rows.filter((r) => r.errors.length > 0 && !r.excluded);
  const excludedCount = excludedRows.size;

  const unmatchedCategories = useMemo(() => {
    const names = new Set<string>();
    for (const r of parsedRows) {
      if (r.warnings.some((w) => w.includes("no encontrada")) && r.categoryName) {
        names.add(r.categoryName);
      }
    }
    return Array.from(names);
  }, [parsedRows]);

  const toggleExclude = (index: number) => {
    setExcludedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleImport = () => {
    onImport(validRows, defaultCategoryId, profileId);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Perfil destino
          </label>
          <Select value={profileId} onValueChange={setProfileId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {profiles.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span
                    className="inline-block w-2 h-2 rounded-full mr-2"
                    style={{ backgroundColor: p.color }}
                  />
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">
            Categoria por defecto
          </label>
          <Select value={defaultCategoryId} onValueChange={setDefaultCategoryId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Unmatched categories warning */}
      {unmatchedCategories.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-sm text-amber-700 dark:text-amber-400">
          <p className="font-medium mb-1">Categorias no reconocidas:</p>
          <div className="flex flex-wrap gap-1">
            {unmatchedCategories.map((name) => (
              <Badge key={name} variant="outline" className="text-xs">
                {name}
              </Badge>
            ))}
          </div>
          <p className="text-xs mt-1">
            Estas filas usaran la categoria por defecto seleccionada.
          </p>
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <span>{validRows.length} validas</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="h-4 w-4 text-red-500" />
          <span>{errorRows.length} con errores</span>
        </div>
        {excludedCount > 0 && (
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            <span>{excludedCount} excluidas</span>
          </div>
        )}
      </div>

      {/* Preview table */}
      <div className="rounded-lg border overflow-auto max-h-[400px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead>Descripcion</TableHead>
              <TableHead className="w-24">Monto</TableHead>
              <TableHead className="w-28">Fecha</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-20">Estado</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.index}
                className={
                  row.excluded
                    ? "opacity-40 line-through"
                    : row.errors.length > 0
                      ? "bg-red-50/50 dark:bg-red-950/10"
                      : ""
                }
              >
                <TableCell className="text-xs text-muted-foreground">
                  {row.index + 1}
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">
                  {row.description ?? "-"}
                </TableCell>
                <TableCell className="text-sm font-mono">
                  {row.amount !== null ? `$${row.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {row.expenseDate ?? "-"}
                </TableCell>
                <TableCell className="text-sm">
                  {row.resolvedCategoryId ? (
                    <span className="text-green-600">
                      {row.categoryName}
                    </span>
                  ) : row.categoryName ? (
                    <span className="text-amber-600">{row.categoryName}</span>
                  ) : (
                    <span className="text-muted-foreground text-xs">
                      (default)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {row.errors.length > 0 ? (
                    <div className="flex items-center gap-1" title={row.errors.join(", ")}>
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                      <span className="text-[11px] text-red-600">{row.errors.length}</span>
                    </div>
                  ) : row.warnings.length > 0 ? (
                    <div className="flex items-center gap-1" title={row.warnings.join(", ")}>
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                  )}
                </TableCell>
                <TableCell>
                  <button
                    onClick={() => toggleExclude(row.index)}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline"
                  >
                    {row.excluded ? "Incluir" : "Excluir"}
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Import button */}
      <div className="flex justify-end">
        <Button
          onClick={handleImport}
          disabled={validRows.length === 0 || !defaultCategoryId || isImporting}
        >
          {isImporting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Importando...
            </>
          ) : (
            `Importar ${validRows.length} gasto${validRows.length !== 1 ? "s" : ""}`
          )}
        </Button>
      </div>
    </div>
  );
}
