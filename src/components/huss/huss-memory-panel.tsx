"use client";

import { useState, useEffect, useRef } from "react";
import { Brain, Plus, Pencil, Trash2, Check, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIMemory, AIMemoryCategory } from "@/types/ai";
import { MEMORY_CATEGORY_LABELS } from "@/types/ai";

interface HussMemoryPanelProps {
  memories: AIMemory[];
  isLoading: boolean;
  onCreate: (memory: { title: string; content: string; category: AIMemoryCategory }) => Promise<unknown>;
  onUpdate: (data: { id: string; title?: string; content?: string; category?: AIMemoryCategory }) => Promise<unknown>;
  onDelete: (id: string) => Promise<unknown>;
  highlightIds?: string[];
}

const CATEGORIES: AIMemoryCategory[] = ["negocio", "decisiones", "proyecciones", "preferencias", "general"];

const CATEGORY_COLORS: Record<AIMemoryCategory, string> = {
  negocio: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  decisiones: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  proyecciones: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  preferencias: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  general: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export function HussMemoryPanel({
  memories,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  highlightIds = [],
}: HussMemoryPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", category: "general" as AIMemoryCategory });
  const [expandedCategory, setExpandedCategory] = useState<AIMemoryCategory | null>(null);
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set());
  const prevMemoryIdsRef = useRef<Set<string>>(new Set());

  // Detect new memories and auto-expand their category
  useEffect(() => {
    const currentIds = new Set(memories.map((m) => m.id));
    const prevIds = prevMemoryIdsRef.current;

    if (prevIds.size > 0) {
      const newIds = new Set<string>();
      for (const id of currentIds) {
        if (!prevIds.has(id)) newIds.add(id);
      }

      if (newIds.size > 0) {
        setAnimatingIds(newIds);
        // Auto-expand the category of new memories
        const newMemory = memories.find((m) => newIds.has(m.id));
        if (newMemory) {
          setExpandedCategory(newMemory.category);
        }
        // Clear animation after 2s
        const timer = setTimeout(() => setAnimatingIds(new Set()), 2000);
        return () => clearTimeout(timer);
      }
    }

    prevMemoryIdsRef.current = currentIds;
  }, [memories]);

  // Handle highlight from external (chat-created memories)
  useEffect(() => {
    if (highlightIds.length > 0) {
      setAnimatingIds(new Set(highlightIds));
      const mem = memories.find((m) => highlightIds.includes(m.id));
      if (mem) setExpandedCategory(mem.category);
      const timer = setTimeout(() => setAnimatingIds(new Set()), 2000);
      return () => clearTimeout(timer);
    }
  }, [highlightIds, memories]);

  function resetForm() {
    setForm({ title: "", content: "", category: "general" });
    setShowForm(false);
    setEditingId(null);
  }

  async function handleSave() {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editingId) {
      await onUpdate({ id: editingId, ...form });
    } else {
      await onCreate(form);
    }
    resetForm();
  }

  function startEdit(memory: AIMemory) {
    setEditingId(memory.id);
    setForm({ title: memory.title, content: memory.content, category: memory.category });
    setShowForm(true);
  }

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = memories.filter((m) => m.category === cat);
    return acc;
  }, {} as Record<AIMemoryCategory, AIMemory[]>);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">Memoria</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
            {memories.length}
          </span>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            showForm
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Add/Edit form */}
      {showForm && (
        <div className="p-3 border-b border-border/50 space-y-2">
          <input
            type="text"
            placeholder="Título..."
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background outline-none focus:border-primary/50"
          />
          <textarea
            placeholder="Contenido..."
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            rows={3}
            className="w-full text-xs px-2.5 py-1.5 rounded-md border border-border bg-background outline-none focus:border-primary/50 resize-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as AIMemoryCategory })}
              className="flex-1 text-xs px-2 py-1.5 rounded-md border border-border bg-background outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{MEMORY_CATEGORY_LABELS[cat]}</option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={!form.title.trim() || !form.content.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors disabled:opacity-50 border border-primary/20"
            >
              <Check className="h-3 w-3" />
              {editingId ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      {/* Memory list grouped by category */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <Brain className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground/60">
              Sin memorias todavía.
              <br />
              Agregá información sobre tu negocio para que Huss la recuerde.
            </p>
          </div>
        ) : (
          CATEGORIES.map((cat) => {
            const items = grouped[cat];
            if (items.length === 0) return null;
            const isExpanded = expandedCategory === cat;

            return (
              <div key={cat} className="space-y-0.5">
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : cat)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors"
                >
                  <ChevronDown className={cn("h-3 w-3 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", CATEGORY_COLORS[cat])}>
                    {MEMORY_CATEGORY_LABELS[cat]}
                  </span>
                  <span className="text-[10px] text-muted-foreground/50">{items.length}</span>
                </button>

                {isExpanded && items.map((memory) => (
                  <div
                    key={memory.id}
                    className={cn(
                      "group ml-5 rounded-lg border p-2.5 transition-all duration-500",
                      animatingIds.has(memory.id)
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20 animate-[memory-in_0.4s_ease-out]"
                        : "border-border/50 hover:border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-foreground truncate">{memory.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-3 whitespace-pre-wrap">{memory.content}</p>
                      </div>
                      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => startEdit(memory)}
                          className="p-1 rounded text-muted-foreground/50 hover:text-foreground hover:bg-muted/80 transition-colors"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => onDelete(memory.id)}
                          className="p-1 rounded text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
