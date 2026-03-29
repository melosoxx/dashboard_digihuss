"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  scheduled: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20",
  no_show: "bg-red-500/10 text-red-500 border-red-500/20",
  rescheduled: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export default function AdminOnboardingPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["admin", "onboarding", statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      const res = await fetch(`/api/admin/onboarding?${params}`);
      if (!res.ok) throw new Error("Failed to fetch onboarding sessions");
      return res.json();
    },
  });

  const updateSession = useMutation({
    mutationFn: async ({
      sessionId,
      updates,
    }: {
      sessionId: string;
      updates: Record<string, unknown>;
    }) => {
      const res = await fetch(`/api/admin/onboarding/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Failed to update session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Onboarding</h1>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Sesiones de Onboarding</CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="scheduled">Agendados</SelectItem>
                <SelectItem value="completed">Completados</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
                <SelectItem value="rescheduled">Reagendados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Cargando sesiones...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Asignado a</TableHead>
                  <TableHead>Notas</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {sessions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No hay sesiones de onboarding
                    </TableCell>
                  </TableRow>
                )}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {sessions?.map((session: any) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium text-sm">
                      {session.user_profiles?.email ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {session.user_profiles?.full_name ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {new Date(session.scheduled_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[session.status] ?? ""}
                      >
                        {session.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {session.assigned_team_member ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-48 truncate">
                      {session.notes ?? "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {session.status === "scheduled" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateSession.mutate({
                                  sessionId: session.id,
                                  updates: { status: "completed" },
                                })
                              }
                            >
                              Marcar Completado
                            </DropdownMenuItem>
                          )}
                          {session.status === "scheduled" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateSession.mutate({
                                  sessionId: session.id,
                                  updates: { status: "no_show" },
                                })
                              }
                            >
                              Marcar No Show
                            </DropdownMenuItem>
                          )}
                          {session.status !== "rescheduled" && session.status !== "completed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                updateSession.mutate({
                                  sessionId: session.id,
                                  updates: { status: "rescheduled" },
                                })
                              }
                            >
                              Reagendar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
