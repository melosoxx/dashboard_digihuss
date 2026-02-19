import { AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ErrorDisplayProps {
  message?: string;
}

export function ErrorDisplay({ message = "Failed to load data. Please try again." }: ErrorDisplayProps) {
  return (
    <Card className="border-destructive/50">
      <CardContent className="flex items-center gap-3 py-4">
        <AlertCircle className="h-5 w-5 text-destructive" />
        <p className="text-sm text-destructive">{message}</p>
      </CardContent>
    </Card>
  );
}
