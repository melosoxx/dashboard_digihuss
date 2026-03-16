"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X } from "lucide-react";

export interface AIAssistantBarProps {
  onSubmit?: (query: string) => Promise<string>;
  placeholder?: string;
  disabled?: boolean;
}

const PLACEHOLDER_RESPONSE =
  "El asistente IA estará disponible próximamente. Estamos trabajando en esta funcionalidad.";

const SUGGESTIONS = [
  "¿Cuál fue el mejor día de ventas?",
  "¿Qué campaña tuvo mejor ROAS?",
  "¿Cómo evolucionaron los ingresos?",
];

export function AIAssistantBar({
  onSubmit,
  placeholder = "Preguntale algo a tus datos...",
  disabled = false,
}: AIAssistantBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (!trimmed || disabled) return;
    setIsLoading(true);
    setIsOpen(true);
    setResponse("");
    try {
      if (onSubmit) {
        const result = await onSubmit(trimmed);
        setResponse(result);
      } else {
        await new Promise((r) => setTimeout(r, 700));
        setResponse(PLACEHOLDER_RESPONSE);
      }
    } finally {
      setIsLoading(false);
    }
  }

  function handleClose() {
    setIsOpen(false);
    setQuery("");
    setResponse("");
  }

  function handleSuggestion(s: string) {
    setQuery(s);
    inputRef.current?.focus();
  }

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
          box-shadow: 0 0 18px 2px rgba(14,165,233,0.35), 0 0 40px 4px rgba(20,184,166,0.18);
        }
        .ai-glow-wrap-active {
          position: relative;
          border-radius: 14px;
          padding: 2px;
          background: linear-gradient(90deg, #0ea5e9, #14b8a6, #818cf8, #0ea5e9);
          background-size: 300% 100%;
          animation: ai-border-shift 2s ease infinite;
          box-shadow: 0 0 24px 4px rgba(14,165,233,0.5), 0 0 50px 8px rgba(20,184,166,0.25);
        }
      `}</style>

      <div ref={containerRef} className="relative flex flex-col items-center w-full flex-shrink-0 py-0.5 sm:py-1">
        <div className="relative w-full max-w-full sm:max-w-[74%]">

          {/* Label — hidden on mobile */}
          <div className="hidden sm:flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary tracking-widest uppercase">Asistente IA</span>
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary/70 border border-primary/20">
              Próximamente
            </span>
          </div>

          {/* Glowing border + solid dark inner */}
          <div className={isOpen ? "ai-glow-wrap-active" : "ai-glow-wrap"}>
            <form onSubmit={handleSubmit}>
              <div
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 sm:py-3.5"
                style={{ borderRadius: "12px", background: "hsl(222, 47%, 7%)" }}
              >
                <Sparkles
                  className={`h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 transition-colors duration-200 ${
                    isOpen ? "text-cyan-400" : "text-cyan-500/80"
                  }`}
                />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => response && setIsOpen(true)}
                  placeholder={placeholder}
                  disabled={disabled}
                  className="flex-1 bg-transparent text-sm sm:text-[15px] font-light text-white placeholder:text-slate-400 outline-none border-none disabled:opacity-50"
                />
                {query.trim() ? (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 text-sm font-medium transition-all disabled:opacity-50 border border-cyan-500/30 flex-shrink-0"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar
                  </button>
                ) : (
                  <kbd className="hidden md:inline-flex items-center px-2 py-0.5 rounded border border-slate-600/50 text-[10px] text-slate-500 font-mono flex-shrink-0">
                    Enter
                  </kbd>
                )}
              </div>
            </form>
          </div>

          {/* Suggestion chips — hidden on mobile */}
          {!isOpen && !query && (
            <div className="hidden sm:flex relative z-10 items-center justify-center gap-2 mt-2.5 flex-wrap">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSuggestion(s)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-cyan-400 bg-white/[0.04] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-500/30 rounded-full px-3 py-1 transition-all"
                >
                  <Sparkles className="h-2.5 w-2.5 opacity-60" />
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Response overlay */}
          {isOpen && (response || isLoading) && (
            <div className="absolute top-full left-0 right-0 mt-2 z-50">
              <div className="rounded-xl border border-cyan-500/20 bg-card shadow-xl shadow-black/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1">
                    <div className="flex-shrink-0 h-6 w-6 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
                    </div>
                    {isLoading ? (
                      <div className="flex items-center gap-1.5 pt-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 animate-bounce [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 animate-bounce [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 animate-bounce [animation-delay:300ms]" />
                      </div>
                    ) : (
                      <p className="text-sm text-foreground/90 leading-relaxed pt-0.5">{response}</p>
                    )}
                  </div>
                  <button
                    onClick={handleClose}
                    className="text-muted-foreground/50 hover:text-muted-foreground transition-colors flex-shrink-0"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
