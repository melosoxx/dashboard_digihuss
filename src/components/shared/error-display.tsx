import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  message?: string;
}

export function ErrorDisplay({ message = "Error al cargar los datos. Por favor, intenta de nuevo." }: ErrorDisplayProps) {
  return (
    <Card className="border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5 mb-6">
      <CardContent className="flex items-center gap-3 py-4">
        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
        <p className="text-sm text-red-600 dark:text-red-400">{message}</p>
      </CardContent>
    </Card>
  );
}
