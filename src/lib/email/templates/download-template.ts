interface DownloadTemplateProps {
  businessName: string;
  businessColor: string;
  customerName: string;
  downloadUrl: string;
  footerText: string;
}

export function renderDownloadEmail(props: DownloadTemplateProps): string {
  const { businessName, businessColor, customerName, downloadUrl, footerText } = props;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tu descarga</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f5;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="520" style="max-width: 520px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color: ${businessColor}; padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">
                ${escapeHtml(businessName)}
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px 32px 16px;">
              <p style="margin: 0 0 8px; font-size: 17px; font-weight: 600; color: #18181b;">
                Hola, ${escapeHtml(customerName)}!
              </p>
              <p style="margin: 0; font-size: 15px; color: #52525b; line-height: 1.6;">
                Tu compra fue procesada exitosamente. Usa el boton de abajo para descargar tu producto.
              </p>
            </td>
          </tr>

          <!-- Download button -->
          <tr>
            <td style="padding: 16px 32px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="text-align: center;">
                <tr>
                  <td style="padding: 8px 0;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                      <tr>
                        <td style="background-color: ${businessColor}; border-radius: 8px; padding: 14px 28px;">
                          <a href="${escapeHtml(downloadUrl)}" target="_blank"
                             style="color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: inline-block;">
                            Descargar
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px 28px; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #a1a1aa; line-height: 1.5;">
                ${escapeHtml(footerText)}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
