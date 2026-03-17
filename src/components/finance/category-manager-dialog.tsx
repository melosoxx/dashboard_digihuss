"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check, X, Plus } from "lucide-react";
import type { ExpenseCategory } from "@/types/finance";

const CATEGORY_COLORS = [
  "#f43f5e", "#f59e0b", "#10b981", "#3b82f6",
  "#8b5cf6", "#ec4899", "#06b6d4", "#6b7280",
];

interface CategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: ExpenseCategory[];
  onUpdate: (data: { id: string; name?: string; color?: string }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  onCreate: (data: { name: string; type: "fixed" | "variable"; color?: string }) => Promise<unknown>;
}

export function CategoryManagerDialog({
  open,
  onOpenChange,
  categories,
  onUpdate,
  onDelete,
  onCreate,
}: CategoryManagerDialogProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const startEdit = (cat: ExpenseCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color ?? "#6b7280");
    setCreating(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    await onUpdate({ id: editingId, name: editName.trim(), color: editColor });
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    setErrorMsg(null);
    try {
      await onDelete(id);
    } catch {
      setErrorMsg("No se pudo eliminar. Puede que haya gastos usando esta categoria.");
    }
  };

  const startCreate = () => {
    setCreating(true);
    setNewName("");
    setNewColor(CATEGORY_COLORS[0]);
    setEditingId(null);
  };

  const cancelCreate = () => {
    setCreating(false);
  };

  const saveCreate = async () => {
    if (!newName.trim()) return;
    await onCreate({ name: newName.trim(), type: "variable", color: newColor });
    setCreating(false);
    setNewName("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>Gestionar Categorias</DialogTitle>
        </DialogHeader>

        {errorMsg && (
          <p className="text-sm text-destructive px-1">{errorMsg}</p>
        )}

        <div className="space-y-1 max-h-[400px] overflow-y-auto">
          {categories.map((cat) => (
            <div key={cat.id}>
              {editingId === cat.id ? (
                <div className="space-y-2 rounded-md border border-border p-2.5">
                  <div className="flex items-center gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") cancelEdit();
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-emerald-500"
                      onClick={saveEdit}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={cancelEdit}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex gap-1.5">
                    {CATEGORY_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`h-6 w-6 rounded-full transition-all ${
                          editColor === c
                            ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: c }}
                        onClick={() => setEditColor(c)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/[0.03]">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: cat.color ?? "#6b7280" }}
                    />
                    <span className="text-sm truncate">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => startEdit(cat)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {creating ? (
            <div className="space-y-2 rounded-md border border-border p-2.5 mt-2">
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Nombre de la categoria"
                  className="h-8 text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveCreate();
                    if (e.key === "Escape") cancelCreate();
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-emerald-500"
                  onClick={saveCreate}
                >
                  <Check className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={cancelCreate}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="flex gap-1.5">
                {CATEGORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`h-6 w-6 rounded-full transition-all ${
                      newColor === c
                        ? "ring-2 ring-primary ring-offset-1 ring-offset-background"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-muted-foreground mt-1"
              onClick={startCreate}
            >
              <Plus className="mr-2 h-3.5 w-3.5" />
              Agregar categoria
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
