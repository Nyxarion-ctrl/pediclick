"use client";

import React, { useState, useEffect, useCallback, useId, useRef } from "react";
import { Fraunces, Archivo } from "next/font/google";
import {
  Search,
  ArrowUpRight,
  CheckCircle2,
  Lock,
  Unlock,
  Plus,
  Trash2,
  Pencil,
  Settings,
  X,
  KeyRound,
  AlertTriangle,
  Info,
  BadgeCheck,
  CreditCard,
  Copy,
  ImagePlus,
} from "lucide-react";
import { products as productsService } from "@/lib/products";
import type { ProductLink, ProductStatus } from "@/lib/types";

/* ─────────────────────────────────────────────────────────
   Sistema de diseño — PediClick
   Fondo blanco limpio, verde vibrante como color de acción
   (nod a WhatsApp sin copiarlo), serif solo en el logo.
   ───────────────────────────────────────────────────────── */
const C = {
  paper: "#FFFFFF",
  paperSoft: "#F6F7F6",
  surface: "#FFFFFF",
  ink: "#15171A",
  inkSoft: "#5B6066",
  inkFaint: "#8E9298",
  line: "#E6E8E5",
  lineStrong: "#D3D6D1",
  accent: "#14A76C",
  accentDeep: "#0F8A58",
  accentPale: "#E1F5EA",
  trust: "#2F6FED",
  trustPale: "#E5EDFE",
  highlight: "#D98C1D",
  highlightPale: "#FBEBD3",
  offer: "#DC4B3F",
  offerPale: "#FBE4E1",
};

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700", "900"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const CATEGORIES = ["Todos", "General", "Tecnología", "Ropa & Moda", "Accesorios", "Hogar"];

const BADGE_PRIORITY: Record<string, number> = {
  DESTACADO: 0,
  OFERTA: 1,
  POPULAR: 2,
  NINGUNO: 3,
};

const BADGE_META: Record<string, { label: string; color: string; pale: string }> = {
  DESTACADO: { label: "Destacado", color: C.highlight, pale: C.highlightPale },
  OFERTA: { label: "Oferta", color: C.offer, pale: C.offerPale },
  POPULAR: { label: "Popular", color: C.trust, pale: C.trustPale },
};

// PIN de acceso al modo administrador (verificación en el cliente).
// Es el PIN por defecto; desde "Ajustes del admin" se puede cambiar (queda guardado solo en ese navegador).
const ADMIN_PIN = "1491";
const SESSION_KEY = "pc_admin_session";
const PIN_STORAGE_KEY = "pc_admin_pin";

function currentAdminPin(): string {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) || ADMIN_PIN;
  } catch {
    return ADMIN_PIN;
  }
}

// TODO: reemplaza estos dos links por tus checkouts reales de suscripción mensual
const LEMON_CHECKOUT_URL = "https://tu-tienda.lemonsqueezy.com/checkout/buy/REEMPLAZA-ESTE-ID";
const PAYPAL_CHECKOUT_URL =
  "https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=REEMPLAZA-ESTE-ID";

