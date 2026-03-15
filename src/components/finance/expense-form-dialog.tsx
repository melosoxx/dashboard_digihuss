"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Save, Settings2, Users } from "lucide-react";
import { CategoryManagerDialog } from "./category-manager-dialog";
import { useCurrency } from "@/providers/currency-provider";
import type { Expense, ExpenseCategory } from "@/types/finance";
import type { BusinessProfile } from "@/types/business";

interface ExpenseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  profiles: BusinessProfile[];
  defaultProfileId: string;
  editingExpense: Expense | null;
  onSubmit: (data: {
    profileId: string;
    categoryId: string;
    description: string;
    amount: number;
    expenseDate: string;
    isRecurring: boolean;
    recurrenceDay?: number;
    isGeneral?: boolean;
    notes?: string;
  }) => Promise<void>;
  isSubmitting: boolean;
  onCreateCategory: (data: { name: string; type: "fixed" | "variable"; color?: string }) => Promise<unknown>;
  onUpdateCategory: (data: { id: string; name?: string; color?: string }) => Promise<unknown>;
  onDeleteCategory: (id: string) => Promise<unknown>;
}

export function ExpenseFormDialog({
  open,
  onOpenChange,
  categories,
  profiles,
  defaultProfileId,
  editingExpense,
  onSubmit,
  isSubmitting,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
}: ExpenseFormDialogProps) {
  const { formatMoney } = useCurrency();
  const [managerOpen, setManagerOpen] = useState(false);

  const GENERAL_VALUE = "__general__";

  // Only show active profiles, but include the editing expense's profile even if inactive
  const editingProfileId = editingExpense?.profileId;
  const availableProfiles = profiles.filter(
    (p) => p.isActive || p.id === editingProfileId
  );
  const activeCount = profiles.filter((p) => p.isActive).length;

  const [profileId, setProfileId] = useState(defaultProfileId);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDay, setRecurrenceDay] = useState("1");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (editingExpense) {
      setProfileId(editingExpense.isGeneral ? GENERAL_VALUE : editingExpense.profileId);
      setCategoryId(editingExpense.categoryId);
      setDescription(editingExpense.description);
      setAmount(String(editingExpense.amount));
      setExpenseDate(editingExpense.expenseDate);
      setIsRecurring(editingExpense.isRecurring);
      setRecurrenceDay(String(editingExpense.recurrenceDay ?? 1));
      setNotes(editingExpense.notes ?? "");
    } else {
      setProfileId(defaultProfileId);
      setCategoryId(categories[0]?.id ?? "");
      setDescription("");
      setAmount("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setIsRecurring(false);
      setRecurrenceDay("1");
      setNotes("");
    }
  }, [editingExpense, open, categories, defaultProfileId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!categoryId || !description || isNaN(amountNum) || amountNum <= 0) return;

    const isGeneral = profileId === GENERAL_VALUE;

    await onSubmit({
      profileId: isGeneral ? defaultProfileId : profileId,
      categoryId,
      description,
      amount: amountNum,
      expenseDate,
      isRecurring,
      recurrenceDay: isRecurring ? parseInt(recurrenceDay) : undefined,
      isGeneral: isGeneral || undefined,
      notes: notes || undefined,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {editingExpense ? "Editar Gasto" : "Agregar Gasto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {availableProfiles.length > 1 && (
            <div className="space-y-2">
              <Label>Negocio</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un negocio" />
                </SelectTrigger>
                <SelectContent>
                  {activeCount >= 2 && (
                    <SelectItem value={GENERAL_VALUE}>
                      <div className="flex items-center gap-2">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        Todos los negocios
                      </div>
                    </SelectItem>
                  )}
                  {availableProfiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: p.color }}
                        />
                        {p.name}
                        {!p.isActive && <span className="text-xs text-muted-foreground">(Inactivo)</span>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {profileId === GENERAL_VALUE && (
                <p className="text-xs text-muted-foreground">
                  Se dividira entre {activeCount} negocios activos
                  {amount && parseFloat(amount) > 0 && (
                    <> ({formatMoney(parseFloat(amount) / activeCount)} c/u)</>
                  )}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Categoria</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={() => setManagerOpen(true)}
              >
                <Settings2 className="mr-1 h-3 w-3" />
                Gestionar
              </Button>
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    <div className="flex items-center gap-2">
                      {cat.color && (
                        <div
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                      )}
                      {cat.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descripcion</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Shopify Basic Plan"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Monto ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm">Gasto recurrente (mensual)</span>
            </label>
            {isRecurring && (
              <div className="flex items-center gap-1.5">
                <Label className="text-xs whitespace-nowrap">Dia del mes:</Label>
                <Input
                  type="number"
                  min="1"
                  max="28"
                  value={recurrenceDay}
                  onChange={(e) => setRecurrenceDay(e.target.value)}
                  className="w-16 h-8"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Notas (opcional)</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas adicionales..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {editingExpense ? "Guardar" : "Agregar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <CategoryManagerDialog
        open={managerOpen}
        onOpenChange={setManagerOpen}
        categories={categories}
        onUpdate={onUpdateCategory}
        onDelete={onDeleteCategory}
        onCreate={onCreateCategory}
      />
    </Dialog>
  );
}
