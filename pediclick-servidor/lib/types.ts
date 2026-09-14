export type ProductStatus = "pending" | "approved";

export interface ProductLink {
  id: string;
  name: string;
  description: string;
  price?: number;
  originalPrice?: number;
  category: string;
  image: string;
  whatsapp: string; // número que ingresó el vendedor, ej. "8095551234"
  targetUrl: string; // se genera automáticamente como https://wa.me/<whatsapp>
  badge?: "DESTACADO" | "OFERTA" | "POPULAR" | "NINGUNO";
  expiresAt?: string; // fecha ISO — próxima fecha de renovación del vendedor
  status: ProductStatus; // "pending" = esperando aprobación; "approved" = visible al público
  submittedAt: string;
}
