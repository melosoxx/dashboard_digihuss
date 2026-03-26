import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AIChatMessage, DashboardContext, AIMemoryCategory } from "@/types/ai";

const MEMORY_TAG_REGEX = /\[SAVE_MEMORY\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^\]]+?)\s*\]/g;
const DELETE_MEMORY_TAG_REGEX = /\[DELETE_MEMORY\s*\|\s*([^\]]+?)\s*\]/g;
const VALID_CATEGORIES: AIMemoryCategory[] = ["negocio", "decisiones", "proyecciones", "preferencias", "general"];

interface MemoryAction {
  type: "save" | "delete";
  category?: AIMemoryCategory;
  title: string;
  content?: string;
}

function extractMemoryActions(text: string): {
  cleanText: string;
  actions: MemoryAction[];
} {
  const actions: MemoryAction[] = [];

  let cleaned = text.replace(MEMORY_TAG_REGEX, (_, cat, title, content) => {
    const category = VALID_CATEGORIES.includes(cat.trim() as AIMemoryCategory)
      ? (cat.trim() as AIMemoryCategory)
      : "general";
    actions.push({
      type: "save",
      category,
      title: title.trim(),
      content: content.trim(),
    });
    return "";
  });

  cleaned = cleaned.replace(DELETE_MEMORY_TAG_REGEX, (_, title) => {
    actions.push({
      type: "delete",
      title: title.trim(),
    });
    return "";
  });

  return { cleanText: cleaned.trim(), actions };
}

export interface MemoryEvent {
  type: "saved" | "deleted";
  count: number;
}

/**
 * Enhanced chat hook for Huss assistant page.
 * Supports persisting messages to a conversation and loading history.
 */
export function useHussChat(onMemoryEvent?: (event: MemoryEvent) => void) {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const messagesRef = useRef<AIChatMessage[]>([]);
  messagesRef.current = messages;
  const userMsgCountRef = useRef(0);
  const titleGeneratedRef = useRef(false);
  const onMemoryEventRef = useRef(onMemoryEvent);
  onMemoryEventRef.current = onMemoryEvent;
  const queryClient = useQueryClient();

  const setConversationId = useCallback((id: string | null) => {
    conversationIdRef.current = id;
  }, []);

  const loadMessages = useCallback((msgs: AIChatMessage[]) => {
    setMessages(msgs);
    setError(null);
    userMsgCountRef.current = msgs.filter((m) => m.role === "user").length;
    titleGeneratedRef.current = userMsgCountRef.current >= 2;
  }, []);

  const sendMessage = useCallback(
    async (question: string, context: DashboardContext) => {
      setError(null);

      const userMsg: AIChatMessage = { role: "user", content: question };
      const assistantMsg: AIChatMessage = { role: "assistant", content: "" };

      userMsgCountRef.current += 1;
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const history = messagesRef.current.slice(-10);

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            context,
            history,
            conversationId: conversationIdRef.current,
          }),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Error de conexión" }));
          throw new Error(err.error || `Error ${res.status}`);
        }

        const reader = res.body!.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";
        let rafId: number | null = null;
        let pendingContent = "";

        const flushUpdate = () => {
          const content = pendingContent;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content };
            return updated;
          });
          rafId = null;
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullResponse += chunk;
          pendingContent = fullResponse;
          if (!rafId) {
            rafId = requestAnimationFrame(flushUpdate);
          }
        }

        // Final flush — extract memory actions and clean response
        if (rafId) cancelAnimationFrame(rafId);
        const { cleanText, actions } = extractMemoryActions(fullResponse);
        const displayResponse = cleanText;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: displayResponse };
          return updated;
        });

        // Process memory actions
        const saves = actions.filter((a) => a.type === "save");
        const deletes = actions.filter((a) => a.type === "delete");

        if (saves.length > 0) {
          Promise.all(
            saves.map((mem) =>
              fetch("/api/ai/memories", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  category: mem.category,
                  title: mem.title,
                  content: mem.content,
                }),
              })
            )
          ).then(() => {
            queryClient.invalidateQueries({ queryKey: ["ai-memories"] });
            onMemoryEventRef.current?.({ type: "saved", count: saves.length });
          }).catch(() => {
            // Silent fail
          });
        }

        if (deletes.length > 0) {
          // Fetch current memories to find IDs by title match
          fetch("/api/ai/memories")
            .then((r) => r.json())
            .then((allMemories: { id: string; title: string }[]) => {
              const toDelete = deletes
                .map((d) => allMemories.find((m) =>
                  m.title.toLowerCase().includes(d.title.toLowerCase()) ||
                  d.title.toLowerCase().includes(m.title.toLowerCase())
                ))
                .filter(Boolean) as { id: string }[];

              if (toDelete.length > 0) {
                Promise.all(
                  toDelete.map((m) =>
                    fetch(`/api/ai/memories/${m.id}`, { method: "DELETE" })
                  )
                ).then(() => {
                  queryClient.invalidateQueries({ queryKey: ["ai-memories"] });
                  onMemoryEventRef.current?.({ type: "deleted", count: toDelete.length });
                });
              }
            })
            .catch(() => {
              // Silent fail
            });
        }

        // Persist messages to conversation if we have one
        if (conversationIdRef.current && displayResponse) {
          fetch(`/api/ai/conversations/${conversationIdRef.current}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                { role: "user", content: question },
                { role: "assistant", content: displayResponse },
              ],
            }),
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });

            // Auto-generate title after first message exchange
            if (!titleGeneratedRef.current && conversationIdRef.current) {
              titleGeneratedRef.current = true;
              fetch(`/api/ai/conversations/${conversationIdRef.current}/generate-title`, {
                method: "POST",
              }).then(() => {
                queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });
              }).catch(() => {
                // Silent fail — title generation is non-critical
              });
            }
          }).catch(() => {
            // Silent fail for persistence — chat still works
          });
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const errorMsg = (err as Error).message || "Error de conexión";
        setError(errorMsg);
        setMessages((prev) => {
          const updated = [...prev];
          if (updated.length > 0 && updated[updated.length - 1].content === "") {
            updated.pop();
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [queryClient]
  );

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
    conversationIdRef.current = null;
    userMsgCountRef.current = 0;
    titleGeneratedRef.current = false;
  }, []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    stopStreaming,
    loadMessages,
    setConversationId,
  };
}
