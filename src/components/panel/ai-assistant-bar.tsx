"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Sparkles, Send, X, Trash2, Settings, Square } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useAIConfig } from "@/hooks/use-ai-config";
import { useAIChat } from "@/hooks/use-ai-chat";
import type { DashboardContext } from "@/types/ai";
import Link from "next/link";

export interface AIAssistantBarProps {
  dashboardContext?: DashboardContext;
  placeholder?: string;
  activeSection?: string;
}

const sectionSuggestions: Record<string, string[]> = {
  resumen: [
    "¿Cuál fue el mejor día de ventas?",
    "¿Cómo evolucionaron los ingresos?",
    "¿Cuál es el margen de ganancia actual?",
  ],
  campanas: [
    "¿Qué campaña tuvo mejor ROAS?",
    "¿Cómo es el embudo de conversión?",
    "¿Cuál es el costo por resultado promedio?",
  ],
  anuncios: [
    "¿Qué anuncio tiene mejor CTR?",
    "¿Cuál es el gasto total en ads?",
    "¿Qué promoción de IG rindió mejor?",
  ],
  pedidos: [
    "¿Cuál es el ticket promedio?",
    "¿Cuántos pedidos hay pendientes de envío?",
    "¿Cómo evolucionaron los pedidos diarios?",
  ],
  clarity: [
    "¿Cómo es el comportamiento de los usuarios en el sitio?",
    "¿Cuáles son las páginas con más tráfico?",
    "¿Dónde hay más frustración de usuarios?",
  ],
};

function getSuggestions(ctx?: DashboardContext, section?: string): string[] {
  if (section && sectionSuggestions[section]) {
    return sectionSuggestions[section];
  }
  const suggestions: string[] = [];
  if (ctx?.shopify) {
    suggestions.push("¿Cuál fue el mejor día de ventas?");
  }
  if (ctx?.meta) {
    suggestions.push("¿Qué campaña tuvo mejor ROAS?");
  }
  if (ctx?.shopify && ctx?.meta) {
    suggestions.push("¿Cómo evolucionaron los ingresos?");
  }
  if (ctx?.clarity) {
    suggestions.push("¿Cómo es el comportamiento de los usuarios en el sitio?");
  }
  if (ctx?.finance) {
    suggestions.push("¿Cuál es el margen de ganancia actual?");
  }
  if (suggestions.length === 0) {
    suggestions.push(
      "¿Cuál fue el mejor día de ventas?",
      "¿Qué campaña tuvo mejor ROAS?",
      "¿Cómo evolucionaron los ingresos?"
    );
  }
  return suggestions.slice(0, 3);
}

