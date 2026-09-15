import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { isValidSessionCookieValue, ADMIN_COOKIE_NAME } from "@/lib/adminAuth";
import { rowToProduct, productToRow } from "@/lib/productMapper";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  return isValidSessionCookieValue(cookieStore.get(ADMIN_COOKIE_NAME)?.value);
}

type Props = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: NextRequest, props: Props) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await props.params;
  const body = await req.json();

  const { data, error } = await supabaseAdmin
    .from("products")
    .update(productToRow(body))
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "No se pudo actualizar el producto" }, { status: 500 });
  }
  return NextResponse.json(rowToProduct(data));
}

export async function DELETE(_req: NextRequest, props: Props) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await props.params;
  const { error } = await supabaseAdmin.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "No se pudo eliminar el producto" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
