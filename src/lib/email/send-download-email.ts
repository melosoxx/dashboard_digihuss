import "server-only";
import nodemailer from "nodemailer";
import { createAdminClient } from "@/lib/supabase/admin";
import { getDecryptedCredentials } from "@/lib/credentials";
import { renderDownloadEmail } from "./templates/download-template";

interface SendResult {
  success: boolean;
  error?: string;
}

export async function sendDownloadEmail(
  profileId: string,
  customerEmail: string,
  customerName: string,
  orderName: string
): Promise<SendResult> {
  const supabase = createAdminClient();

  // 1. Load email config
  const { data: config, error: configErr } = await supabase
    .from("email_config")
    .select("*")
    .eq("profile_id", profileId)
    .single();

  if (configErr || !config || !config.enabled) {
    return { success: false, error: "Comprobantes no configurados para este perfil" };
  }

  if (!config.download_url) {
    return { success: false, error: "No hay link de descarga configurado. Configuralo en Settings > Comprobantes." };
  }

  // 2. Load Gmail SMTP credentials
  const emailCreds = await getDecryptedCredentials(profileId, "email");
  if (!emailCreds?.appPassword) {
    return { success: false, error: "App Password de Gmail no configurada" };
  }

  // 3. Load profile info for branding
  const { data: profile } = await supabase
    .from("profiles")
    .select("name, color")
    .eq("id", profileId)
    .single();

  const businessName = profile?.name ?? "Tienda";
  const businessColor = profile?.color ?? "#3b82f6";

  // 4. Render email
  const html = renderDownloadEmail({
    businessName,
    businessColor,
    customerName,
    downloadUrl: config.download_url as string,
    footerText: (config.footer_text as string) ?? "Gracias por tu compra!",
  });

  // 5. Send via Gmail SMTP
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: config.gmail_address,
      pass: emailCreds.appPassword,
    },
  });

  const fromAddress = config.sender_name
    ? `"${config.sender_name}" <${config.gmail_address}>`
    : config.gmail_address;

  const subject = (config.subject_template as string) || "Tu descarga esta lista!";

  try {
    await transporter.sendMail({
      from: fromAddress,
      to: customerEmail,
      subject,
      html,
    });

    await supabase.from("email_send_log").insert({
      profile_id: profileId,
      shopify_order_name: orderName,
      customer_email: customerEmail,
      customer_name: customerName,
      status: "sent",
    });

    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Error desconocido al enviar email";

    await supabase.from("email_send_log").insert({
      profile_id: profileId,
      shopify_order_name: orderName,
      customer_email: customerEmail,
      customer_name: customerName,
      status: "failed",
      error_message: errorMessage,
    });

    return { success: false, error: errorMessage };
  }
}
