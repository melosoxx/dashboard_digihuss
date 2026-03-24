"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Brain, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { HussChatSidebar } from "@/components/huss/huss-chat-sidebar";
import { HussChatArea } from "@/components/huss/huss-chat-area";
import { HussMemoryPanel } from "@/components/huss/huss-memory-panel";
import { useAIConversations, useConversationMessages } from "@/hooks/use-ai-conversations";
import { useAIMemories } from "@/hooks/use-ai-memories";
import { useHussChat } from "@/hooks/use-huss-chat";
import { useAIConfig } from "@/hooks/use-ai-config";
import { buildDashboardContext } from "@/lib/ai-context-builder";
import { useShopifyOrders } from "@/hooks/use-shopify-orders";
import { useMetaAccount } from "@/hooks/use-meta-account";
import { useMetaCampaigns } from "@/hooks/use-meta-campaigns";
import { useClarity } from "@/hooks/use-clarity";
import { useBusinessProfile } from "@/providers/business-profile-provider";
import { useDateRange } from "@/providers/date-range-provider";
import type { AIChatMessage } from "@/types/ai";

export default function HussPage() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showMemory, setShowMemory] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const { isConfigured, isLoading: configLoading } = useAIConfig();
  const {
    conversations,
    isLoading: convsLoading,
    createConversation,
    renameConversation,
    deleteConversation,
  } = useAIConversations();
  const { memories, isLoading: memoriesLoading, createMemory, updateMemory, deleteMemory } = useAIMemories();
  const { data: conversationData } = useConversationMessages(activeConversationId);

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    stopStreaming,
    loadMessages,
    setConversationId,
  } = useHussChat();

  // Dashboard context (same data sources as panel)
  const { activeProfile, profiles, aggregateMode, selectedProfileIds } = useBusinessProfile();
  const { dateRange } = useDateRange();
  const shopify = useShopifyOrders();
  const meta = useMetaAccount();
  const campaignsQuery = useMetaCampaigns();
  const clarity = useClarity();

  const activeProfileName = aggregateMode
    ? profiles.filter((p) => selectedProfileIds.includes(p.id)).map((p) => p.name).join(", ") || "Todos"
    : activeProfile?.name || "Mi negocio";

  const dashboardContext = useMemo(() => {
    const campaigns = campaignsQuery.data?.campaigns ?? [];
    return buildDashboardContext({
      dateRange,
      profileName: activeProfileName,
      aggregateMode,
      shopify: shopify.data
        ? {
            totalRevenue: shopify.data.totalRevenue,
            orderCount: shopify.data.orderCount,
            averageOrderValue: shopify.data.averageOrderValue,
            currency: shopify.data.currency,
            dailyRevenue: shopify.data.dailyRevenue,
          }
        : null,
      meta: meta.data
        ? {
            spend: meta.data.spend,
            impressions: meta.data.impressions,
            clicks: meta.data.clicks,
            cpc: meta.data.cpc,
            ctr: meta.data.ctr,
            roas: meta.data.roas,
            conversions: meta.data.conversions,
            purchaseRevenue: meta.data.purchaseRevenue,
            costPerAcquisition: meta.data.costPerAcquisition,
            dailyMetrics: meta.data.dailyMetrics,
          }
        : null,
      campaigns: campaigns.length > 0
        ? campaigns.map((c) => ({
            name: c.campaignName,
            spend: c.spend,
            impressions: c.impressions,
            clicks: c.clicks,
            roas: c.roas,
            conversions: c.conversions,
          }))
        : null,
      clarity: clarity.data
        ? {
            totalSessions: clarity.data.traffic.totalSessions,
            distinctUsers: clarity.data.traffic.distinctUsers,
            pagesPerSession: clarity.data.traffic.pagesPerSession,
            scrollDepth: clarity.data.scrollDepth,
            activeTime: clarity.data.engagement.activeTime,
            deadClicks: clarity.data.frustration.deadClicks,
            rageClicks: clarity.data.frustration.rageClicks,
            quickbacks: clarity.data.frustration.quickbacks,
            topPages: clarity.data.topPages,
            devices: clarity.data.devices,
            countries: clarity.data.countries,
          }
        : null,
    });
  }, [dateRange, activeProfileName, aggregateMode, shopify.data, meta.data, campaignsQuery.data, clarity.data]);

  // Load conversation messages when switching conversations
  useEffect(() => {
    if (conversationData?.messages) {
      const msgs: AIChatMessage[] = conversationData.messages.map((m: { role: "user" | "assistant"; content: string }) => ({
        role: m.role,
        content: m.content,
      }));
      loadMessages(msgs);
      setConversationId(activeConversationId);
    }
  }, [conversationData, activeConversationId, loadMessages, setConversationId]);

  const handleNewConversation = useCallback(async () => {
    try {
      const conv = await createConversation(undefined);
      setActiveConversationId(conv.id);
      setConversationId(conv.id);
      loadMessages([]);
    } catch {
      // Error handled by mutation
    }
  }, [createConversation, setConversationId, loadMessages]);

  const handleSelectConversation = useCallback((id: string) => {
    if (id === activeConversationId) return;
    setActiveConversationId(id);
  }, [activeConversationId]);

  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      if (id === activeConversationId) {
        setActiveConversationId(null);
        clearChat();
      }
    } catch {
      // Error handled by mutation
    }
  }, [deleteConversation, activeConversationId, clearChat]);

  const handleRenameConversation = useCallback(async (id: string, title: string) => {
    try {
      await renameConversation({ id, title });
    } catch {
      // Error handled by mutation
    }
  }, [renameConversation]);

  const handleSend = useCallback(async (question: string) => {
    // Auto-create conversation if none active
    if (!activeConversationId) {
      try {
        const title = question.length > 50 ? question.slice(0, 50) + "..." : question;
        const conv = await createConversation(title);
        setActiveConversationId(conv.id);
        setConversationId(conv.id);
      } catch {
        return;
      }
    }
    sendMessage(question, dashboardContext);
  }, [activeConversationId, createConversation, setConversationId, sendMessage, dashboardContext]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-2 sm:-m-4 lg:-m-6 overflow-hidden">
      {/* Left sidebar — conversations */}
      <div
        className={cn(
          "border-r border-border/50 bg-card/50 transition-all duration-300 shrink-0",
          sidebarOpen ? "w-64" : "w-0 overflow-hidden"
        )}
      >
        <HussChatSidebar
          conversations={conversations}
          activeId={activeConversationId}
          isLoading={convsLoading}
          onSelect={handleSelectConversation}
          onNew={handleNewConversation}
          onRename={handleRenameConversation}
          onDelete={handleDeleteConversation}
        />
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/50 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
            <span className="text-sm font-medium text-foreground">Huss</span>
            {activeConversationId && (
              <span className="text-xs text-muted-foreground/60 truncate max-w-[200px]">
                {conversations.find((c) => c.id === activeConversationId)?.title}
              </span>
            )}
          </div>
          <button
            onClick={() => setShowMemory(!showMemory)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
              showMemory
                ? "bg-primary/10 text-primary border border-primary/20"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Brain className="h-3.5 w-3.5" />
            Memoria
            {memories.length > 0 && (
              <span className="text-[10px] px-1 py-0 rounded-full bg-primary/15 text-primary">
                {memories.length}
              </span>
            )}
          </button>
        </div>

        {/* Chat */}
        <HussChatArea
          messages={messages}
          isStreaming={isStreaming}
          error={error}
          isConfigured={isConfigured}
          configLoading={configLoading}
          onSend={handleSend}
          onStop={stopStreaming}
          hasConversation={!!activeConversationId}
        />
      </div>

      {/* Right sidebar — memory panel */}
      <div
        className={cn(
          "border-l border-border/50 bg-card/50 transition-all duration-300 shrink-0 overflow-hidden",
          showMemory ? "w-72" : "w-0"
        )}
      >
        <HussMemoryPanel
          memories={memories}
          isLoading={memoriesLoading}
          onCreate={createMemory}
          onUpdate={updateMemory}
          onDelete={deleteMemory}
        />
      </div>
    </div>
  );
}
