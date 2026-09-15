import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { hashPin } from "@/lib/adminAuth";

/**
 * Ruta de UN SOLO USO: visítala una vez en el navegador para fijar tu PIN
 * inicial, por ejemplo:
 *   https://pediclick.vercel.app/api/admin/bootstrap?secret=TU_ADMIN_BOOTSTRAP_SECRET&pin=1491
 *
 * Después de usarla, considera borrar este archivo del repo (o simplemente
 * no compartas nunca el valor de ADMIN_BOOTSTRAP_SECRET) — mientras alguien
 * no conozca ese secreto, no puede usar esta ruta para cambiar tu PIN.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const pin = url.searchParams.get("pin");

  if (!secret || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!pin || pin.length < 4) {
    return NextResponse.json({ error: "PIN inválido (mínimo 4 caracteres)" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("admin_settings")
    .upsert({ id: 1, pin_hash: hashPin(pin) });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: "PIN inicial configurado. Ya puedes iniciar sesión." });
}
