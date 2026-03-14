import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { sendDownloadEmail } from "@/lib/email/send-download-email";

const bodySchema = z.object({
  profileId: z.string().uuid(),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
  orderName: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    await requireAuth();

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Parametros invalidos" },
        { status: 400 }
      );
    }

    const { profileId, customerEmail, customerName, orderName } = parsed.data;

    const result = await sendDownloadEmail(profileId, customerEmail, customerName, orderName);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Comprobante send error:", error);
    return NextResponse.json(
      { error: "Error al enviar el comprobante" },
      { status: 500 }
    );
  }
}
