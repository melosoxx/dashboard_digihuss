import "server-only";
import { getResend, EMAIL_FROM } from "./resend";

const APP_NAME = "WWH Dash";
const CALENDLY_LINK = process.env.CALENDLY_LINK ?? "";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function wrapHtml(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;color:#1e293b">
<div style="max-width:560px;margin:40px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
<div style="background:#2563eb;padding:24px 32px">
<h1 style="margin:0;color:#fff;font-size:20px;font-weight:700">${APP_NAME}</h1>
</div>
<div style="padding:32px">${content}</div>
<div style="padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center">
<p style="margin:0;font-size:12px;color:#94a3b8">&copy; ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
</div>
</div>
</body></html>`;
}

function btn(url: string, label: string) {
  return `<a href="${url}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0">${label}</a>`;
}

export async function sendWelcomeEmail(to: string, name?: string) {
  const greeting = name ? `Hola ${name}` : "Hola";
  await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Bienvenido a ${APP_NAME}!`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;font-size:18px">${greeting}, bienvenido a ${APP_NAME}!</h2>
      <p style="color:#475569;line-height:1.6">Tu cuenta fue creada exitosamente. El siguiente paso es agendar tu llamada de onboarding con nuestro equipo para configurar todo juntos.</p>
      ${CALENDLY_LINK ? btn(CALENDLY_LINK, "Agendar Onboarding") : ""}
      <p style="color:#475569;line-height:1.6">Durante la llamada (30-45 min) vamos a:</p>
      <ul style="color:#475569;line-height:1.8">
        <li>Cargar tus API keys de Shopify, Meta Ads y Clarity</li>
        <li>Verificar que los datos fluyan correctamente</li>
        <li>Hacer un tour del dashboard y la IA</li>
      </ul>
      ${btn(`${APP_URL}/login`, "Ir al Dashboard")}
    `),
  });
}

export async function sendOnboardingConfirmation(to: string, date: Date) {
  const dateStr = date.toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Onboarding confirmado - ${APP_NAME}`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;font-size:18px">Tu llamada de onboarding esta confirmada</h2>
      <p style="color:#475569;line-height:1.6"><strong>Fecha:</strong> ${dateStr}</p>
      <p style="color:#475569;line-height:1.6">Antes de la llamada, asegurate de tener acceso a:</p>
      <ul style="color:#475569;line-height:1.8">
        <li>Panel de administracion de Shopify</li>
        <li>Meta Business Suite</li>
        <li>Microsoft Clarity</li>
      </ul>
    `),
  });
}

export async function sendOnboardingReminder(to: string, date: Date) {
  const timeStr = date.toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Recordatorio: onboarding manana - ${APP_NAME}`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;font-size:18px">Tu onboarding es manana a las ${timeStr}</h2>
      <p style="color:#475569;line-height:1.6">Checklist para tener listo:</p>
      <ul style="color:#475569;line-height:1.8">
        <li>Acceso al panel de Shopify (credenciales de API)</li>
        <li>Acceso a Meta Business Suite (token de acceso)</li>
        <li>Acceso a Microsoft Clarity (API token)</li>
      </ul>
      <p style="color:#475569;line-height:1.6">Si necesitas reagendar, responde a este email.</p>
    `),
  });
}

export async function sendPostOnboardingEmail(to: string) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Tu dashboard esta listo! - ${APP_NAME}`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;font-size:18px">Onboarding completado!</h2>
      <p style="color:#475569;line-height:1.6">Tu dashboard esta configurado y listo para usar. Aca van algunos recursos utiles:</p>
      <ul style="color:#475569;line-height:1.8">
        <li>Usa "Huss" (la IA) para analisis y recomendaciones</li>
        <li>Revisa el panel diariamente para seguir tus metricas</li>
        <li>Configura tus gastos en la seccion Finanzas</li>
      </ul>
      ${btn(`${APP_URL}/panel`, "Ir al Dashboard")}
      <p style="color:#475569;line-height:1.6;margin-top:24px">Si tenes alguna duda, responde a este email.</p>
    `),
  });
}

export async function sendPaymentFailedEmail(to: string) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Problema con tu pago - ${APP_NAME}`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;font-size:18px">No pudimos procesar tu pago</h2>
      <p style="color:#475569;line-height:1.6">Hubo un problema al cobrar tu suscripcion mensual. Por favor actualiza tu metodo de pago para mantener el acceso a tu dashboard.</p>
      ${btn(`${APP_URL}/configuracion`, "Actualizar Metodo de Pago")}
      <p style="color:#475569;line-height:1.6;margin-top:16px">Si no actualizas tu pago en los proximos dias, tu cuenta sera pausada temporalmente.</p>
    `),
  });
}

export async function sendAccountPausedEmail(to: string) {
  await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Tu cuenta fue pausada - ${APP_NAME}`,
    html: wrapHtml(`
      <h2 style="margin:0 0 16px;font-size:18px">Tu cuenta fue pausada</h2>
      <p style="color:#475569;line-height:1.6">Tu cuenta de ${APP_NAME} fue pausada. Esto puede deberse a un problema con tu metodo de pago.</p>
      <p style="color:#475569;line-height:1.6">Para reactivar tu cuenta, actualiza tu informacion de pago o contactanos:</p>
      ${btn("mailto:soporte@wwhustle.com", "Contactar Soporte")}
      <p style="color:#94a3b8;font-size:13px;margin-top:24px">Tus datos se mantienen guardados por 30 dias.</p>
    `),
  });
}
