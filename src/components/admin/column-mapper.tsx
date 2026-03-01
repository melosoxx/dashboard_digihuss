"use client";

import { useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export type ExpenseField =
  | "description"
  | "amount"
  | "expenseDate"
  | "categoryName"
  | "notes"
  | "currency";

export type ColumnMapping = Record<ExpenseField, number | null>;

interface FieldConfig {
  field: ExpenseField;
  label: string;
  required: boolean;
  keywords: string[];
}

const FIELD_CONFIGS: FieldConfig[] = [
  {
    field: "description",
    label: "Descripcion",
    required: true,
    keywords: [
      "descripcion",
      "description",
      "concepto",
      "detalle",
      "item",
      "producto",
      "servicio",
      "nombre",
    ],
  },
  {
    field: "amount",
    label: "Monto",
    required: true,
    keywords: [
      "monto",
      "amount",
      "importe",
      "valor",
      "total",
      "precio",
      "costo",
      "gasto",
    ],
  },
  {
    field: "expenseDate",
    label: "Fecha",
    required: true,
    keywords: [
      "fecha",
      "date",
      "fecha_gasto",
      "fecha gasto",
      "dia",
      "fecha de pago",
    ],
  },
  {
    field: "categoryName",
    label: "Categoria",
    required: false,
    keywords: [
      "categoria",
      "category",
      "tipo",
      "rubro",
      "clasificacion",
      "area",
    ],
  },
  {
    field: "notes",
    label: "Notas",
    required: false,
    keywords: [
      "notas",
      "notes",
      "observaciones",
      "comentarios",
      "detalle",
      "nota",
    ],
  },
  {
    field: "currency",
    label: "Moneda",
    required: false,
    keywords: ["moneda", "currency", "divisa", "coin"],
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

export function autoDetectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {
    description: null,
    amount: null,
    expenseDate: null,
    categoryName: null,
    notes: null,
    currency: null,
  };
  const used = new Set<number>();

  for (const config of FIELD_CONFIGS) {
    for (let i = 0; i < headers.length; i++) {
      if (used.has(i)) continue;
      const normalizedHeader = normalize(headers[i]);
      const matched = config.keywords.some((kw) =>
        normalizedHeader.includes(normalize(kw))
      );
      if (matched) {
        mapping[config.field] = i;
        used.add(i);
        break;
      }
    }
  }

  return mapping;
}

interface ColumnMapperProps {
  headers: string[];
  data: string[][];
  mapping: ColumnMapping;
  onMappingChange: (mapping: ColumnMapping) => void;
}

export function ColumnMapper({
  headers,
  data,
  mapping,
  onMappingChange,
}: ColumnMapperProps) {
  const previewRows = useMemo(() => data.slice(0, 3), [data]);

  const handleChange = (field: ExpenseField, value: string) => {
    onMappingChange({
      ...mapping,
      [field]: value === "__none__" ? null : parseInt(value, 10),
    });
  };

  const requiredMet = FIELD_CONFIGS.filter((c) => c.required).every(
    (c) => mapping[c.field] !== null
  );

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Asigna las columnas de tu archivo a los campos de gasto. Los campos con{" "}
        <Badge variant="destructive" className="text-[10px] px-1 py-0">
          requerido
        </Badge>{" "}
        son obligatorios.
      </p>

      <div className="space-y-3">
        {FIELD_CONFIGS.map((config) => {
          const selectedIndex = mapping[config.field];
          const sampleValues =
            selectedIndex !== null
              ? previewRows
                  .map((row) => String(row[selectedIndex] ?? "").trim())
                  .filter(Boolean)
              : [];

          return (
            <div
              key={config.field}
              className="flex flex-col gap-1.5 rounded-lg border p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{config.label}</span>
                {config.required && (
                  <Badge
                    variant="destructive"
                    className="text-[10px] px-1 py-0"
                  >
                    requerido
                  </Badge>
                )}
              </div>

              <Select
                value={selectedIndex !== null ? String(selectedIndex) : "__none__"}
                onValueChange={(v) => handleChange(config.field, v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar columna..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">-- No asignado --</SelectItem>
                  {headers.map((header, idx) => (
                    <SelectItem key={idx} value={String(idx)}>
                      {header || `Columna ${idx + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {sampleValues.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  <span className="text-[11px] text-muted-foreground">
                    Ejemplo:
                  </span>
                  {sampleValues.map((v, i) => (
                    <span
                      key={i}
                      className="text-[11px] bg-muted px-1.5 py-0.5 rounded font-mono truncate max-w-[200px]"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!requiredMet && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3 text-sm text-amber-700 dark:text-amber-400">
          Asigna todos los campos requeridos para continuar.
        </div>
      )}
    </div>
  );
}

export { FIELD_CONFIGS };
