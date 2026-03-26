import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { decrypt } from "@/lib/encryption";
import type { DashboardContext, AIChatMessage } from "@/types/ai";

function buildSystemPrompt(ctx: DashboardContext, memoriesText?: string): string {
  const lines: string[] = [
    `Tu nombre es "Huss". Sos un analista experto en ecommerce y marketing digital, y el asistente personal de inteligencia de negocio de este usuario.`,
    `Tenés personalidad: sos directo, inteligente, y hablás en español argentino con un tono profesional pero cercano. Usás "vos" en vez de "tú".`,
    `Cuando citás números, usá el formato exacto del dashboard. Si no tenés datos suficientes para responder, decilo explícitamente.`,
    ``,
    `=== SISTEMA DE MEMORIA ===`,
    `Tenés la capacidad de guardar información en memoria persistente. Para hacerlo, DEBÉS incluir un tag con este formato EXACTO en tu respuesta:`,
    `[SAVE_MEMORY|categoría|título corto|contenido descriptivo]`,
    `Categorías válidas: negocio, decisiones, proyecciones, preferencias, general`,
    ``,
    `REGLAS OBLIGATORIAS:`,
    `1. Cuando el usuario te pida recordar/guardar/anotar algo, SIEMPRE incluí el tag [SAVE_MEMORY|...|...|...] al final de tu respuesta. Sin el tag, NO se guarda nada.`,
    `2. Podés incluir varios tags si hay múltiple información para guardar.`,
    `3. Confirmale al usuario qué guardaste en lenguaje natural ANTES del tag.`,
    `4. NUNCA digas "anotado" o "guardado en memoria" sin poner el tag — eso sería mentirle al usuario.`,
    ``,
    `Para BORRAR una memoria existente, usá: [DELETE_MEMORY|título de la memoria]`,
    `5. Cuando el usuario pida borrar una memoria, PRIMERO preguntale "¿Estás seguro que querés borrar la memoria 'X'?". Solo incluí el tag [DELETE_MEMORY|...] cuando el usuario CONFIRME.`,
    ``,
    `Ejemplo guardar:`,
    `Usuario: "recordá que prefiero Instagram antes que Meta Ads"`,
    `Respuesta: "Perfecto, guardé tu preferencia por Instagram sobre Meta Ads para futuras recomendaciones.\n\n[SAVE_MEMORY|preferencias|Preferencia Instagram|El usuario prefiere usar promociones de Instagram en lugar de Meta Ads para su estrategia publicitaria]"`,
    ``,
    `Ejemplo borrar:`,
    `Usuario: "borrá la memoria sobre mi proveedor"`,
    `Respuesta: "¿Estás seguro que querés borrar la memoria 'Proveedor principal'? Confirmame y la elimino."`,
    `Usuario: "sí"`,
    `Respuesta: "Listo, borré la memoria sobre tu proveedor.\n\n[DELETE_MEMORY|Proveedor principal]"`,
    `=== FIN SISTEMA DE MEMORIA ===`,
    ``,
    `CONTEXTO DEL DASHBOARD:`,
    `- Período: ${ctx.dateRange.startDate} a ${ctx.dateRange.endDate}`,
    `- Perfil: ${ctx.profileName}${ctx.aggregateMode ? " (modo agregado)" : ""}`,
  ];

  if (ctx.shopify) {
    const s = ctx.shopify;
    lines.push(
      ``,
      `VENTAS (Shopify):`,
      `- Ingresos totales: $${s.totalRevenue.toLocaleString("es-AR")}`,
      `- Pedidos: ${s.orderCount}`,
      `- Ticket promedio: $${s.averageOrderValue.toLocaleString("es-AR")}`,
      `- Moneda: ${s.currency}`
    );
    if (s.dailyRevenue?.length) {
      lines.push(`- Ingresos diarios:`);
      for (const d of s.dailyRevenue.slice(-14)) {
        lines.push(`  ${d.date}: $${d.revenue.toLocaleString("es-AR")} (${d.orders} pedidos)`);
      }
    }
  }

  if (ctx.meta) {
    const m = ctx.meta;
    lines.push(
      ``,
      `PUBLICIDAD (Meta Ads):`,
      `- Gasto: $${m.spend.toLocaleString("es-AR")}`,
      `- Impresiones: ${m.impressions.toLocaleString("es-AR")}`,
      `- Clics: ${m.clicks.toLocaleString("es-AR")}`,
      `- CPC: $${m.cpc.toFixed(2)}`,
      `- CTR: ${m.ctr.toFixed(2)}%`,
      `- ROAS: ${m.roas.toFixed(2)}x`,
      `- Conversiones: ${m.conversions}`,
      `- Revenue atribuido: $${m.purchaseRevenue.toLocaleString("es-AR")}`,
      `- CPA: $${m.costPerAcquisition.toFixed(2)}`
    );
    if (m.dailyMetrics?.length) {
      lines.push(`- Métricas diarias de ads:`);
      for (const d of m.dailyMetrics.slice(-14)) {
        lines.push(`  ${d.date}: gasto=$${d.spend.toFixed(0)} ROAS=${d.roas.toFixed(2)}x conv=${d.conversions}`);
      }
    }
  }

  if (ctx.campaigns?.length) {
    lines.push(``, `CAMPAÑAS:`);
    for (const c of ctx.campaigns) {
      lines.push(`- ${c.name}: gasto=$${c.spend.toFixed(0)} ROAS=${c.roas.toFixed(2)}x clics=${c.clicks} conv=${c.conversions}`);
    }
  }

  if (ctx.clarity) {
    const cl = ctx.clarity;
    lines.push(
      ``,
      `COMPORTAMIENTO WEB (Clarity):`,
      `- Sesiones: ${cl.totalSessions}`,
      `- Usuarios únicos: ${cl.distinctUsers}`,
      `- Páginas/sesión: ${cl.pagesPerSession.toFixed(1)}`,
      `- Profundidad de scroll: ${cl.scrollDepth.toFixed(0)}%`,
      `- Tiempo activo: ${cl.activeTime.toFixed(0)}s`,
      `- Dead clicks: ${cl.deadClicks}`,
      `- Rage clicks: ${cl.rageClicks}`,
      `- Quickbacks: ${cl.quickbacks}`
    );
    if (cl.topPages?.length) {
      lines.push(`- Top páginas: ${cl.topPages.slice(0, 5).map((p) => `${p.url} (${p.visits})`).join(", ")}`);
    }
    if (cl.devices?.length) {
      lines.push(`- Dispositivos: ${cl.devices.map((d) => `${d.name} (${d.sessions})`).join(", ")}`);
    }
    if (cl.countries?.length) {
      lines.push(`- Países: ${cl.countries.slice(0, 5).map((c) => `${c.name} (${c.sessions})`).join(", ")}`);
    }
  }

  if (ctx.finance) {
    const f = ctx.finance;
    lines.push(
      ``,
      `FINANZAS:`,
      `- Ingresos brutos: $${f.grossRevenue.toLocaleString("es-AR")}`,
      `- Ganancia neta: $${f.netProfit.toLocaleString("es-AR")}`,
      `- Margen: ${f.profitMargin.toFixed(1)}%`,
      `- Gasto publicitario: $${f.adSpend.toLocaleString("es-AR")}`,
      `- Gastos totales: $${f.totalExpenses.toLocaleString("es-AR")}`,
      `- Comisiones MP: $${f.mpFees.toLocaleString("es-AR")}`
    );
  }

  // Inject memories if available
  if (memoriesText) {
    lines.push(
      ``,
      `MEMORIA DEL NEGOCIO (información que el usuario guardó para que recuerdes):`,
      memoriesText
    );
  }

  lines.push(
    ``,
    `Instrucciones adicionales:`,
    `- Usá formato markdown para estructurar tus respuestas`,
    `- Cuando analices tendencias, usá los datos diarios si están disponibles`,
    `- Sugerí acciones concretas basadas en los datos`,
    `- Si el ROAS es bajo, explicá por qué y sugerí mejoras`,
    `- Compará métricas cuando sea relevante (ej: CPA vs ticket promedio)`
  );

  return lines.join("\n");
}

