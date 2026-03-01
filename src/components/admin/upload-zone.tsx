"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";

interface UploadZoneProps {
  onFileParsed: (headers: string[], data: string[][]) => void;
}

export function UploadZone({ onFileParsed }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const ACCEPTED_TYPES = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];
  const ACCEPTED_EXTENSIONS = [".xlsx", ".xls", ".csv"];

  const isValidFile = (f: File) => {
    const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
    return ACCEPTED_TYPES.includes(f.type) || ACCEPTED_EXTENSIONS.includes(ext);
  };

  const parseFile = useCallback(
    async (f: File) => {
      setParsing(true);
      setError(null);
      try {
        const buffer = await f.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          setError("El archivo no contiene hojas de datos.");
          return;
        }
        const sheet = workbook.Sheets[sheetName];
        const raw: string[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: "",
          rawNumbers: false,
        });

        if (raw.length < 2) {
          setError(
            "El archivo debe tener al menos una fila de encabezados y una fila de datos."
          );
          return;
        }

        const headers = raw[0].map((h) => String(h).trim());
        const data = raw.slice(1).filter((row) => row.some((cell) => String(cell).trim() !== ""));

        if (data.length === 0) {
          setError("El archivo no contiene filas de datos (solo encabezados).");
          return;
        }

        setFile(f);
        onFileParsed(headers, data);
      } catch {
        setError("No se pudo leer el archivo. Verifica que sea un Excel valido.");
      } finally {
        setParsing(false);
      }
    },
    [onFileParsed]
  );

  const handleFile = useCallback(
    (f: File) => {
      if (!isValidFile(f)) {
        setError("Formato no soportado. Usa archivos .xlsx, .xls o .csv");
        return;
      }
      if (f.size > 10 * 1024 * 1024) {
        setError("El archivo es demasiado grande (max 10MB).");
        return;
      }
      parseFile(f);
    },
    [parseFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    },
    [handleFile]
  );

  const handleRemove = () => {
    setFile(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10
          cursor-pointer transition-colors duration-200
          ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50"
          }
        `}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium">
            Arrastra tu archivo aqui o{" "}
            <span className="text-primary underline">selecciona uno</span>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Formatos soportados: .xlsx, .xls, .csv (max 10MB)
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleInputChange}
          className="hidden"
        />
      </div>

      {/* Parsing indicator */}
      {parsing && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          Leyendo archivo...
        </div>
      )}

      {/* File info */}
      {file && !parsing && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <FileSpreadsheet className="h-5 w-5 text-green-600" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRemove} className="h-7 w-7">
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}
