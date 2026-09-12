"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  ExternalLink,
  Sparkles,
  Info,
  CheckCircle2,
  Clock,
  Lock,
  Unlock,
  Flame,
  Tag,
  PackagePlus,
  Trash2,
  Settings,
  X,
  KeyRound,
  Link2,
  AlertTriangle,
} from "lucide-react";

export interface ProductLink {
  id: string;
  name: string;
  description: string;
  price?: number;
  originalPrice?: number;
  category: string;
  image: string;
  targetUrl: string; // El link externo del producto o negocio que pagó
  badge?: "DESTACADO" | "OFERTA" | "POPULAR" | "NINGUNO";
  expiresAt?: string; // ISO date — cuándo vence el pago mensual del vendedor
}

const DEFAULT_PRODUCTS: ProductLink[] = [
  {
    id: "demo-1",
    name: "Reloj Smartwatch Pro Edition",
    description: "Pantalla AMOLED, monitoreo de salud 24/7 y batería de 10 días.",
    price: 45.0,
    originalPrice: 65.0,
    category: "Tecnología",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    targetUrl: "https://whatsapp.com",
    badge: "DESTACADO",
    expiresAt: undefined,
  },
  {
    id: "demo-2",
    name: "Audífonos Inalámbricos BassPro",
    description: "Cancelación de ruido activa, micrófono HD para llamadas y estuche de carga rápida.",
    price: 29.99,
    category: "Tecnología",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    targetUrl: "https://whatsapp.com",
    badge: "POPULAR",
    expiresAt: undefined,
  },
];

const CATEGORIES = ["Todos", "General", "Tecnología", "Ropa & Moda", "Accesorios", "Hogar"];
const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop&q=80";
const BADGE_PRIORITY: Record<string, number> = {
  DESTACADO: 0,
  OFERTA: 1,
  POPULAR: 2,
  NINGUNO: 3,
};

/**
 * ADAPTADOR DE ALMACENAMIENTO
 * ---------------------------
 * Toda lectura/escritura de datos pasa por aquí. Hoy usa localStorage, lo cual
 * significa que cada visitante ve solo SU PROPIA copia del catálogo — el admin
 * publica en su navegador y nadie más lo ve.
 *
 * Para pasar a un backend real (recomendado: Supabase o Vercel KV/Postgres),
 * solo hay que reescribir las funciones de este objeto para que hagan fetch()
 * a tu API en vez de leer/escribir localStorage. El resto del componente no
 * necesita cambiar.
 */
const storage = {
  async getProducts(): Promise<ProductLink[]> {
    if (typeof window === "undefined") return DEFAULT_PRODUCTS;
    const saved = localStorage.getItem("pediclick_products");
    if (!saved) {
      localStorage.setItem("pediclick_products", JSON.stringify(DEFAULT_PRODUCTS));
      return DEFAULT_PRODUCTS;
    }
    try {
      return JSON.parse(saved);
    } catch {
      return DEFAULT_PRODUCTS;
    }
  },
  async saveProducts(products: ProductLink[]): Promise<void> {
    localStorage.setItem("pediclick_products", JSON.stringify(products));
  },
  async getPin(): Promise<string> {
    if (typeof window === "undefined") return "1491";
    return localStorage.getItem("pediclick_pin") || "1491";
  },
  // NOTA DE SEGURIDAD: esta validación ocurre en el navegador del cliente.
  // Cualquiera con DevTools puede forzar isAdmin=true sin el PIN correcto.
  // Antes de manejar pagos reales de vendedores, esto debe validarse en un
  // endpoint de servidor (API route) que devuelva un token de sesión.
  async setPin(pin: string): Promise<void> {
    localStorage.setItem("pediclick_pin", pin);
  },
};

// Convierte números sueltos (con o sin +, espacios, guiones) en un link wa.me
function normalizeTargetUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "#";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const digitsOnly = trimmed.replace(/[^0-9]/g, "");
  if (digitsOnly.length >= 8 && digitsOnly === trimmed.replace(/[+\s-]/g, "")) {
    return `https://wa.me/${digitsOnly}`;
  }
  return trimmed;
}

function isExpired(product: ProductLink): boolean {
  if (!product.expiresAt) return false;
  return new Date(product.expiresAt).getTime() < Date.now();
}

