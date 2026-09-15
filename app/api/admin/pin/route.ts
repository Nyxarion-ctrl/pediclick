import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPin, isValidSessionCookieValue, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function PATCH(req: Request) {
  const cookieStore = await cookies();
  const isAdmin = isValidSessionCookieValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  if (!isAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { newPin } = await req.json();
  if (!newPin || newPin.length < 4) {
    return NextResponse.json({ error: "El PIN debe tener al menos 4 caracteres" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("admin_settings")
    .upsert({ id: 1, pin_hash: hashPin(newPin) });

  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar el PIN" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
