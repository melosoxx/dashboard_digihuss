"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface ExploreColumnDef {
  key: string;
  label: string;
  render: (row: Record<string, unknown>) => React.ReactNode;
  sortValue?: (row: Record<string, unknown>) => number | string;
  searchText?: (row: Record<string, unknown>) => string;
  align?: "left" | "right" | "center";
  /** How to compute the column summary. "sum" | "avg" | "none" */
  summary?: "sum" | "avg" | "none";
  summaryFormat?: (value: number) => string;
}

export interface ExploreDataset {
  label: string;
  key: string;
  columns: ExploreColumnDef[];
  data: Record<string, unknown>[];
}

interface ExploreDataTableProps {
  datasets: ExploreDataset[];
  isLoading?: boolean;
}

const PAGE_SIZE = 15;

export function ExploreDataTable({ datasets, isLoading }: ExploreDataTableProps) {
  const [selectedKey, setSelectedKey] = useState(datasets[0]?.key ?? "");
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filterQuery, setFilterQuery] = useState("");
  const [page, setPage] = useState(0);

  const dataset = datasets.find((d) => d.key === selectedKey) ?? datasets[0];

  // Switch dataset — reset sort/filter/page
  function selectDataset(key: string) {
    setSelectedKey(key);
    setSortColumn(null);
    setSortDir("asc");
    setFilterQuery("");
    setPage(0);
  }

  function handleSort(colKey: string) {
    if (sortColumn === colKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(colKey);
      setSortDir("asc");
    }
    setPage(0);
  }

  // Filtered + sorted data
  const processedData = useMemo(() => {
    if (!dataset) return [];

    let rows = dataset.data;

    // Filter
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      rows = rows.filter((row) =>
        dataset.columns.some((col) => {
          const text = col.searchText ? col.searchText(row) : String(row[col.key] ?? "");
          return text.toLowerCase().includes(q);
        })
      );
    }

    // Sort
    if (sortColumn) {
      const col = dataset.columns.find((c) => c.key === sortColumn);
      rows = [...rows].sort((a, b) => {
        const av = col?.sortValue ? col.sortValue(a) : (a[sortColumn] ?? "");
        const bv = col?.sortValue ? col.sortValue(b) : (b[sortColumn] ?? "");
        if (typeof av === "number" && typeof bv === "number") {
          return sortDir === "asc" ? av - bv : bv - av;
        }
        return sortDir === "asc"
          ? String(av).localeCompare(String(bv))
          : String(bv).localeCompare(String(av));
      });
    }

    return rows;
  }, [dataset, filterQuery, sortColumn, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(processedData.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pagedData = processedData.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // Column summaries (computed over all filtered rows, not just current page)
  const summaries = useMemo(() => {
    if (!dataset) return {};
    const result: Record<string, string> = {};
    for (const col of dataset.columns) {
      if (!col.summary || col.summary === "none") continue;
      const numericValues = processedData
        .map((row) => {
          const v = col.sortValue ? col.sortValue(row) : row[col.key];
          return typeof v === "number" ? v : parseFloat(String(v));
        })
        .filter((v) => !isNaN(v));

      if (numericValues.length === 0) continue;

      const sum = numericValues.reduce((a, b) => a + b, 0);
      const value = col.summary === "avg" ? sum / numericValues.length : sum;
      result[col.key] = col.summaryFormat ? col.summaryFormat(value) : value.toFixed(2);
    }
    return result;
  }, [dataset, processedData]);

  const hasSummaries = Object.keys(summaries).length > 0;

  if (isLoading) {
    return (
      <Card className="h-full flex flex-col">
        <CardContent className="flex-1 p-4">
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden">
      <CardContent className="flex-1 flex flex-col min-h-0 p-4">
        {/* Top bar: dataset selector + search */}
        <div className="flex items-center gap-3 mb-3 flex-shrink-0">
          {/* Dataset selector */}
          <div className="flex items-center gap-1 rounded-lg border border-border/40 bg-muted/30 p-0.5">
            {datasets.map((d) => (
              <button
                key={d.key}
                onClick={() => selectDataset(d.key)}
                className={cn(
                  "px-3 py-1 rounded-md text-xs font-medium transition-colors",
                  selectedKey === d.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {d.label}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-2.5 py-1.5 w-[220px]">
            <Search className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => {
                setFilterQuery(e.target.value);
                setPage(0);
              }}
              placeholder="Filtrar..."
              className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
          </div>

          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {processedData.length} filas
          </span>
        </div>

        {/* Summaries */}
        {hasSummaries && (
          <div className="flex items-center gap-4 mb-3 flex-shrink-0 flex-wrap">
            {dataset?.columns
              .filter((c) => summaries[c.key] !== undefined)
              .map((col) => (
                <div key={col.key} className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wider">
                    {col.summary === "avg" ? `Prom. ${col.label}` : `Total ${col.label}`}:
                  </span>
                  <span className="text-[13px] font-semibold text-foreground">
                    {summaries[col.key]}
                  </span>
                </div>
              ))}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-border/30">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm">
              <TableRow className="border-border/30 hover:bg-transparent">
                {dataset?.columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors py-2",
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                    onClick={() => col.sortValue !== undefined || true ? handleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {sortColumn === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : (
                          <ArrowDown className="h-3 w-3" />
                        )
                      ) : (
                        <ArrowUpDown className="h-3 w-3 opacity-30" />
                      )}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={dataset?.columns.length ?? 1}
                    className="text-center text-muted-foreground text-sm py-8"
                  >
                    No hay datos para mostrar
                  </TableCell>
                </TableRow>
              ) : (
                pagedData.map((row, i) => (
                  <TableRow key={i} className="border-border/10 hover:bg-white/[0.03] transition-colors">
                    {dataset?.columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "text-[13px] py-2",
                          col.align === "right" && "text-right",
                          col.align === "center" && "text-center"
                        )}
                      >
                        {col.render(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 flex-shrink-0">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={safePage === 0}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Anterior
            </button>
            <span className="text-xs text-muted-foreground">
              Página {safePage + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage === totalPages - 1}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
