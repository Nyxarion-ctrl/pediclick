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
  Pencil,
  Settings,
  X,
  KeyRound,
  Link2,
  AlertTriangle,
  BadgeCheck,
  CreditCard,
} from "lucide-react";

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
  expiresAt?: string; // ISO date — próxima fecha de renovación del vendedor
  status: ProductStatus; // "pending" = esperando que apruebes el pago; "approved" = visible al público
  submittedAt: string;
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
    whatsapp: "18095550101",
    targetUrl: "https://wa.me/18095550101",
    badge: "DESTACADO",
    status: "approved",
    submittedAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    name: "Audífonos Inalámbricos BassPro",
    description: "Cancelación de ruido activa, micrófono HD para llamadas y estuche de carga rápida.",
    price: 29.99,
    category: "Tecnología",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    whatsapp: "18095550102",
    targetUrl: "https://wa.me/18095550102",
    badge: "POPULAR",
    status: "approved",
    submittedAt: new Date().toISOString(),
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

// TODO: reemplaza estos dos links por tus checkouts reales de suscripción mensual
// (un "Payment Link" de Lemon Squeezy y un "Subscribe" link de un plan de PayPal).
const LEMON_CHECKOUT_URL = "https://tu-tienda.lemonsqueezy.com/checkout/buy/REEMPLAZA-ESTE-ID";
const PAYPAL_CHECKOUT_URL =
  "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=REEMPLAZA-ESTE-ID";

