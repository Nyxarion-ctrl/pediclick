import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPin, createSessionCookieValue, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const { pin } = await req.json();
  if (!pin) {
    return NextResponse.json({ error: "PIN requerido" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("admin_settings")
    .select("pin_hash")
    .eq("id", 1)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Aún no se ha configurado un PIN. Usa /api/admin/bootstrap primero." },
      { status: 500 }
    );
  }

  if (hashPin(pin) !== data.pin_hash) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, createSessionCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
  return res;
}