function sortProducts(products: ProductLink[]): ProductLink[] {
  return [...products].sort((a, b) => {
    const aExpired = isExpired(a) ? 1 : 0;
    const bExpired = isExpired(b) ? 1 : 0;
    if (aExpired !== bExpired) return aExpired - bExpired; // vencidos al final
    const aPriority = BADGE_PRIORITY[a.badge || "NINGUNO"];
    const bPriority = BADGE_PRIORITY[b.badge || "NINGUNO"];
    if (aPriority !== bPriority) return aPriority - bPriority;
    return Number(b.id) - Number(a.id) || 0; // más reciente primero dentro del mismo tier
  });
}

export default function Home() {
  const [products, setProducts] = useState<ProductLink[]>([]);
  const [adminPin, setAdminPin] = useState("1491");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  // Modales
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Campos Formulario Admin / PIN
  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [pinConfigError, setPinConfigError] = useState("");

  // Formulario Nuevo Producto / Enlace
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdOrigPrice, setNewProdOrigPrice] = useState("");
  const [newProdCat, setNewProdCat] = useState("General");
  const [newProdBadge, setNewProdBadge] = useState<"DESTACADO" | "OFERTA" | "POPULAR" | "NINGUNO">(
    "NINGUNO"
  );
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdImg, setNewProdImg] = useState("");
  const [newProdUrl, setNewProdUrl] = useState("");
  const [newProdExpires, setNewProdExpires] = useState("");

  // Toast simple
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    (async () => {
      const [savedProducts, savedPin] = await Promise.all([storage.getProducts(), storage.getPin()]);
      setProducts(savedProducts);
      setAdminPin(savedPin);
      setLoading(false);
    })();
  }, []);

  // Cerrar cualquier modal abierto con Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setIsAddProductOpen(false);
      setIsConfigOpen(false);
      setIsAdminModalOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const saveProductsToStorage = async (updated: ProductLink[]) => {
    setProducts(updated);
    await storage.saveProducts(updated);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === adminPin) {
      setIsAdmin(true);
      setIsAdminModalOpen(false);
      setInputPin("");
      setPinError(false);
      showToast("Sesión de administrador iniciada");
    } else {
      setPinError(true);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName) return;

    const createdProduct: ProductLink = {
      id: Date.now().toString(),
      name: newProdName,
      price: newProdPrice ? parseFloat(newProdPrice) : undefined,
      originalPrice: newProdOrigPrice ? parseFloat(newProdOrigPrice) : undefined,
      category: newProdCat,
      badge: newProdBadge,
      description: newProdDesc || "Sin descripción corta.",
      image: newProdImg || FALLBACK_IMAGE,
      targetUrl: normalizeTargetUrl(newProdUrl),
      expiresAt: newProdExpires || undefined,
    };

    await saveProductsToStorage([createdProduct, ...products]);
    setNewProdName("");
    setNewProdPrice("");
    setNewProdOrigPrice("");
    setNewProdDesc("");
    setNewProdImg("");
    setNewProdUrl("");
    setNewProdBadge("NINGUNO");
    setNewProdExpires("");
    setIsAddProductOpen(false);
    showToast("Producto publicado en el directorio ✅");
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm("¿Deseas eliminar este producto del directorio?")) {
      const updated = products.filter((p) => p.id !== id);
      await saveProductsToStorage(updated);
      showToast("Producto eliminado");
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinConfigError("");
    if (newPin.trim().length < 4) {
      setPinConfigError("El PIN debe tener al menos 4 caracteres.");
      return;
    }
    if (newPin !== newPinConfirm) {
      setPinConfigError("Los dos PIN no coinciden.");
      return;
    }
    await storage.setPin(newPin);
    setAdminPin(newPin);
    setNewPin("");
    setNewPinConfirm("");
    setIsConfigOpen(false);
    showToast("PIN actualizado correctamente");
  };

  const filteredProducts = sortProducts(
    products.filter((p) => {
      const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      // Los clientes finales no ven productos vencidos; el admin sí (para renovar/eliminar)
      const visibleForRole = isAdmin || !isExpired(p);
      return matchesCategory && matchesSearch && visibleForRole;
    })
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-400 text-sm font-semibold">
        Cargando directorio...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-950 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Portada Superior */}
      <div className="relative h-60 sm:h-72 w-full bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-slate-950/80 to-slate-950" />
      </div>

      {/* Tarjeta Principal */}
      <div className="max-w-2xl mx-auto px-4 -mt-36 relative z-20">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Logo */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 p-[2px] shadow-xl shadow-slate-950/10">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
                  <Link2 className="w-7 h-7 text-indigo-400 mb-0.5" />
                  <div className="flex items-center gap-0.5 font-black text-sm tracking-tight text-white">
                    PediClick<span className="text-indigo-400">.</span>
                  </div>
                </div>
              </div>
              <span
                className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md border-2 border-white"
                title="Plataforma Activa"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Información de la Plataforma */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">PediClick Directory</h1>
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Enlaces Oficiales
                </span>
                {isAdmin && (
                  <button
                    onClick={() => setIsConfigOpen(true)}
                    className="p-1.5 text-slate-500 hover:text-slate-950 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors ml-auto"
                    title="Configuración de Tienda"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Directorio digital de ofertas y productos destacados. Haz clic para ir al enlace oficial del vendedor.
              </p>

              {/* Insignias de la plataforma */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Catálogo en Vivo
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" /> Links Directos
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Ofertas Activas
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador & Acciones */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, categoría o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-sm placeholder:text-slate-400 outline-none focus:border-slate-950 transition-all"
              />
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="bg-slate-950 hover:bg-indigo-600 text-white px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
              >
                <PackagePlus className="w-4 h-4" />
                <span className="hidden sm:inline">Publicar Enlace</span>
              </button>
            )}
          </div>

          {/* Categorías */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    active
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                      : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Productos / Enlaces */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-950 text-lg tracking-tight">Productos Promocionados</h2>
            <span className="text-xs text-slate-400 font-semibold">{filteredProducts.length} artículos</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-slate-950 font-black text-base">Directorio en Actualización</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                {isAdmin
                  ? "Aún no has agregado productos. Presiona el botón para incluir el primer producto con su enlace."
                  : "No hay productos disponibles en esta sección por el momento."}
              </p>
              {isAdmin ? (
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 bg-slate-950 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  <PackagePlus className="w-4 h-4" /> Publicar Producto
                </button>
              ) : (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs transition-all"
                >
                  <Lock className="w-3.5 h-3.5" /> ¿Eres el administrador? Acceder con PIN
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map((p) => {
              const expired = isExpired(p);
              return (
                <div
                  key={p.id}
                  className={`group bg-white p-4 rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-4 items-start sm:items-center relative overflow-hidden ${
                    expired ? "border-amber-300 opacity-70" : "border-slate-200/70"
                  }`}
                >
                  {/* Imagen y Badges */}
                  <div className="relative w-full sm:w-28 h-40 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {p.badge && p.badge !== "NINGUNO" && (
                      <span
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider text-white uppercase shadow-md flex items-center gap-1 ${
                          p.badge === "OFERTA"
                            ? "bg-red-500"
                            : p.badge === "POPULAR"
                            ? "bg-amber-500"
                            : "bg-indigo-600"
                        }`}
                      >
                        {p.badge === "OFERTA" && <Tag className="w-2.5 h-2.5" />}
                        {p.badge === "POPULAR" && <Flame className="w-2.5 h-2.5" />}
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Detalles del Producto */}
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-950 text-base leading-snug">{p.name}</h3>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteProduct(p.id)}
                          className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                          title="Eliminar del catálogo"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                      {p.description}
                    </p>

                    {p.price && (
                      <div className="flex items-baseline gap-2 mt-3">
                        <span className="font-black text-slate-950 text-base flex items-baseline gap-0.5">
                          ${p.price.toFixed(2)}
                          <span className="text-[10px] text-slate-400 font-normal">USD</span>
                        </span>

                        {p.originalPrice && p.originalPrice > p.price && (
                          <span className="text-xs text-slate-400 line-through font-semibold">
                            ${p.originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}

                    {isAdmin && expired && (
                      <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                        <AlertTriangle className="w-3 h-3" /> Pago vencido — renovar con el vendedor
                      </span>
                    )}
                  </div>

                  {/* Botón Redirección al Link del Cliente */}
                  <div className="w-full sm:w-auto flex justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <a
                      href={p.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
                    >
                      Ir al Producto <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie de página */}
        <footer className="mt-16 text-center border-t border-slate-200/70 pt-8 pb-4 text-slate-400 text-xs flex flex-col items-center gap-2">
          <p className="font-semibold text-slate-500">PediClick Directory &copy; 2026</p>

          <button
            onClick={() => {
              if (isAdmin) setIsAdmin(false);
              else setIsAdminModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-slate-700 transition-colors mt-1"
          >
            {isAdmin ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700 font-bold">Modo Admin Activo (Cerrar)</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" />
                <span>Acceso Dueño / Admin</span>
              </>
            )}
          </button>
        </footer>
      </div>

      {/* Modal Autenticación PIN Admin */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdminLogin}
            className="bg-white w-full max-w-xs rounded-3xl p-6 shadow-2xl space-y-4 text-center relative"
          >
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-4 right-4 bg-slate-100 p-1.5 rounded-full text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-950">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-slate-950 text-base">Modo Administrador</h3>
              <p className="text-xs text-slate-500 mt-1">Ingresa tu PIN para publicar o gestionar enlaces</p>
            </div>

            <div>
              <input
                type="password"
                maxLength={8}
                required
                autoFocus
                placeholder="Ingresa tu PIN"
                value={inputPin}
                onChange={(e) => {
                  setInputPin(e.target.value);
                  setPinError(false);
                }}
                className={`w-full text-center tracking-widest bg-slate-50 px-3.5 py-3 rounded-xl border text-sm font-bold ${
                  pinError ? "border-red-500 bg-red-50/50" : "border-slate-200"
                }`}
              />
              {pinError && <p className="text-[10px] text-red-500 font-bold mt-1">PIN incorrecto</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-950 text-white font-bold py-3 rounded-xl text-xs shadow-md"
            >
              Ingresar al Panel
            </button>
          </form>
        </div>
      )}

      {/* Modal Agregar Nuevo Producto / Enlace Patrocinado */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleAddProduct}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-950 text-lg">Publicar Nuevo Producto</h3>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="bg-slate-100 p-2 rounded-full text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Producto / Oferta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Zapatillas Nike Air"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Link de Destino / WhatsApp del Cliente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="809-555-1234 o https://tienda.com/producto"
                  value={newProdUrl}
                  onChange={(e) => setNewProdUrl(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Si escribes solo un número, se convierte automáticamente en link de WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio ($) (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="49.99"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio Anterior (Opcional)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="65.00"
                    value={newProdOrigPrice}
                    onChange={(e) => setNewProdOrigPrice(e.target.value)}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={newProdCat}
                    onChange={(e) => setNewProdCat(e.target.value)}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    {CATEGORIES.filter((c) => c !== "Todos").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Insignia Especial</label>
                  <select
                    value={newProdBadge}
                    onChange={(e) => setNewProdBadge(e.target.value as any)}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    <option value="NINGUNO">Ninguna</option>
                    <option value="DESTACADO">DESTACADO</option>
                    <option value="OFERTA">OFERTA</option>
                    <option value="POPULAR">POPULAR</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Vence el (fecha de próximo pago)
                </label>
                <input
                  type="date"
                  value={newProdExpires}
                  onChange={(e) => setNewProdExpires(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Si se pasa esta fecha, el producto se oculta a los clientes hasta que renueves.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">URL de Imagen (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newProdImg}
                  onChange={(e) => setNewProdImg(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Descripción corta</label>
                <textarea
                  rows={2}
                  placeholder="Escribe brevemente sobre el producto..."
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs resize-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-950 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg"
            >
              Publicar en el Directorio
            </button>
          </form>
        </div>
      )}

      {/* Modal Ajustes del Admin */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveConfig}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-950 text-base">Ajustes del Admin</h3>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                className="bg-slate-100 p-1.5 rounded-full text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nuevo PIN de Acceso:</label>
                <input
                  type="password"
                  placeholder="Nuevo PIN (mín. 4 caracteres)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Confirmar Nuevo PIN:</label>
                <input
                  type="password"
                  placeholder="Repite el PIN"
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
              {pinConfigError && (
                <p className="text-[10px] text-red-500 font-bold">{pinConfigError}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-slate-950 text-white font-bold py-3 rounded-xl text-xs"
            >
              Guardar Ajustes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
