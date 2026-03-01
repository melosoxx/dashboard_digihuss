"use client";

import { PageHeader } from "@/components/shared/page-header";
import { ExcelImporter } from "@/components/admin/excel-importer";

export default function AdminToolsPage() {
  return (
    <div>
      <PageHeader
        title="Admin Tools"
        description="Herramientas de administracion y migracion de datos"
      />
      <div className="space-y-6">
        <ExcelImporter />
      </div>
    </div>
  );
}
