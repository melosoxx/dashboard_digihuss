import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { encrypt } from "@/lib/encryption";

const credentialSchema = z.object({
  service: z.enum(["shopify", "meta", "clarity"]),
  credentials: z.record(z.string(), z.string()),
});

// PUT /api/profiles/[id]/credentials - Save encrypted credentials
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const parsed = credentialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    // Verify profile ownership (RLS also enforces this)
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Encrypt credentials
    const { encrypted, iv } = encrypt(JSON.stringify(parsed.data.credentials));

    // Upsert into profile_credentials
    const { error } = await supabase.from("profile_credentials").upsert(
      {
        profile_id: id,
        service: parsed.data.service,
        encrypted_data: encrypted,
        iv,
      },
      { onConflict: "profile_id,service" }
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Credential save error:", error);
    return NextResponse.json({ error: "Failed to save credentials" }, { status: 500 });
  }
}

// DELETE /api/profiles/[id]/credentials?service=shopify - Delete credentials for a service
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { supabase } = await requireAuth();
    const { id } = await params;
    const url = new URL(request.url);
    const service = url.searchParams.get("service");

    if (!service || !["shopify", "meta", "clarity"].includes(service)) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    }

    const { error } = await supabase
      .from("profile_credentials")
      .delete()
      .eq("profile_id", id)
      .eq("service", service);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Credential delete error:", error);
    return NextResponse.json({ error: "Failed to delete credentials" }, { status: 500 });
  }
}