function digitsOnly(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

function isExpired(product: ProductLink): boolean {
  if (!product.expiresAt) return false;
  return new Date(product.expiresAt).getTime() < Date.now();
}

// Placeholder propio (monograma) en vez de foto de stock genérica.
function initialsPlaceholder(name: string): string {
  const letter = (name?.trim()?.[0] || "P").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <rect width="400" height="400" fill="${C.paperSoft}"/>
    <text x="50%" y="55%" font-family="Georgia, 'Times New Roman', serif" font-size="168" fill="${C.ink}" fill-opacity="0.14" text-anchor="middle" dominant-baseline="middle">${letter}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Lee una foto del dispositivo y la reduce (máx. 640 px, JPEG) para que cargue rápido en el catálogo.
async function fileToCompressedDataUrl(file: File, maxSide = 640, quality = 0.82): Promise<string> {
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read"));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("decode"));
    el.src = source;
  });
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.fillStyle = "#FFFFFF"; // evita fondo negro en PNG con transparencia
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function sortProducts(list: ProductLink[]): ProductLink[] {
  return [...list].sort((a, b) => {
    const aExpired = isExpired(a) ? 1 : 0;
    const bExpired = isExpired(b) ? 1 : 0;
    if (aExpired !== bExpired) return aExpired - bExpired;
    const aPriority = BADGE_PRIORITY[a.badge || "NINGUNO"];
    const bPriority = BADGE_PRIORITY[b.badge || "NINGUNO"];
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });
}

/**
 * Marca propia — monograma "P" construido a propósito para PediClick:
 * el asta es la letra, el "bowl" es un punto de click sólido (no un
 * aro genérico), con una mira concéntrica que remite al gesto de
 * "clickear para pedir". Degradado sutil de dos tonos del propio verde
 * de marca + sombra teñida en vez de una sombra negra genérica.
 */
function Mark({ size = 40 }: { size?: number }) {
  const gradId = `pc-mark-${useId()}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      style={{ filter: "drop-shadow(0 3px 6px rgba(15,138,88,0.30))" }}
    >
      <defs>
        <linearGradient id={gradId} x1="3" y1="2" x2="29" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={C.accentDeep} />
          <stop offset="1" stopColor={C.accent} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="30" height="30" rx="9" fill={`url(#${gradId})`} />
      <rect x="1.6" y="1.6" width="28.8" height="28.8" rx="8.4" stroke="#FFFFFF" strokeOpacity="0.16" />
      <rect x="11" y="8" width="4" height="17" rx="2" fill="#FFFFFF" />
      <circle cx="18.6" cy="12.6" r="5.4" fill="#FFFFFF" />
      <circle cx="18.6" cy="12.6" r="2.3" fill="none" stroke={C.accentDeep} strokeOpacity="0.45" strokeWidth="1" />
    </svg>
  );
}

type FormMode = "closed" | "public" | "admin";
type FormStep = "form" | "payment";

export default function Home() {
  const [products, setProducts] = useState<ProductLink[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [formStep, setFormStep] = useState<FormStep>("form");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [sellerPhone, setSellerPhone] = useState("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTab, setPaymentTab] = useState<"DOP" | "USD">("DOP");

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
  const [submitting, setSubmitting] = useState(false);
  const [imgProcessing, setImgProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const data = await productsService.getAll();
      setProducts(data);
      setLoadError(null);
    } catch (err) {
      console.error(err);
      setLoadError("No se pudo cargar el directorio. Intenta de nuevo en un momento.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshProducts();
      setLoading(false);
    })();
  }, [refreshProducts]);

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

  // Restaura la sesión de admin dentro de la misma pestaña (sobrevive a recargar la página).
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setIsAdmin(true);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  // Bloquea el scroll del fondo mientras hay un modal abierto.
  const anyModalOpen = formMode !== "closed" || isAdminModalOpen || isConfigOpen || isPaymentModalOpen;
  useEffect(() => {
    if (!anyModalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [anyModalOpen]);

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
    // El monograma automático no es una foto real: se deja vacío para que se regenere con el nombre.
    setProdImg(product.image.startsWith("data:image/svg+xml") ? "" : product.image);
    setProdExpires(product.expiresAt ?? "");
    setFormMode("admin");
    setFormStep("form");
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const whatsappDigits = digitsOnly(prodWhatsapp);
    if (!prodName || whatsappDigits.length < 8) return;

    const priceText = prodPrice ? `$${prodPrice}` : "consultar";
    const message = encodeURIComponent(
      `¡Hola! Vi tu producto "${prodName}" en PediClick por ${priceText} y me interesa comprarlo.`
    );
    const targetUrl = `https://wa.me/${whatsappDigits}?text=${message}`;

    setSubmitting(true);

    try {
      if (editingId) {
        const existing = products.find((p) => p.id === editingId);
        const nextStatus: ProductStatus =
          existing?.status === "pending" && isAdmin ? "approved" : existing?.status ?? "approved";

        await productsService.update(editingId, {
          name: prodName,
          whatsapp: whatsappDigits,
          targetUrl,
          price: prodPrice ? parseFloat(prodPrice) : undefined,
          originalPrice: prodOrigPrice ? parseFloat(prodOrigPrice) : undefined,
          category: prodCat,
          badge: prodBadge,
          description: prodDesc || "Sin descripción corta.",
          image: prodImg || initialsPlaceholder(prodName),
          expiresAt: prodExpires || undefined,
          status: nextStatus,
        });
        await refreshProducts();
        showToast(
          nextStatus === "approved" && existing?.status === "pending"
            ? "Solicitud aprobada y publicada"
            : "Cambios guardados"
        );
        closeForm();
        return;
      }

      await productsService.create({
        name: prodName,
        whatsapp: whatsappDigits,
        targetUrl,
        price: prodPrice ? parseFloat(prodPrice) : undefined,
        originalPrice: prodOrigPrice ? parseFloat(prodOrigPrice) : undefined,
        category: prodCat,
        badge: formMode === "admin" ? prodBadge : "NINGUNO",
        description: prodDesc || "Sin descripción corta.",
        image: prodImg || initialsPlaceholder(prodName),
        expiresAt: formMode === "admin" ? prodExpires || undefined : undefined,
        status: formMode === "admin" ? "approved" : "pending",
      });
      await refreshProducts();

      if (formMode === "public") {
        closeForm();
        setIsPaymentModalOpen(true);
      } else {
        showToast("Producto publicado");
        closeForm();
      }
    } catch (err) {
      console.error(err);
      showToast("Ocurrió un error al guardar. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectPending = async (id: string) => {
    if (!confirm("¿Rechazar y eliminar esta solicitud?")) return;
    try {
      await productsService.remove(id);
      await refreshProducts();
      showToast("Solicitud rechazada");
    } catch (err) {
      console.error(err);
      showToast("No se pudo rechazar la solicitud.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Deseas eliminar este producto del directorio?")) return;
    try {
      await productsService.remove(id);
      await refreshProducts();
      showToast("Producto eliminado");
    } catch (err) {
      console.error(err);
      showToast("No se pudo eliminar el producto.");
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setPinConfigError("");
    const candidate = newPin.trim();
    if (candidate.length < 4 || candidate.length > 8) {
      setPinConfigError("El PIN debe tener entre 4 y 8 caracteres.");
      return;
    }
    if (candidate !== newPinConfirm.trim()) {
      setPinConfigError("Los dos PIN no coinciden.");
      return;
    }
    try {
      localStorage.setItem(PIN_STORAGE_KEY, candidate);
    } catch {
      setPinConfigError("Tu navegador no permite guardar el PIN.");
      return;
    }
    setNewPin("");
    setNewPinConfirm("");
    setIsConfigOpen(false);
    showToast("PIN actualizado en este navegador");
  };

  // Verificación directa en el cliente, igual que en admin_page.tsx.
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === currentAdminPin()) {
      setIsAdmin(true);
      setIsAdminModalOpen(false);
      setInputPin("");
      setPinError(false);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* almacenamiento no disponible */
      }
      showToast("Modo administrador activado");
    } else {
      setPinError(true);
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* almacenamiento no disponible */
    }
    showToast("Sesión de administrador cerrada");
  };

  const handlePickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Elige un archivo de imagen (JPG o PNG).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast("La imagen pesa demasiado (máximo 10 MB).");
      return;
    }
    setImgProcessing(true);
    try {
      setProdImg(await fileToCompressedDataUrl(file));
    } catch {
      showToast("No se pudo procesar la imagen. Prueba con otra.");
    } finally {
      setImgProcessing(false);
    }
  };

  const copyToClipboard = (value: string, field: string) => {
    navigator.clipboard?.writeText(value).then(() => {
      setCopiedField(field);
      window.setTimeout(() => setCopiedField(null), 1500);
    });
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

  const activeCount = products.filter((p) => p.status === "approved" && !isExpired(p)).length;
  const categoryCount = CATEGORIES.length - 1;

  if (loading) {
    return (
      <div
        className={`${archivo.variable} min-h-screen`}
        style={{ background: C.paper, fontFamily: "var(--font-body)" }}
        role="status"
        aria-label="Cargando directorio"
      >
        <div className="max-w-3xl mx-auto px-5 pt-10 sm:pt-14 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-[38px] h-[38px] rounded-[11px]" style={{ background: C.line }} />
            <div className="space-y-1.5">
              <div className="h-4 w-24 rounded" style={{ background: C.line }} />
              <div className="h-2.5 w-32 rounded" style={{ background: C.paperSoft }} />
            </div>
          </div>
          <div className="mt-8 h-10 sm:h-12 w-4/5 max-w-md rounded-lg" style={{ background: C.line }} />
          <div className="mt-3 h-4 w-3/5 max-w-sm rounded" style={{ background: C.paperSoft }} />
          <div className="mt-8 h-[50px] rounded-xl" style={{ background: C.paperSoft }} />
          <div className="mt-10 border-t" style={{ borderColor: C.line }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="py-5 flex gap-4 border-b" style={{ borderColor: C.line }}>
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl shrink-0" style={{ background: C.paperSoft }} />
                <div className="flex-1 space-y-2.5 pt-1">
                  <div className="h-4 w-2/3 rounded" style={{ background: C.line }} />
                  <div className="h-3 w-1/4 rounded" style={{ background: C.paperSoft }} />
                  <div className="h-3 w-4/5 rounded" style={{ background: C.paperSoft }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const editingExisting = editingId ? products.find((p) => p.id === editingId) : undefined;
  const isReviewingPending = isAdmin && editingExisting?.status === "pending";

  return (
    <div
      className={`${fraunces.variable} ${archivo.variable} min-h-screen pb-24`}
      style={{ background: C.paper, color: C.ink, fontFamily: "var(--font-body)" }}
    >
      <style jsx global>{`
        @keyframes pc-toast-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes pc-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes pc-pop-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pc-step-in {
          from { opacity: 0; transform: translateX(14px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .pc-anim { animation: none !important; }
        }
      `}</style>
      {toast && (
        <div
          className="fixed top-5 left-1/2 z-[60] text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg pc-anim animate-[pc-toast-in_0.2s_ease-out_forwards]" role="status"
          style={{ background: C.ink, color: C.paper }}
        >
          {toast}
        </div>
      )}

      {/* ── Encabezado / índice del catálogo ───────────────────────── */}
      <header className="max-w-3xl mx-auto px-5 pt-10 sm:pt-14">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mark size={38} />
            <div className="leading-none">
              <div
                className="text-[20px] font-semibold"
                style={{ fontFamily: "var(--font-display)" }}
              >
                PediClick
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: C.inkFaint }}>
                Directorio de vendedores
              </div>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-2 rounded-full border transition-colors border-[#E6E8E5] text-[#5B6066] hover:bg-[#F6F7F6] hover:text-[#15171A]"
              title="Configuración" aria-label="Configuración del administrador"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>

        <h1 className="mt-8 text-[34px] sm:text-[46px] leading-[1.05] font-extrabold tracking-tight max-w-xl">
          Compra directo, sin intermediarios.
        </h1>
        <p className="mt-3 text-[15px] max-w-md leading-relaxed" style={{ color: C.inkSoft }}>
          Un catálogo con cientos de vendedores independientes. Encuentra lo que buscas y
          escríbele al vendedor por WhatsApp — sin cuentas, sin carritos.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]" style={{ color: C.inkSoft }}>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: C.accent }} />
            catálogo en vivo
          </span>
          <span>{activeCount} productos activos</span>
          <span>{categoryCount} categorías</span>
        </div>

        {loadError && (
          <div
            className="mt-5 text-xs font-medium rounded-xl p-3 flex items-center gap-2 border"
            style={{ background: C.offerPale, borderColor: C.offer, color: C.offer }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" /> {loadError}
          </div>
        )}

        {/* ── Búsqueda + acción principal ──────────────────────────── */}
        <div className="mt-8 flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2" style={{ color: C.inkFaint }} />
            <input
              type="text"
              placeholder="Buscar por nombre, categoría o descripción"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm outline-none transition-colors focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
              style={{ background: C.surface, borderColor: C.line, color: C.ink }}
            />
          </div>
          <button
            onClick={openCreateForm}
            className="px-5 py-3.5 rounded-xl font-semibold text-[13px] flex items-center justify-center gap-1.5 transition-colors shrink-0 bg-[#15171A] hover:bg-[#262A2E] text-white active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            {isAdmin ? "Publicar enlace" : "Publicar mi producto"}
          </button>
        </div>

        {/* ── Categorías ───────────────────────────────────────────── */}
        <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors border ${
                  active
                    ? "bg-[#14A76C] border-[#14A76C] text-white hover:bg-[#0F8A58]"
                    : "bg-[#F6F7F6] border-[#E6E8E5] text-[#5B6066] hover:bg-[#E6E8E5] hover:text-[#15171A]"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5">
        {/* ── Pendientes de aprobación ─────────────────────────────── */}
        {isAdmin && pendingProducts.length > 0 && (
          <div className="mt-8 rounded-2xl border p-4" style={{ borderColor: C.highlight, background: C.highlightPale }}>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4" style={{ color: C.highlight }} />
              <h2 className="font-semibold text-[13px]" style={{ color: C.highlight }}>
                Pendientes de aprobación ({pendingProducts.length})
              </h2>
            </div>
            <div className="space-y-2">
              {pendingProducts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl p-3 flex items-center justify-between gap-3"
                  style={{ background: C.surface }}
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: C.inkFaint }}>
                      WhatsApp {p.whatsapp} — {p.category}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => openEditForm(p)}
                      className="text-[11px] font-semibold px-3 py-2 rounded-lg transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white"
                    >
                      Revisar
                    </button>
                    <button
                      onClick={() => handleRejectPending(p.id)}
                      className="text-[11px] font-semibold px-3 py-2 rounded-lg border transition-colors border-[#E6E8E5] text-[#5B6066] hover:bg-[#F6F7F6] hover:border-[#D3D6D1]"
                    >
                      Rechazar
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10px] mt-3" style={{ color: C.highlight }}>
              Verifica el pago en tu panel de Lemon Squeezy o PayPal antes de aprobar.
            </p>
          </div>
        )}

        {/* ── Listado del catálogo ─────────────────────────────────── */}
        <div className="mt-10">
          <div className="flex items-baseline justify-between mb-1">
            <h2 className="text-[13px] font-semibold" style={{ color: C.inkSoft }}>
              Productos
            </h2>
            <span className="text-[12px]" style={{ color: C.inkFaint }}>
              {filteredProducts.length} resultados
            </span>
          </div>

          {filteredProducts.length === 0 ? (
            <div
              className="text-center py-16 rounded-2xl border border-dashed mt-4"
              style={{ borderColor: C.lineStrong }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: C.paperSoft, color: C.inkFaint }}
              >
                <Info className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-[15px]">Directorio en actualización</h3>
              <p className="text-[13px] max-w-xs mx-auto mt-1 leading-relaxed" style={{ color: C.inkSoft }}>
                {isAdmin
                  ? "Aún no hay productos publicados. Puedes agregar uno directamente o esperar solicitudes."
                  : "No hay productos disponibles en esta sección por el momento."}
              </p>
              {!isAdmin && (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-[12px] border transition-colors border-[#E6E8E5] text-[#5B6066] hover:bg-[#F6F7F6] hover:border-[#D3D6D1]"
                >
                  <Lock className="w-3.5 h-3.5" /> ¿Eres el administrador? Accede con tu PIN
                </button>
              )}
            </div>
          ) : (
            <div className="mt-3 border-t" style={{ borderColor: C.line }}>
              {filteredProducts.map((p, i) => {
                const expired = isExpired(p);
                const badge = p.badge && p.badge !== "NINGUNO" ? BADGE_META[p.badge] : null;
                return (
                  <div
                    key={p.id}
                    className="group relative py-5 px-3 -mx-3 rounded-xl flex flex-col sm:flex-row gap-4 sm:items-start transition-colors hover:bg-[#F6F7F6] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-px after:bg-[#E6E8E5]"
                    style={{ opacity: expired ? 0.55 : 1 }}
                  >
                    <div className="flex gap-3 sm:gap-4 flex-1 min-w-0">
                      <span
                        className="hidden sm:block text-[12px] font-medium tabular-nums pt-1 w-6 shrink-0"
                        style={{ color: C.inkFaint }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <div
                        className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden shrink-0"
                        style={{ background: C.paperSoft }}
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = initialsPlaceholder(p.name);
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-[15px] sm:text-[16px] leading-snug">{p.name}</h3>
                          {isAdmin && (
                            <div className="flex items-center gap-0.5 shrink-0 -mt-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
                              <button
                                onClick={() => openEditForm(p)}
                                className="p-2 sm:p-1.5 rounded-lg transition-colors text-[#8E9298] hover:bg-[#E1F5EA] hover:text-[#0F8A58]"
                                title="Editar producto"
                                aria-label={`Editar ${p.name}`}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                className="p-2 sm:p-1.5 rounded-lg transition-colors text-[#8E9298] hover:bg-[#FBE4E1] hover:text-[#DC4B3F]"
                                title="Eliminar del catálogo"
                                aria-label={`Eliminar ${p.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[12px]" style={{ color: C.inkFaint }}>
                            {p.category}
                          </span>
                          {badge && (
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                              style={{ color: badge.color, borderColor: badge.color, background: badge.pale }}
                            >
                              {badge.label}
                            </span>
                          )}
                        </div>

                        <p className="text-[13px] mt-1.5 leading-relaxed line-clamp-2" style={{ color: C.inkSoft }}>
                          {p.description}
                        </p>

                        {p.price && (
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="font-semibold text-[15px]">${p.price.toFixed(2)}</span>
                            {p.originalPrice && p.originalPrice > p.price && (
                              <span className="text-[12px] line-through" style={{ color: C.inkFaint }}>
                                ${p.originalPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}

                        {isAdmin && expired && (
                          <span
                            className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                            style={{ color: C.offer, borderColor: C.offer, background: C.offerPale }}
                          >
                            <AlertTriangle className="w-3 h-3" /> Suscripción vencida
                          </span>
                        )}
                      </div>
                    </div>

                    <a
                      href={p.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2.5 rounded-lg font-semibold text-[12px] flex items-center justify-center gap-1.5 transition-colors shrink-0 bg-[#14A76C] hover:bg-[#0F8A58] text-white active:scale-[0.98]"
                    >
                      Escribir por WhatsApp <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <footer className="mt-16 text-center border-t pt-8 pb-4 text-[12px] flex flex-col items-center gap-2" style={{ borderColor: C.line, color: C.inkFaint }}>
          <p className="font-medium" style={{ color: C.inkSoft }}>PediClick Directory © 2026</p>
          <button
            onClick={() => {
              if (isAdmin) handleAdminLogout();
              else setIsAdminModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-[11px] transition-opacity mt-1 hover:opacity-70"
          >
            {isAdmin ? (
              <>
                <Unlock className="w-3 h-3" style={{ color: C.trust }} />
                <span className="font-semibold" style={{ color: C.trust }}>Modo admin activo — cerrar sesión</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3" />
                <span>Acceso dueño / admin</span>
              </>
            )}
          </button>
        </footer>
      </main>

      {/* ── Modal: acceso admin ────────────────────────────────────── */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pc-anim animate-[pc-fade-in_0.18s_ease-out]" style={{ background: "rgba(21,23,26,0.55)" }}>
          <form
            onSubmit={handleAdminLogin}
            role="dialog" aria-modal="true" aria-label="Acceso de administrador" className="w-full max-w-xs rounded-2xl p-6 shadow-xl space-y-4 text-center relative pc-anim animate-[pc-pop-in_0.22s_ease-out]"
            style={{ background: C.surface }}
          >
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(false)}
              aria-label="Cerrar" className="absolute top-4 right-4 p-1.5 rounded-full transition-colors bg-[#F6F7F6] text-[#5B6066] hover:bg-[#E6E8E5] hover:text-[#15171A]"
            >
              <X className="w-4 h-4" />
            </button>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mx-auto"
              style={{ background: C.paperSoft, color: C.ink }}
            >
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-[15px]">Modo administrador</h3>
              <p className="text-[12px] mt-1" style={{ color: C.inkSoft }}>Ingresa tu PIN para gestionar el directorio</p>
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
                className="w-full text-center tracking-widest px-3.5 py-3 rounded-xl border text-sm font-semibold outline-none focus:ring-2 focus:ring-[#14A76C]/20"
                style={{
                  background: C.paperSoft,
                  borderColor: pinError ? C.offer : C.line,
                  color: C.ink,
                }}
              />
              {pinError && <p className="text-[11px] font-medium mt-1" style={{ color: C.offer }} role="alert">PIN incorrecto</p>}
            </div>
            <button
              type="submit"
              className="w-full font-semibold py-3 rounded-xl text-[12px] transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white active:scale-[0.98]"
            >
              Ingresar al panel
            </button>
          </form>
        </div>
      )}

      {/* ── Formulario: crear / editar producto ────────────────────── */}
      {formMode !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pc-anim animate-[pc-fade-in_0.18s_ease-out]" style={{ background: "rgba(21,23,26,0.55)" }}>
          {formStep === "payment" ? (
            <div
              className="w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-xl space-y-4 text-center"
              style={{ background: C.surface }}
            >
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />
                  <span className="w-4 h-[2px] rounded-full" style={{ background: C.accent }} />
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
                  Paso 2 de 2 — pago
                </span>
              </div>
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mx-auto"
                style={{ background: C.accentPale, color: C.accent }}
              >
                <BadgeCheck className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-[17px]">
                Ya casi — activa tu producto
              </h3>
              <p className="text-[12px] leading-relaxed" style={{ color: C.inkSoft }}>
                Tu producto quedará visible en el directorio en cuanto confirmemos el pago de tu
                suscripción mensual. Elige tu método de pago:
              </p>
              <div className="space-y-2 pt-2">
                <a
                  href={LEMON_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-[12px] transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white"
                >
                  <CreditCard className="w-4 h-4" /> Pagar con Lemon Squeezy
                </a>
                <a
                  href={PAYPAL_CHECKOUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl text-[12px] border transition-colors border-[#E6E8E5] text-[#15171A] hover:bg-[#F6F7F6]"
                >
                  <CreditCard className="w-4 h-4" /> Pagar con PayPal
                </a>
              </div>
              <button onClick={closeForm} className="text-[11px] font-medium pt-1" style={{ color: C.inkFaint }}>
                Ya pagué / cerrar
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleFormSubmit}
              role="dialog" aria-modal="true" aria-label="Formulario de producto" className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto pc-anim animate-[pc-pop-in_0.22s_ease-out]"
              style={{ background: C.surface }}
            >
              <div
                className="flex items-center justify-between pb-3 border-b sticky top-0 z-10 -mx-6 -mt-6 px-6 pt-6"
                style={{ borderColor: C.line, background: C.surface }}
              >
                <div>
                  <h3 className="font-bold text-[16px]">
                    {isReviewingPending
                      ? "Revisar solicitud"
                      : editingId
                      ? "Editar producto"
                      : formMode === "admin"
                      ? "Publicar nuevo producto"
                      : "Publicar mi producto"}
                  </h3>
                  {formMode === "public" && !editingId && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />
                        <span className="w-4 h-[2px] rounded-full" style={{ background: C.line }} />
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.line }} />
                      </div>
                      <span className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
                        Paso 1 de 2 — tus datos
                      </span>
                    </div>
                  )}
                </div>
                <button type="button" onClick={closeForm} aria-label="Cerrar" className="p-2 rounded-full transition-colors bg-[#F6F7F6] text-[#5B6066] hover:bg-[#E6E8E5] hover:text-[#15171A] shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {formMode === "public" && !editingId && (
                <div className="rounded-xl p-3 flex gap-2.5 items-start" style={{ background: C.accentPale, borderLeft: `3px solid ${C.accent}` }}>
                  <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: C.accentDeep }} />
                  <p className="text-[11px] leading-relaxed" style={{ color: C.accentDeep }}>
                    Completa tus datos y en el siguiente paso te mostraremos cómo pagar tu suscripción
                    mensual. Tu producto se publicará en cuanto lo confirmemos.
                  </p>
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold mb-1.5" style={{ color: C.inkFaint }}>
                  Así se verá en el catálogo
                </p>
                <FormPreviewCard
                  name={prodName}
                  category={prodCat}
                  description={prodDesc}
                  price={prodPrice}
                  originalPrice={prodOrigPrice}
                  badge={prodBadge}
                  image={prodImg}
                />
              </div>

              <div>
                <Section title="Producto">
                  <Field label="Nombre del producto / oferta *">
                    <input
                      type="text"
                      required
                      placeholder="Ej. Zapatillas Nike Air"
                      value={prodName}
                      onChange={(e) => setProdName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                      style={{ background: C.paperSoft, borderColor: C.line }}
                    />
                  </Field>

                  <Field label="Categoría">
                    <select
                      value={prodCat}
                      onChange={(e) => setProdCat(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                      style={{ background: C.paperSoft, borderColor: C.line }}
                    >
                      {CATEGORIES.filter((c) => c !== "Todos").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Descripción corta">
                    <textarea
                      rows={2}
                      placeholder="Escribe brevemente sobre el producto..."
                      value={prodDesc}
                      onChange={(e) => setProdDesc(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none resize-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                      style={{ background: C.paperSoft, borderColor: C.line }}
                    />
                  </Field>
                </Section>

                <Section title="Precio">
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Precio ($) (opcional)">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="49.99"
                        value={prodPrice}
                        onChange={(e) => setProdPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                        style={{ background: C.paperSoft, borderColor: C.line }}
                      />
                    </Field>
                    <Field label="Precio anterior (opcional)">
                      <input
                        type="number"
                        step="0.01"
                        placeholder="65.00"
                        value={prodOrigPrice}
                        onChange={(e) => setProdOrigPrice(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                        style={{ background: C.paperSoft, borderColor: C.line }}
                      />
                    </Field>
                  </div>
                </Section>

                <Section title="Contacto">
                  <Field label="Tu número de WhatsApp *" hint='Los compradores harán clic en "Escribir por WhatsApp" y les abrirá un chat directo contigo.'>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 8095551234 (con código de país si es posible)"
                      value={prodWhatsapp}
                      onChange={(e) => setProdWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-mono outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                      style={{ background: C.paperSoft, borderColor: C.line }}
                    />
                  </Field>
                </Section>

                <Section title="Foto">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    tabIndex={-1}
                    onChange={handlePickImage}
                  />
                  {prodImg.startsWith("data:image/jpeg") ? (
                    <div
                      className="flex items-center gap-3 rounded-xl border p-2.5"
                      style={{ borderColor: C.line, background: C.paperSoft }}
                    >
                      <img
                        src={prodImg}
                        alt="Foto del producto"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = initialsPlaceholder(prodName || "Producto");
                        }}
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold">Foto lista</p>
                        <p className="text-[10px]" style={{ color: C.inkFaint }}>
                          La ajustamos automáticamente para que cargue rápido.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors border-[#E6E8E5] text-[#5B6066] hover:bg-white"
                      >
                        Cambiar
                      </button>
                      <button
                        type="button"
                        onClick={() => setProdImg("")}
                        className="text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-colors text-[#DC4B3F] hover:bg-[#FBE4E1]"
                      >
                        Quitar
                      </button>
                    </div>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={imgProcessing}
                        className="w-full flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed py-5 transition-colors border-[#D3D6D1] bg-[#F6F7F6] hover:bg-[#E1F5EA] hover:border-[#14A76C] disabled:opacity-60"
                      >
                        <ImagePlus className="w-5 h-5" style={{ color: C.accentDeep }} />
                        <span className="text-[12px] font-semibold">
                          {imgProcessing ? "Procesando foto…" : "Subir foto desde tu dispositivo"}
                        </span>
                        <span className="text-[10px]" style={{ color: C.inkFaint }}>
                          JPG o PNG. La ajustamos automáticamente.
                        </span>
                      </button>
                      <Field label="O pega el link de una foto (opcional)" hint="Si no subes nada, usamos un ícono con la inicial de tu producto.">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={prodImg}
                          onChange={(e) => setProdImg(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                          style={{ background: C.paperSoft, borderColor: C.line }}
                        />
                      </Field>
                    </>
                  )}
                </Section>

                {formMode === "admin" && (
                  <Section title="Configuración de administrador">
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Insignia especial">
                        <select
                          value={prodBadge}
                          onChange={(e) => setProdBadge(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                          style={{ background: C.paperSoft, borderColor: C.line }}
                        >
                          <option value="NINGUNO">Ninguna</option>
                          <option value="DESTACADO">Destacado</option>
                          <option value="OFERTA">Oferta</option>
                          <option value="POPULAR">Popular</option>
                        </select>
                      </Field>
                      <Field label="Vence el">
                        <input
                          type="date"
                          value={prodExpires}
                          onChange={(e) => setProdExpires(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                          style={{ background: C.paperSoft, borderColor: C.line }}
                        />
                      </Field>
                    </div>
                  </Section>
                )}
              </div>

              <div
                className="sticky bottom-0 z-10 -mx-6 -mb-6 px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t"
                style={{ borderColor: C.line, background: C.surface }}
              >
              <button
                type="submit"
                disabled={submitting}
                className="w-full font-semibold py-3.5 rounded-xl text-[13px] shadow-sm disabled:opacity-60 transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white active:scale-[0.98]"
              >
                {submitting
                  ? "Guardando…"
                  : isReviewingPending
                  ? "Aprobar y publicar"
                  : editingId
                  ? "Guardar cambios"
                  : formMode === "admin"
                  ? "Publicar en el directorio"
                  : "Continuar al pago"}
              </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── Modal: ajustes admin (PIN) ─────────────────────────────── */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pc-anim animate-[pc-fade-in_0.18s_ease-out]" style={{ background: "rgba(21,23,26,0.55)" }}>
          <form
            onSubmit={handleSaveConfig}
            role="dialog" aria-modal="true" aria-label="Ajustes del administrador" className="w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4 pc-anim animate-[pc-pop-in_0.22s_ease-out]"
            style={{ background: C.surface }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: C.line }}>
              <h3 className="font-semibold text-[15px]">Ajustes del admin</h3>
              <button type="button" onClick={() => setIsConfigOpen(false)} aria-label="Cerrar" className="p-1.5 rounded-full transition-colors bg-[#F6F7F6] text-[#5B6066] hover:bg-[#E6E8E5] hover:text-[#15171A]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Nuevo PIN de acceso">
                <input
                  type="password"
                  placeholder="Nuevo PIN (4 a 8 caracteres)"
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-mono outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                  style={{ background: C.paperSoft, borderColor: C.line }}
                />
              </Field>
              <Field label="Confirmar nuevo PIN">
                <input
                  type="password"
                  placeholder="Repite el PIN"
                  maxLength={8}
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-mono outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                  style={{ background: C.paperSoft, borderColor: C.line }}
                />
              </Field>
              <p className="text-[10px]" style={{ color: C.inkFaint }}>
                El nuevo PIN se guarda solo en este navegador. En otros dispositivos seguirá valiendo el PIN por defecto.
              </p>
              {pinConfigError && <p className="text-[11px] font-medium" style={{ color: C.offer }} role="alert">{pinConfigError}</p>}
            </div>
            <button type="submit" className="w-full font-semibold py-3 rounded-xl text-[13px] transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white active:scale-[0.98]">
              Guardar ajustes
            </button>
          </form>
        </div>
      )}

      {/* ── Modal: cómo pagar la suscripción ───────────────────────── */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pc-anim animate-[pc-fade-in_0.18s_ease-out]" style={{ background: "rgba(21,23,26,0.55)" }}>
          <div role="dialog" aria-modal="true" aria-label="Cómo activar tu producto" className="w-full max-w-md rounded-2xl p-6 shadow-xl space-y-4 pc-anim animate-[pc-pop-in_0.22s_ease-out]" style={{ background: C.surface }}>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />
                <span className="w-4 h-[2px] rounded-full" style={{ background: C.accent }} />
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.accent }} />
              </div>
              <span className="text-[11px] font-medium" style={{ color: C.inkFaint }}>
                Paso 2 de 2 — pago
              </span>
            </div>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: C.accentPale, color: C.accent }}
            >
              <BadgeCheck className="w-6 h-6" />
            </div>
            <h3 className="text-[18px] font-bold">
              Producto creado
            </h3>
            <p className="text-[13px]" style={{ color: C.inkSoft }}>
              Para activar la publicación en el directorio principal, realiza el pago según tu moneda:
            </p>

            <div className="flex border-b" style={{ borderColor: C.line }}>
              {(["DOP", "USD"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setPaymentTab(tab)}
                  className="flex-1 py-2 font-semibold text-[13px] border-b-2 transition-colors hover:bg-[#F6F7F6]"
                  style={{
                    borderColor: paymentTab === tab ? C.accent : "transparent",
                    color: paymentTab === tab ? C.ink : C.inkFaint,
                  }}
                >
                  {tab === "DOP" ? "Rep. Dominicana (DOP)" : "Internacional (USD)"}
                </button>
              ))}
            </div>

            {paymentTab === "DOP" && (
              <div className="space-y-2">
                <PaymentRow label="Banco BHD" value="0000000000" onCopy={copyToClipboard} copied={copiedField === "bhd"} field="bhd" />
                <PaymentRow label="Banreservas" value="0000000000" onCopy={copyToClipboard} copied={copiedField === "banreservas"} field="banreservas" />
                <PaymentRow label="Banco Popular" value="0000000000" onCopy={copyToClipboard} copied={copiedField === "popular"} field="popular" />
                <p className="pt-1 text-[11px]" style={{ color: C.inkFaint }}>
                  Envía tu comprobante por WhatsApp para confirmar la activación.
                </p>
              </div>
            )}

            {paymentTab === "USD" && (
              <div className="space-y-2">
                <PaymentRow label="PayPal.me" value="paypal.me/tuusuario" onCopy={copyToClipboard} copied={copiedField === "paypal"} field="paypal" />
                <PaymentRow label="Binance Pay ID" value="00000000" onCopy={copyToClipboard} copied={copiedField === "binance"} field="binance" />
                <PaymentRow label="USDT (TRC20)" value="TXXXXXXXXXXXXXXXXXXXXXX" onCopy={copyToClipboard} copied={copiedField === "usdt"} field="usdt" />
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsPaymentModalOpen(false)}
              className="w-full font-semibold py-3 rounded-xl text-[13px] transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white active:scale-[0.98]"
            >
              Entendido, cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pt-4 mt-4 border-t first:mt-0 first:pt-0 first:border-t-0" style={{ borderColor: C.line }}>
      <p className="text-[11px] font-semibold mb-2.5" style={{ color: C.inkFaint }}>
        {title}
      </p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FormPreviewCard({
  name,
  category,
  description,
  price,
  originalPrice,
  badge,
  image,
}: {
  name: string;
  category: string;
  description: string;
  price: string;
  originalPrice: string;
  badge: string;
  image: string;
}) {
  const badgeMeta = badge && badge !== "NINGUNO" ? BADGE_META[badge] : null;
  const displayName = name.trim() || "Nombre del producto";
  const numericPrice = parseFloat(price);
  const numericOriginal = parseFloat(originalPrice);

  return (
    <div
      className="rounded-xl border p-3 flex gap-3 items-start"
      style={{ borderColor: C.line, background: C.paperSoft }}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ background: C.surface }}>
        <img
          src={image || initialsPlaceholder(name || "Producto")}
          alt=""
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = initialsPlaceholder(name || "Producto");
          }}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="font-semibold text-[13px] truncate" style={{ color: name.trim() ? C.ink : C.inkFaint }}>
            {displayName}
          </p>
          {badgeMeta && (
            <span
              className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border shrink-0"
              style={{ color: badgeMeta.color, borderColor: badgeMeta.color, background: badgeMeta.pale }}
            >
              {badgeMeta.label}
            </span>
          )}
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: C.inkFaint }}>
          {category}
        </p>
        {description.trim() && (
          <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: C.inkSoft }}>
            {description}
          </p>
        )}
        {!isNaN(numericPrice) && (
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="font-semibold text-[13px]">${numericPrice.toFixed(2)}</span>
            {!isNaN(numericOriginal) && numericOriginal > numericPrice && (
              <span className="text-[10px] line-through" style={{ color: C.inkFaint }}>
                ${numericOriginal.toFixed(2)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-[12px] font-semibold block mb-1" style={{ color: C.inkSoft }}>
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-[10px] mt-1" style={{ color: C.inkFaint }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function PaymentRow({
  label,
  value,
  field,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  field: string;
  copied: boolean;
  onCopy: (value: string, field: string) => void;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
      style={{ borderColor: C.line, background: C.paperSoft }}
    >
      <div className="min-w-0">
        <p className="text-[11px] font-semibold" style={{ color: C.inkSoft }}>
          {label}
        </p>
        <p className="text-[13px] font-mono truncate">{value}</p>
      </div>
      <button
        type="button"
        onClick={() => onCopy(value, field)}
        className="shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors hover:bg-[#EEF0EA]"
        style={{ borderColor: C.line, color: copied ? C.accent : C.inkSoft }}
      >
        <Copy className="w-3 h-3" /> {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