/**
 * ADAPTADOR DE ALMACENAMIENTO
 * ---------------------------
 * Toda lectura/escritura de datos pasa por aquí. Hoy usa localStorage, lo cual
 * significa que cada visitante ve solo SU PROPIA copia del catálogo — el admin
 * publica en su navegador y nadie más lo ve, y las solicitudes públicas tampoco
 * llegan realmente al admin desde otro dispositivo.
 *
 * Para pasar a un backend real (recomendado: Supabase), reescribe estas
 * funciones para que hagan fetch() a tu API en vez de leer/escribir
 * localStorage. El resto del componente no necesita cambiar.
 *
 * Este es también el lugar donde, más adelante, un webhook de Lemon
 * Squeezy/PayPal marcaría automáticamente un producto como "approved" en
 * cuanto se confirme el pago — hoy esa aprobación la haces tú a mano.
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
  // Antes de manejar pagos reales, esto debe validarse en un endpoint de
  // servidor que devuelva un token de sesión.
  async setPin(pin: string): Promise<void> {
    localStorage.setItem("pediclick_pin", pin);
  },
};

function digitsOnly(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
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

type FormMode = "closed" | "public" | "admin";
type FormStep = "form" | "payment";

export default function Home() {
  const [products, setProducts] = useState<ProductLink[]>([]);
  const [adminPin, setAdminPin] = useState("1491");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [formStep, setFormStep] = useState<FormStep>("form");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [pinConfigError, setPinConfigError] = useState("");

  const [prodName, setProdName] = useState("");
  const [prodWhatsapp, setProdWhatsapp] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodOrigPrice, setProdOrigPrice] = useState("");
  const [prodCat, setProdCat] = useState("General");
  const [prodBadge, setProdBadge] = useState<"DESTACADO" | "OFERTA" | "POPULAR" | "NINGUNO">("NINGUNO");
  const [prodDesc, setProdDesc] = useState("");
  const [prodImg, setProdImg] = useState("");
  const [prodExpires, setProdExpires] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  useEffect(() => {
    (async () => {
      const [savedProducts, savedPin] = await Promise.all([storage.getProducts(), storage.getPin()]);
      setProducts(savedProducts);
      setAdminPin(savedPin);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      closeForm();
      setIsConfigOpen(false);
      setIsAdminModalOpen(false);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProductsToStorage = async (updated: ProductLink[]) => {
    setProducts(updated);
    await storage.saveProducts(updated);
  };

  const resetForm = () => {
    setProdName("");
    setProdWhatsapp("");
    setProdPrice("");
    setProdOrigPrice("");
    setProdCat("General");
    setProdBadge("NINGUNO");
    setProdDesc("");
    setProdImg("");
    setProdExpires("");
    setEditingId(null);
    setFormStep("form");
  };

  const closeForm = () => {
    setFormMode("closed");
    resetForm();
  };

  const openCreateForm = () => {
    resetForm();
    setFormMode(isAdmin ? "admin" : "public");
  };

  const openEditForm = (product: ProductLink) => {
    setEditingId(product.id);
    setProdName(product.name);
    setProdWhatsapp(product.whatsapp);
    setProdPrice(product.price?.toString() ?? "");
    setProdOrigPrice(product.originalPrice?.toString() ?? "");
    setProdCat(product.category);
    setProdBadge(product.badge ?? "NINGUNO");
    setProdDesc(product.description);
    setProdImg(product.image);
    setProdExpires(product.expiresAt ?? "");
    setFormMode("admin");
    setFormStep("form");
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const whatsappDigits = digitsOnly(prodWhatsapp);
    if (!prodName || whatsappDigits.length < 8) return;

    const targetUrl = `https://wa.me/${whatsappDigits}`;

    if (editingId) {
      const existing = products.find((p) => p.id === editingId);
      const nextStatus: ProductStatus =
        existing?.status === "pending" && isAdmin ? "approved" : existing?.status ?? "approved";

      const updated = products.map((p) =>
        p.id === editingId
          ? {
              ...p,
              name: prodName,
              whatsapp: whatsappDigits,
              targetUrl,
              price: prodPrice ? parseFloat(prodPrice) : undefined,
              originalPrice: prodOrigPrice ? parseFloat(prodOrigPrice) : undefined,
              category: prodCat,
              badge: prodBadge,
              description: prodDesc || "Sin descripción corta.",
              image: prodImg || FALLBACK_IMAGE,
              expiresAt: prodExpires || undefined,
              status: nextStatus,
            }
          : p
      );
      await saveProductsToStorage(updated);
      showToast(
        nextStatus === "approved" && existing?.status === "pending"
          ? "Solicitud aprobada y publicada ✅"
          : "Cambios guardados"
      );
      closeForm();
      return;
    }

    const created: ProductLink = {
      id: Date.now().toString(),
      name: prodName,
      whatsapp: whatsappDigits,
      targetUrl,
      price: prodPrice ? parseFloat(prodPrice) : undefined,
      originalPrice: prodOrigPrice ? parseFloat(prodOrigPrice) : undefined,
      category: prodCat,
      badge: formMode === "admin" ? prodBadge : "NINGUNO",
      description: prodDesc || "Sin descripción corta.",
      image: prodImg || FALLBACK_IMAGE,
      expiresAt: formMode === "admin" ? prodExpires || undefined : undefined,
      status: formMode === "admin" ? "approved" : "pending",
      submittedAt: new Date().toISOString(),
    };

    await saveProductsToStorage([created, ...products]);

    if (formMode === "public") {
      setFormStep("payment");
    } else {
      showToast("Producto publicado ✅");
      closeForm();
    }
  };

  const handleRejectPending = async (id: string) => {
    if (confirm("¿Rechazar y eliminar esta solicitud?")) {
      const updated = products.filter((p) => p.id !== id);
      await saveProductsToStorage(updated);
      showToast("Solicitud rechazada");
    }
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

  const pendingProducts = products
    .filter((p) => p.status === "pending")
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());

  const filteredProducts = sortProducts(
    products.filter((p) => {
      if (p.status !== "approved") return false;
      const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
      const q = search.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
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

  const editingExisting = editingId ? products.find((p) => p.id === editingId) : undefined;
  const isReviewingPending = isAdmin && editingExisting?.status === "pending";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-20">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-slate-950 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      <div className="relative h-60 sm:h-72 w-full bg-slate-950 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-slate-950/80 to-slate-950" />
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-36 relative z-20">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
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
                Directorio digital de ofertas y productos destacados. Haz clic para contactar al vendedor por WhatsApp.
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Catálogo en Vivo
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60">
                  <Link2 className="w-3.5 h-3.5 text-slate-400" /> Contacto Directo
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Ofertas Activas
                </span>
              </div>
            </div>
          </div>
        </div>

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

            <button
              onClick={openCreateForm}
              className="bg-slate-950 hover:bg-indigo-600 text-white px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0"
            >
              <PackagePlus className="w-4 h-4" />
              <span className="hidden sm:inline">{isAdmin ? "Publicar Enlace" : "Publicar mi Producto"}</span>
            </button>
          </div>

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

        {isAdmin && pendingProducts.length > 0 && (
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-3xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h2 className="font-black text-amber-800 text-sm">
                Pendientes de aprobación ({pendingProducts.length})
              </h2>
            </div>
            <div className="space-y-2">
              {pendingProducts.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl p-3 flex items-center justify-between gap-3 border border-amber-100"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-slate-950 text-sm truncate">{p.name}</p>
                    <p className="text-[11px] text-slate-500">
                      WhatsApp: {p.whatsapp} · {p.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditForm(p)}
                      className="bg-slate-950 hover:bg-indigo-600 text-white text-[11px] font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      Revisar
                    </button>
                    <button
                      onClick={() => handleRejectPending(p.id)}
                      className="bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 text-[11px] font-bold px-3 py-2 rounded-xl transition-colors"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-amber-700 mt-3">
              Verifica el pago en tu panel de Lemon Squeezy o PayPal antes de aprobar.
            </p>
          </div>
        )}

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
                  ? "Aún no hay productos publicados. Puedes agregar uno directamente o esperar solicitudes."
                  : "No hay productos disponibles en esta sección por el momento."}
              </p>
              {!isAdmin && (
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

                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-950 text-base leading-snug">{p.name}</h3>
                      {isAdmin && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEditForm(p)}
                            className="text-slate-300 hover:text-indigo-600 p-1 transition-colors"
                            title="Editar producto"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="text-slate-300 hover:text-red-500 p-1 transition-colors"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                        <AlertTriangle className="w-3 h-3" /> Suscripción vencida — pídele que renueve
                      </span>
                    )}
                  </div>

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
              <p className="text-xs text-slate-500 mt-1">Ingresa tu PIN para gestionar el directorio</p>
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
            <button type="submit" className="w-full bg-slate-950 text-white font-bold py-3 rounded-xl text-xs shadow-md">
              Ingresar al Panel
            </button>
          </form>
        </div>
      )}

      {formMode !== "closed" && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          {formStep === "payment" ? (
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 text-center">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
                <BadgeCheck className="w-7 h-7" />
              </div>
              <h3 className="font-black text-slate-950 text-lg">¡Ya casi! Activa tu producto</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Tu producto quedará visible en el directorio en cuanto confirmemos el pago de tu
                suscripción mensual. Elige tu método de pago:
              </p>
              <div className="space-y-2 pt-2">
                <a
                  href={LEMON_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> Pagar con Lemon Squeezy
                </a>
                <a
                  href={PAYPAL_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl text-xs transition-colors"
                >
                  <CreditCard className="w-4 h-4" /> Pagar con PayPal
                </a>
              </div>
              <button
                onClick={closeForm}
                className="text-[11px] text-slate-400 hover:text-slate-600 font-semibold pt-1"
              >
                Ya pagué / cerrar
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleFormSubmit}
              className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-black text-slate-950 text-lg">
                  {isReviewingPending
                    ? "Revisar Solicitud"
                    : editingId
                    ? "Editar Producto"
                    : formMode === "admin"
                    ? "Publicar Nuevo Producto"
                    : "Publicar mi Producto"}
                </h3>
                <button type="button" onClick={closeForm} className="bg-slate-100 p-2 rounded-full text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formMode === "public" && !editingId && (
                <p className="text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  Completa tus datos y en el siguiente paso te mostraremos cómo pagar tu suscripción
                  mensual. Tu producto se publicará en cuanto lo confirmemos.
                </p>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Producto / Oferta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Zapatillas Nike Air"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tu número de WhatsApp *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 8095551234 (con código de país si es posible)"
                    value={prodWhatsapp}
                    onChange={(e) => setProdWhatsapp(e.target.value)}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Los compradores harán clic en "Ir al Producto" y les abrirá un chat directo contigo en WhatsApp.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Precio ($) (Opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="49.99"
                      value={prodPrice}
                      onChange={(e) => setProdPrice(e.target.value)}
                      className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Precio Anterior (Opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="65.00"
                      value={prodOrigPrice}
                      onChange={(e) => setProdOrigPrice(e.target.value)}
                      className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={prodCat}
                    onChange={(e) => setProdCat(e.target.value)}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  >
                    {CATEGORIES.filter((c) => c !== "Todos").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                {formMode === "admin" && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Insignia Especial</label>
                      <select
                        value={prodBadge}
                        onChange={(e) => setProdBadge(e.target.value as any)}
                        className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                      >
                        <option value="NINGUNO">Ninguna</option>
                        <option value="DESTACADO">DESTACADO</option>
                        <option value="OFERTA">OFERTA</option>
                        <option value="POPULAR">POPULAR</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">Vence el</label>
                      <input
                        type="date"
                        value={prodExpires}
                        onChange={(e) => setProdExpires(e.target.value)}
                        className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Foto del producto (link de imagen)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={prodImg}
                    onChange={(e) => setProdImg(e.target.value)}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Sube tu foto a un servicio como Imgur o Postimages y pega aquí el link directo.
                    (Subida de archivos propia requiere conectar almacenamiento en el backend.)
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Descripción corta</label>
                  <textarea
                    rows={2}
                    placeholder="Escribe brevemente sobre el producto..."
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs resize-none"
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-slate-950 text-white font-bold py-3.5 rounded-2xl text-xs shadow-lg">
                {isReviewingPending
                  ? "Aprobar y Publicar"
                  : editingId
                  ? "Guardar Cambios"
                  : formMode === "admin"
                  ? "Publicar en el Directorio"
                  : "Continuar al Pago"}
              </button>
            </form>
          )}
        </div>
      )}

      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleSaveConfig} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4">
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
              {pinConfigError && <p className="text-[10px] text-red-500 font-bold">{pinConfigError}</p>}
            </div>
            <button type="submit" className="w-full bg-slate-950 text-white font-bold py-3 rounded-xl text-xs">
              Guardar Ajustes
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
