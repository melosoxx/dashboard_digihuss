"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AuditLogEntry } from "@/types/admin";

export default function AdminAuditPage() {
  const { data, isLoading } = useQuery<{ data: AuditLogEntry[]; total: number }>({
    queryKey: ["admin", "audit"],
    queryFn: async () => {
      const res = await fetch("/api/admin/audit?limit=100");
      if (!res.ok) throw new Error("Failed to fetch audit log");
      return res.json();
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Log</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {data?.total ?? 0} registros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Cargando audit log...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Accion</TableHead>
                  <TableHead>Usuario Objetivo</TableHead>
                  <TableHead>Detalles</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No hay registros en el audit log
                    </TableCell>
                  </TableRow>
                )}
                {data?.data?.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(entry.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {entry.action}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {entry.target_user_id
                        ? `${entry.target_user_id.slice(0, 8)}...`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-64 truncate">
                      {JSON.stringify(entry.details)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
