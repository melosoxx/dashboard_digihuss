import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { encrypt, decrypt } from "@/lib/encryption";

const credentialSchema = z.object({
  service: z.enum(["shopify", "meta", "clarity"]),
  credentials: z.record(z.string(), z.string()),
});

/** Fields that are secrets and should never be returned to the client */
const SECRET_FIELDS: Record<string, string[]> = {
  shopify: ["adminAccessToken"],
  meta: ["accessToken"],
  clarity: ["apiToken"],
};

// GET /api/profiles/[id]/credentials?service=shopify - Get non-secret fields
export async function GET(
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

    const { data, error } = await supabase
      .from("profile_credentials")
      .select("encrypted_data, iv")
      .eq("profile_id", id)
      .eq("service", service)
      .single();

    if (error || !data) {
      return NextResponse.json({ fields: {} });
    }

    try {
      const json = decrypt(data.encrypted_data, data.iv);
      const all: Record<string, string> = JSON.parse(json);
      const secrets = SECRET_FIELDS[service] ?? [];
      const safe: Record<string, string> = {};
      for (const [key, value] of Object.entries(all)) {
        if (!secrets.includes(key)) {
          safe[key] = value;
        }
      }
      return NextResponse.json({ fields: safe });
    } catch {
      return NextResponse.json({ fields: {} });
    }
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to read credentials" }, { status: 500 });
  }
}

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

    // Merge with existing credentials so secret fields are preserved when omitted
    let merged = { ...parsed.data.credentials };
    const secrets = SECRET_FIELDS[parsed.data.service] ?? [];
    const hasEmptySecrets = secrets.some((k) => !merged[k] || merged[k].trim() === "");

    if (hasEmptySecrets) {
      // Load existing credentials to preserve secret values
      const { data: existing } = await supabase
        .from("profile_credentials")
        .select("encrypted_data, iv")
        .eq("profile_id", id)
        .eq("service", parsed.data.service)
        .single();

      if (existing) {
        try {
          const prev: Record<string, string> = JSON.parse(
            decrypt(existing.encrypted_data, existing.iv)
          );
          for (const key of secrets) {
            if ((!merged[key] || merged[key].trim() === "") && prev[key]) {
              merged[key] = prev[key];
            }
          }
        } catch {
          // ignore decrypt errors
        }
      }
    }

    // Encrypt credentials
    const { encrypted, iv } = encrypt(JSON.stringify(merged));

    // Upsert into profile_credentials and reset validation status
    const { error } = await supabase.from("profile_credentials").upsert(
      {
        profile_id: id,
        service: parsed.data.service,
        encrypted_data: encrypted,
        iv,
        // IMPORTANT: Reset validation status when credentials are updated
        validation_status: "untested",
        last_validated_at: null,
        last_error_message: null,
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
