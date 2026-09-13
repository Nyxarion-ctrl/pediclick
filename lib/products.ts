import { supabase } from "./supabase";
import type { ProductLink } from "./types";

// Convierte una fila de la tabla (snake_case) al formato que usa la app (camelCase)
function rowToProduct(row: any): ProductLink {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price ?? undefined,
    originalPrice: row.original_price ?? undefined,
    category: row.category,
    image: row.image,
    whatsapp: row.whatsapp,
    targetUrl: row.target_url,
    badge: row.badge ?? "NINGUNO",
    expiresAt: row.expires_at ?? undefined,
    status: row.status,
    submittedAt: row.submitted_at,
  };
}

// Convierte el formato de la app al de la tabla, para insertar/actualizar
function productToRow(p: Partial<ProductLink>) {
  return {
    name: p.name,
    description: p.description,
    price: p.price ?? null,
    original_price: p.originalPrice ?? null,
    category: p.category,
    image: p.image,
    whatsapp: p.whatsapp,
    target_url: p.targetUrl,
    badge: p.badge ?? "NINGUNO",
    expires_at: p.expiresAt ?? null,
    status: p.status,
  };
}

export const products = {
  async getAll(): Promise<ProductLink[]> {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("submitted_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map(rowToProduct);
  },

  async create(p: Omit<ProductLink, "id" | "submittedAt">): Promise<ProductLink> {
    const { data, error } = await supabase.from("products").insert(productToRow(p)).select().single();
    if (error) throw error;
    return rowToProduct(data);
  },

  async update(id: string, p: Partial<ProductLink>): Promise<ProductLink> {
    const { data, error } = await supabase
      .from("products")
      .update(productToRow(p))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return rowToProduct(data);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;
  },
};