function parseOpenAIStream(chunk: string): string {
  let text = "";
  for (const line of chunk.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ") || trimmed === "data: [DONE]") continue;
    try {
      const json = JSON.parse(trimmed.slice(6));
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) text += delta;
    } catch {
      // skip malformed chunks
    }
  }
  return text;
}

function parseAnthropicStream(chunk: string): string {
  let text = "";
  for (const line of chunk.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) continue;
    try {
      const json = JSON.parse(trimmed.slice(6));
      if (json.type === "content_block_delta" && json.delta?.text) {
        text += json.delta.text;
      }
    } catch {
      // skip malformed chunks
    }
  }
  return text;
}

// POST /api/ai/chat — streaming chat with AI provider
export async function POST(request: Request) {
  try {
    const { supabase } = await requireAuth();

    const body = await request.json();
    const question: string = body.question;
    const context: DashboardContext = body.context;
    const history: AIChatMessage[] = body.history || [];

    if (!question || typeof question !== "string" || question.length > 2000) {
      return NextResponse.json({ error: "Pregunta inválida" }, { status: 400 });
    }

    // Get user's AI config
    const { data: config, error: configError } = await supabase
      .from("ai_config")
      .select("provider, model, encrypted_api_key, iv")
      .single();

    if (configError || !config) {
      return NextResponse.json(
        { error: "Configurá a Huss en Configuración" },
        { status: 404 }
      );
    }

    let apiKey: string;
    try {
      apiKey = decrypt(config.encrypted_api_key, config.iv);
    } catch {
      return NextResponse.json(
        { error: "Error al descifrar tu clave API. Reconfigura en Configuración" },
        { status: 500 }
      );
    }

    // Fetch user's memories to inject into system prompt
    let memoriesText: string | undefined;
    const { data: memories } = await supabase
      .from("ai_memories")
      .select("category, title, content")
      .order("category")
      .limit(30);

    if (memories?.length) {
      memoriesText = memories
        .map((m) => `[${m.category.toUpperCase()}] ${m.title}: ${m.content}`)
        .join("\n");
    }

    const systemPrompt = buildSystemPrompt(context, memoriesText);

    // Build message history (last 10 messages for context)
    const rawMessages = history.slice(-10).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
    rawMessages.push({ role: "user" as const, content: question });

    // Sanitize: Anthropic requires alternating user/assistant roles
    // and the first message must be from the user
    const conversationMessages: { role: "user" | "assistant"; content: string }[] = [];
    for (const msg of rawMessages) {
      const last = conversationMessages[conversationMessages.length - 1];
      if (last && last.role === msg.role) {
        // Merge consecutive same-role messages
        last.content += "\n" + msg.content;
      } else {
        conversationMessages.push({ ...msg });
      }
    }
    // Ensure first message is from user
    while (conversationMessages.length > 0 && conversationMessages[0].role !== "user") {
      conversationMessages.shift();
    }

    let providerResponse: Response;

    if (config.provider === "openai") {
      providerResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model || "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationMessages,
          ],
          stream: true,
          max_tokens: 2048,
        }),
      });
    } else {
      providerResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: config.model || "claude-haiku-4-5-20251001",
          system: systemPrompt,
          messages: conversationMessages,
          stream: true,
          max_tokens: 2048,
        }),
      });
    }

    if (!providerResponse.ok) {
      const status = providerResponse.status;
      const errorBody = await providerResponse.json().catch(() => ({}));
      console.error("AI provider error:", status, JSON.stringify(errorBody));

      if (status === 401) {
        return NextResponse.json({ error: "Tu clave API es inválida o fue revocada" }, { status: 401 });
      }
      if (status === 429) {
        return NextResponse.json({ error: "Límite de uso alcanzado. Intenta en unos minutos" }, { status: 429 });
      }
      const providerMsg = errorBody?.error?.message || "Error del proveedor de IA. Intenta nuevamente";
      return NextResponse.json({ error: providerMsg }, { status: 502 });
    }

    const parser = config.provider === "openai" ? parseOpenAIStream : parseAnthropicStream;

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const reader = providerResponse.body!.getReader();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const text = parser(chunk);
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch {
          // stream interrupted
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("AI chat error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
