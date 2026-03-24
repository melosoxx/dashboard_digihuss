import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AIChatMessage, DashboardContext } from "@/types/ai";

/**
 * Enhanced chat hook for Huss assistant page.
 * Supports persisting messages to a conversation and loading history.
 */
export function useHussChat() {
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const messagesRef = useRef<AIChatMessage[]>([]);
  messagesRef.current = messages;
  const userMsgCountRef = useRef(0);
  const titleGeneratedRef = useRef(false);
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

        // Final flush
        if (rafId) cancelAnimationFrame(rafId);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullResponse };
          return updated;
        });

        // Persist messages to conversation if we have one
        if (conversationIdRef.current && fullResponse) {
          fetch(`/api/ai/conversations/${conversationIdRef.current}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                { role: "user", content: question },
                { role: "assistant", content: fullResponse },
              ],
            }),
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["ai-conversations"] });

            // Auto-generate title after 2nd user message
            if (userMsgCountRef.current === 2 && !titleGeneratedRef.current && conversationIdRef.current) {
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
