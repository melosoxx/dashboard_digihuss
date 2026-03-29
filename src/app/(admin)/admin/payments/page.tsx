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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  past_due: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
  paused: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
};

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualUserId, setManualUserId] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualCurrency, setManualCurrency] = useState("USD");

  const { data: subscriptions, isLoading } = useQuery({
    queryKey: ["admin", "subscriptions"],
    queryFn: async () => {
      const res = await fetch("/api/admin/subscriptions");
      if (!res.ok) throw new Error("Failed to fetch subscriptions");
      return res.json();
    },
  });

  const createManual = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: manualUserId,
          amount: parseFloat(manualAmount),
          currency: manualCurrency,
        }),
      });
      if (!res.ok) throw new Error("Failed to create subscription");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin"] });
      setDialogOpen(false);
      setManualUserId("");
      setManualAmount("");
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pagos y Suscripciones</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Activar Manual
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Activacion Manual</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>User ID (de auth.users)</Label>
                <Input
                  value={manualUserId}
                  onChange={(e) => setManualUserId(e.target.value)}
                  placeholder="uuid del usuario"
                />
              </div>
              <div className="space-y-2">
                <Label>Monto</Label>
                <Input
                  type="number"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                  placeholder="99.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Input
                  value={manualCurrency}
                  onChange={(e) => setManualCurrency(e.target.value)}
                  placeholder="USD"
                />
              </div>
              <Button
                onClick={() => createManual.mutate()}
                disabled={!manualUserId || !manualAmount || createManual.isPending}
                className="w-full"
              >
                {createManual.isPending ? "Activando..." : "Activar Cuenta"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Suscripciones</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              Cargando suscripciones...
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Periodo Actual</TableHead>
                  <TableHead>Creada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {subscriptions?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No hay suscripciones
                    </TableCell>
                  </TableRow>
                )}
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {subscriptions?.map((sub: any) => (
                  <TableRow key={sub.id}>
                    <TableCell className="font-medium text-sm">
                      {sub.user_profiles?.email ?? "-"}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {sub.provider}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={STATUS_COLORS[sub.status] ?? ""}
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      ${sub.amount} {sub.currency}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {sub.current_period_end
                        ? `hasta ${new Date(sub.current_period_end).toLocaleDateString()}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(sub.created_at).toLocaleDateString()}
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
