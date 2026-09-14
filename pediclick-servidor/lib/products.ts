import type { ProductLink } from "./types";

export const products = {
  async getAll(): Promise<ProductLink[]> {
    const res = await fetch("/api/products", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar el directorio");
    return res.json();
  },

  async create(p: Omit<ProductLink, "id" | "submittedAt">): Promise<ProductLink> {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (!res.ok) throw new Error("No se pudo crear el producto");
    return res.json();
  },

  async update(id: string, p: Partial<ProductLink>): Promise<ProductLink> {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    });
    if (!res.ok) throw new Error("No se pudo actualizar el producto");
    return res.json();
  },

  async remove(id: string): Promise<void> {
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("No se pudo eliminar el producto");
  },
};
