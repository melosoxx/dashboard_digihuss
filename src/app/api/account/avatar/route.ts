import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/auth-guard";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function POST(request: Request) {
  try {
    const { user } = await requireAuth();

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No se proporcionó un archivo" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "El archivo es muy grande (máximo 2MB)" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de archivo no válido. Usa JPG, PNG o WebP" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "jpg";
    const filePath = `${user.id}/avatar.${ext}`;

    const admin = createAdminClient();

    const { error: uploadError } = await admin.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const avatarUrl = `${publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, avatar_url: avatarUrl },
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ avatar_url: avatarUrl });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al subir la imagen" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { user } = await requireAuth();
    const admin = createAdminClient();

    // List files in user's avatar folder and remove them
    const { data: files } = await admin.storage
      .from("avatars")
      .list(user.id);

    if (files && files.length > 0) {
      const filePaths = files.map((f) => `${user.id}/${f.name}`);
      await admin.storage.from("avatars").remove(filePaths);
    }

    // Clear avatar_url from user_metadata
    const metadata = { ...user.user_metadata };
    delete metadata.avatar_url;

    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: metadata,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Error al eliminar la imagen" }, { status: 500 });
  }
}
