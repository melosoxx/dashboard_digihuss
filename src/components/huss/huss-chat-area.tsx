"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Square, BotMessageSquare, Settings, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AIChatMessage } from "@/types/ai";

interface HussChatAreaProps {
  messages: AIChatMessage[];
  isStreaming: boolean;
  error: string | null;
  isConfigured: boolean;
  configLoading: boolean;
  onSend: (question: string) => void;
  onStop: () => void;
  hasConversation: boolean;
}

export function HussChatArea({
  messages,
  isStreaming,
  error,
  isConfigured,
  configLoading,
  onSend,
  onStop,
  hasConversation,
}: HussChatAreaProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    if (hasConversation && inputRef.current) {
      inputRef.current.focus();
    }
  }, [hasConversation]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || !isConfigured || isStreaming) return;
    setQuery("");
    onSend(trimmed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }

  const disabled = !isConfigured || configLoading;

  // Empty state — no conversation selected
  if (!hasConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center border border-cyan-500/20">
            <BotMessageSquare className="h-8 w-8 text-cyan-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Hola, soy Huss</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Tu asistente de inteligencia de negocio. Preguntame sobre tus ventas, campañas, métricas o lo que necesites.
            </p>
          </div>

          {!isConfigured && !configLoading && (
            <Link
              href="/configuracion"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 text-sm font-medium hover:bg-amber-200 dark:hover:bg-amber-500/25 transition-colors"
            >
              <Settings className="h-4 w-4" />
              Configurar API key para empezar
            </Link>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full">
            {[
              "¿Cómo fueron las ventas esta semana?",
              "¿Qué campaña tiene mejor ROAS?",
              "¿Cuál es mi margen de ganancia?",
              "Analizá el comportamiento web",
            ].map((s) => (
              <button
                key={s}
                onClick={() => {
                  if (!disabled) onSend(s);
                }}
                disabled={disabled}
                className="flex items-center gap-2 text-left text-xs text-muted-foreground px-3 py-2.5 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 hover:text-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="h-3 w-3 shrink-0 text-primary/50" />
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BotMessageSquare className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground/60">Haceme una pregunta sobre tu negocio</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}
          >
            {msg.role === "user" ? (
              <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-br-md bg-primary/10 border border-primary/15 text-sm text-foreground">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[85%] flex gap-3">
                <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mt-0.5 border border-cyan-500/20">
                  <BotMessageSquare className="h-4 w-4 text-cyan-500" />
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
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-border/50 p-3 sm:p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-3xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={disabled ? "Configurá tu API key en Configuración..." : "Preguntale algo a Huss..."}
              disabled={disabled}
              rows={1}
              className="w-full text-sm px-4 py-3 rounded-xl border border-border bg-background outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 resize-none disabled:opacity-50 transition-colors"
              style={{ minHeight: "44px", maxHeight: "120px" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = Math.min(target.scrollHeight, 120) + "px";
              }}
            />
          </div>
          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="shrink-0 h-11 w-11 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center transition-colors border border-red-500/20"
            >
              <Square className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={disabled || !query.trim()}
              className="shrink-0 h-11 w-11 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary flex items-center justify-center transition-colors disabled:opacity-50 border border-primary/20"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
