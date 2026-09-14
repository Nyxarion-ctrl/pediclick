import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidSessionCookieValue, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { rowToProduct, productToRow } from "@/lib/productMapper";

export async function GET() {
  const cookieStore = await cookies();
  const isAdmin = isValidSessionCookieValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value);

  let query = supabaseAdmin.from("products").select("*").order("submitted_at", { ascending: false });
  if (!isAdmin) {
    query = query.eq("status", "approved");
  }

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "No se pudo cargar el directorio" }, { status: 500 });
  }
  return NextResponse.json((data ?? []).map(rowToProduct));
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const isAdmin = isValidSessionCookieValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
  const body = await req.json();

  // IMPORTANTE: la decisión de si algo se publica directo o queda pendiente
  // se toma AQUÍ, con la cookie verificada en el servidor — nunca confiando
  // en lo que el navegador diga que es. Quien no sea admin siempre entra
  // como "pending", sin insignia y sin fecha de vencimiento propia.
  const row = productToRow({
    name: body.name,
    description: body.description,
    price: body.price,
    originalPrice: body.originalPrice,
    category: body.category,
    image: body.image,
    whatsapp: body.whatsapp,
    targetUrl: body.targetUrl,
    badge: isAdmin ? body.badge ?? "NINGUNO" : "NINGUNO",
    expiresAt: isAdmin ? body.expiresAt : undefined,
    status: isAdmin ? body.status ?? "approved" : "pending",
  });

  const { data, error } = await supabaseAdmin.from("products").insert(row).select().single();
  if (error) {
    return NextResponse.json({ error: "No se pudo crear el producto" }, { status: 500 });
  }
  return NextResponse.json(rowToProduct(data));
}
