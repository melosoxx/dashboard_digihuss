"use client";

import { RefreshCw } from "lucide-react";
import { useQueryClient, useIsFetching } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => queryClient.invalidateQueries()}
      disabled={isFetching > 0}
    >
      <RefreshCw className={`h-4 w-4 ${isFetching > 0 ? "animate-spin" : ""}`} />
      <span className="sr-only">Actualizar datos</span>
    </Button>
  );
}