export function AIAssistantBar({
  dashboardContext,
  placeholder = "Preguntale algo a tus datos...",
  activeSection,
}: AIAssistantBarProps) {
  const { isConfigured, isLoading: configLoading } = useAIConfig();
  const { messages, isStreaming, error, sendMessage, clearChat, stopStreaming } = useAIChat();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => getSuggestions(dashboardContext, activeSection), [dashboardContext, activeSection]);

  const hasMessages = messages.length > 0;

  // Auto-scroll when messages change
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || !isConfigured || isStreaming || !dashboardContext) return;
    setIsOpen(true);
    setQuery("");
    sendMessage(trimmed, dashboardContext);
  }

  function handleSuggestion(s: string) {
    if (!isConfigured || !dashboardContext) return;
    setQuery("");
    setIsOpen(true);
    sendMessage(s, dashboardContext);
  }

  function handleClose() {
    setIsOpen(false);
  }

  function handleClear() {
    clearChat();
    setIsOpen(false);
  }

  const disabled = !isConfigured || configLoading;

  return (
    <>
      <style>{`
        @keyframes ai-border-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .ai-glow-wrap {
          position: relative;
          border-radius: 14px;
          padding: 2px;
          background: linear-gradient(90deg, #0ea5e9, #14b8a6, #818cf8, #0ea5e9);
          background-size: 300% 100%;
          animation: ai-border-shift 4s ease infinite;
          box-shadow: 0 0 14px 2px rgba(14,165,233,0.20), 0 0 30px 4px rgba(20,184,166,0.10);
        }
        .ai-glow-wrap-active {
          position: relative;
          border-radius: 14px;
          padding: 2px;
          background: linear-gradient(90deg, #0ea5e9, #14b8a6, #818cf8, #0ea5e9);
          background-size: 300% 100%;
          animation: ai-border-shift 2s ease infinite;
          box-shadow: 0 0 18px 3px rgba(14,165,233,0.30), 0 0 40px 6px rgba(20,184,166,0.15);
        }
      `}</style>

      <div ref={containerRef} className="relative flex flex-col items-center w-full flex-shrink-0 py-0.5 sm:py-1">
        <div className="relative w-full max-w-full sm:max-w-[74%]">

          {/* Label */}
          <div className="hidden sm:flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">Huss</span>
            <span className="text-[10px] text-muted-foreground/70 font-medium">Tu asistente de negocios IA</span>
            {!isConfigured && !configLoading && (
              <Link
                href="/configuracion"
                className="flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 hover:bg-amber-200 dark:hover:bg-amber-500/25 transition-colors"
              >
                <Settings className="h-2.5 w-2.5" />
                Configurar
              </Link>
            )}
          </div>

          {/* Glowing border + input */}
          <div className={isOpen ? "ai-glow-wrap-active" : "ai-glow-wrap"}>
            <form onSubmit={handleSubmit}>
              <div
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5"
                style={{ borderRadius: "12px", background: "var(--ai-bar-bg)" }}
              >
                <Sparkles
                  className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 transition-colors duration-200 ${
                    isOpen ? "text-cyan-600" : "text-cyan-500"
                  }`}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => hasMessages && setIsOpen(true)}
                  placeholder={disabled ? "Configura tu API key en Configuración..." : placeholder}
                  disabled={disabled}
                  className="flex-1 bg-transparent text-sm sm:text-[15px] font-light text-slate-800 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none border-none disabled:opacity-50"
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stopStreaming}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium transition-all border border-red-500/20 flex-shrink-0"
                  >
                    <Square className="h-3 w-3" />
                    Detener
                  </button>
                ) : query.trim() ? (
                  <button
                    type="submit"
                    disabled={disabled}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-sm font-medium transition-all disabled:opacity-50 border border-cyan-500/20 flex-shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar
                  </button>
                ) : (
                  <kbd className="hidden md:inline-flex items-center px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600/50 text-[10px] text-slate-400 font-mono flex-shrink-0">
                    Enter
                  </kbd>
                )}
              </div>
            </form>
          </div>

          {/* Suggestion chips */}
          {!isOpen && !query && isConfigured && (
            <div className="hidden sm:flex relative z-10 items-center justify-center gap-2 mt-2.5 flex-wrap">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-cyan-600 bg-slate-100 dark:bg-white/[0.04] hover:bg-cyan-50 dark:hover:bg-cyan-500/10 border border-slate-200 dark:border-white/10 hover:border-cyan-300 dark:hover:border-cyan-500/30 rounded-full px-3 py-1 transition-all"
                >
                  <Sparkles className="h-2.5 w-2.5 opacity-60" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Chat overlay */}
          {isOpen && (hasMessages || isStreaming || error) && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50">
              <div className="rounded-xl border border-cyan-500/15 bg-card shadow-lg shadow-black/10 dark:shadow-black/40 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-md bg-cyan-500/15 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Huss</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasMessages && (
                      <button
                        onClick={handleClear}
                        className="p-1.5 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                        title="Limpiar chat"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      onClick={handleClose}
                      className="p-1.5 rounded-md text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.role === "user" ? (
                        <div className="max-w-[80%] px-3.5 py-2 rounded-2xl rounded-br-md bg-cyan-500/10 border border-cyan-500/15 text-sm text-foreground">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="max-w-[90%] flex gap-2.5">
                          <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-cyan-500/15 flex items-center justify-center mt-0.5">
                            <Sparkles className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
                          </div>
                          <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5 prose-li:my-0.5">
                            {msg.content ? (
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            ) : isStreaming && i === messages.length - 1 ? (
                              <div className="flex items-center gap-1.5 pt-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-600/60 dark:bg-cyan-400/60 animate-bounce [animation-delay:0ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-600/60 dark:bg-cyan-400/60 animate-bounce [animation-delay:150ms]" />
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-600/60 dark:bg-cyan-400/60 animate-bounce [animation-delay:300ms]" />
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg px-3 py-2">
                      <X className="h-3.5 w-3.5 flex-shrink-0" />
                      {error}
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
