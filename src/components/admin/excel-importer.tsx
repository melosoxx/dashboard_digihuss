"use client";

import { useCallback, useState } from "react";
import { ArrowLeft, Upload, Columns3, Eye, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UploadZone } from "./upload-zone";
import {
  ColumnMapper,
  autoDetectMapping,
  FIELD_CONFIGS,
  type ColumnMapping,
} from "./column-mapper";
import { ImportPreview, type ParsedRow } from "./import-preview";
import { ImportResult } from "./import-result";
import { useFinanceCategories } from "@/hooks/use-finance-categories";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useBulkImport } from "@/hooks/use-bulk-import";

type Step = "upload" | "mapping" | "preview" | "result";

const STEPS: { key: Step; label: string; icon: typeof Upload }[] = [
  { key: "upload", label: "Subir archivo", icon: Upload },
  { key: "mapping", label: "Mapear columnas", icon: Columns3 },
  { key: "preview", label: "Revisar datos", icon: Eye },
  { key: "result", label: "Resultado", icon: CheckCircle2 },
];

export function ExcelImporter() {
  const { profiles, activeProfileId } = useBusinessProfile();
  const { categories } = useFinanceCategories();
  const { importExpenses, isImporting } = useBulkImport();

  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    description: null,
    amount: null,
    expenseDate: null,
    categoryName: null,
    notes: null,
    currency: null,
  });
  const [importResult, setImportResult] = useState<{
    inserted: number;
    failed: number;
    errors: Array<{ index: number; error: string }>;
  }>({ inserted: 0, failed: 0, errors: [] });

  const handleFileParsed = useCallback(
    (parsedHeaders: string[], parsedData: string[][]) => {
      setHeaders(parsedHeaders);
      setData(parsedData);
      const detected = autoDetectMapping(parsedHeaders);
      setMapping(detected);
      setStep("mapping");
    },
    []
  );

  const requiredMet = FIELD_CONFIGS.filter((c) => c.required).every(
    (c) => mapping[c.field] !== null
  );

  const handleImport = useCallback(
    async (
      validRows: ParsedRow[],
      defaultCategoryId: string,
      profileId: string
    ) => {
      const expenses = validRows.map((row) => ({
        profileId,
        categoryId: row.resolvedCategoryId ?? defaultCategoryId,
        description: row.description!,
        amount: row.amount!,
        expenseDate: row.expenseDate!,
        notes: row.notes ?? undefined,
      }));

      try {
        const result = await importExpenses(expenses);
        setImportResult({
          inserted: result.inserted,
          failed: result.errors?.length ?? 0,
          errors: result.errors ?? [],
        });
        setStep("result");
      } catch (err) {
        setImportResult({
          inserted: 0,
          failed: expenses.length,
          errors: [
            {
              index: 0,
              error:
                err instanceof Error ? err.message : "Error desconocido",
            },
          ],
        });
        setStep("result");
      }
    },
    [importExpenses]
  );

  const handleReset = () => {
    setStep("upload");
    setHeaders([]);
    setData([]);
    setMapping({
      description: null,
      amount: null,
      expenseDate: null,
      categoryName: null,
      notes: null,
      currency: null,
    });
    setImportResult({ inserted: 0, failed: 0, errors: [] });
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Upload className="h-4 w-4" />
          Importar Gastos desde Excel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-1">
          {STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-1">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  i === stepIndex
                    ? "bg-primary text-primary-foreground"
                    : i < stepIndex
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                <s.icon className="h-3 w-3" />
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{i + 1}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={`h-px w-4 sm:w-8 ${
                    i < stepIndex ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Back button */}
        {step !== "upload" && step !== "result" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setStep(step === "preview" ? "mapping" : "upload")
            }
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Volver
          </Button>
        )}

        {/* Step content */}
        {step === "upload" && (
          <UploadZone onFileParsed={handleFileParsed} />
        )}

        {step === "mapping" && (
          <div className="space-y-4">
            <ColumnMapper
              headers={headers}
              data={data}
              mapping={mapping}
              onMappingChange={setMapping}
            />
            <div className="flex justify-end">
              <Button
                disabled={!requiredMet}
                onClick={() => setStep("preview")}
              >
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <ImportPreview
            data={data}
            mapping={mapping}
            categories={categories}
            profiles={profiles}
            activeProfileId={activeProfileId}
            onImport={handleImport}
            isImporting={isImporting}
          />
        )}

        {step === "result" && (
          <ImportResult
            inserted={importResult.inserted}
            failed={importResult.failed}
            errors={importResult.errors}
            onReset={handleReset}
          />
        )}
      </CardContent>
    </Card>
  );
}
