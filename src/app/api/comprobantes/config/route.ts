import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";

// GET /api/comprobantes/config?profileId=xxx
export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const profileId = request.nextUrl.searchParams.get("profileId");

    if (!profileId) {
      return NextResponse.json({ error: "profileId is required" }, { status: 400 });
    }

    const { data: config } = await supabase
      .from("email_config")
      .select("*")
      .eq("profile_id", profileId)
      .single();

    return NextResponse.json({
      config: config
        ? {
            id: config.id,
            profileId: config.profile_id,
            enabled: config.enabled,
            gmailAddress: config.gmail_address,
            senderName: config.sender_name,
            subjectTemplate: config.subject_template,
            footerText: config.footer_text,
            downloadUrl: config.download_url ?? "",
          }
        : null,
    });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al cargar configuracion" }, { status: 500 });
  }
}

const configSchema = z.object({
  profileId: z.string().uuid(),
  enabled: z.boolean(),
  gmailAddress: z.string(),
  senderName: z.string(),
  subjectTemplate: z.string(),
  footerText: z.string(),
  downloadUrl: z.string(),
});

// PUT /api/comprobantes/config
export async function PUT(request: NextRequest) {
  try {
    const { supabase } = await requireAuth();
    const body = await request.json();
    const parsed = configSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos invalidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { profileId, enabled, gmailAddress, senderName, subjectTemplate, footerText, downloadUrl } =
      parsed.data;

    const { error: configErr } = await supabase.from("email_config").upsert(
      {
        profile_id: profileId,
        enabled,
        gmail_address: gmailAddress,
        sender_name: senderName,
        subject_template: subjectTemplate,
        footer_text: footerText,
        download_url: downloadUrl,
      },
      { onConflict: "profile_id" }
    );

    if (configErr) {
      return NextResponse.json({ error: configErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Comprobantes config save error:", error);
    return NextResponse.json({ error: "Error al guardar configuracion" }, { status: 500 });
  }
}
