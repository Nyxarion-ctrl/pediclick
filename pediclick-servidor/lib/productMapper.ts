import type { ProductLink } from "./types";

export function rowToProduct(row: any): ProductLink {
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

export function productToRow(p: Partial<ProductLink>) {
  const row: Record<string, unknown> = {};
  if (p.name !== undefined) row.name = p.name;
  if (p.description !== undefined) row.description = p.description;
  if (p.price !== undefined) row.price = p.price ?? null;
  if (p.originalPrice !== undefined) row.original_price = p.originalPrice ?? null;
  if (p.category !== undefined) row.category = p.category;
  if (p.image !== undefined) row.image = p.image;
  if (p.whatsapp !== undefined) row.whatsapp = p.whatsapp;
  if (p.targetUrl !== undefined) row.target_url = p.targetUrl;
  if (p.badge !== undefined) row.badge = p.badge;
  if (p.expiresAt !== undefined) row.expires_at = p.expiresAt ?? null;
  if (p.status !== undefined) row.status = p.status;
  return row;
}
