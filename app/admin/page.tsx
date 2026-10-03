"use client";

import React, { useState, useEffect, useCallback, useId, useRef } from "react";
import { Fraunces, Archivo } from "next/font/google";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Settings,
  KeyRound,
  AlertTriangle,
  Info,
  LogOut,
  ImagePlus,
  ArrowUpRight,
} from "lucide-react";
import { products as productsService } from "@/lib/products";
import type { ProductLink, ProductStatus } from "@/lib/types";

/* ─────────────────────────────────────────────────────────
   Mismo sistema de diseño, mismas constantes de PIN/sesión y
   mismas utilidades que /page.tsx — comparten localStorage y
   sessionStorage a propósito, así que iniciar sesión o cambiar
   el PIN desde cualquiera de las dos páginas aplica en ambas.
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
  variable: "--font-display",
  display: "swap",
});

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap",
});

const CATEGORIES = ["General", "Tecnología", "Ropa & Moda", "Accesorios", "Hogar"];

const BADGE_META: Record<string, { label: string; color: string; pale: string }> = {
  DESTACADO: { label: "Destacado", color: C.highlight, pale: C.highlightPale },
  OFERTA: { label: "Oferta", color: C.offer, pale: C.offerPale },
  POPULAR: { label: "Popular", color: C.trust, pale: C.trustPale },
};

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

function digitsOnly(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

function normalizeWhatsapp(raw: string): string {
  const d = digitsOnly(raw);
  if (d.length === 10 && /^(809|829|849)/.test(d)) return "1" + d;
  return d;
}

function initialsPlaceholder(name: string): string {
  const letter = (name?.trim()?.[0] || "P").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <rect width="400" height="400" fill="${C.paperSoft}"/>
    <text x="50%" y="55%" font-family="Georgia, 'Times New Roman', serif" font-size="168" fill="${C.ink}" fill-opacity="0.14" text-anchor="middle" dominant-baseline="middle">${letter}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

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
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function isExpired(p: ProductLink): boolean {
  if (!p.expiresAt) return false;
  return new Date(p.expiresAt).getTime() < Date.now();
}

/** Mismo monograma que /page.tsx. Se centra envolviéndolo con flex en vez de
 * confiar en text-align — Tailwind pone los <svg> en display:block por
 * defecto, así que text-align:center no tiene ningún efecto sobre ellos. */
function Mark({ size = 36 }: { size?: number }) {
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

type StatusFilter = "todos" | "pendiente" | "activo" | "vencido";
type FormMode = "closed" | "new" | "edit";

export default function AdminPage() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const [products, setProducts] = useState<ProductLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  const [formMode, setFormMode] = useState<FormMode>("closed");
  const [editingId, setEditingId] = useState<string | null>(null);
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
  const [showImgLink, setShowImgLink] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [pinConfigError, setPinConfigError] = useState("");

  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2500);
  }, []);

  // Comparte sesión con /page.tsx.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY) === "1") setIsAuthed(true);
    } catch {
      /* almacenamiento no disponible */
    }
  }, []);

  const refreshProducts = useCallback(async () => {
    try {
      const data = await productsService.getAll();
      setProducts(data);
      setLoadError(null);
    } catch (err) {
      console.error(err);
      setLoadError("No se pudo cargar el catálogo. Intenta de nuevo en un momento.");
    }
  }, []);

  useEffect(() => {
    (async () => {
      await refreshProducts();
      setLoading(false);
    })();
  }, [refreshProducts]);

  const anyModalOpen = formMode !== "closed" || isConfigOpen;
  useEffect(() => {
    if (!anyModalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [anyModalOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        closeForm();
        setIsConfigOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === currentAdminPin()) {
      setIsAuthed(true);
      setPinError(false);
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* noop */
      }
    } else {
      setPinError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthed(false);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* noop */
    }
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
    setShowImgLink(false);
    setProdExpires("");
    setEditingId(null);
  };

  const closeForm = () => {
    setFormMode("closed");
    resetForm();
  };

  const openCreateForm = () => {
    resetForm();
    setFormMode("new");
  };

  const openEditForm = (p: ProductLink) => {
    setEditingId(p.id);
    setProdName(p.name);
    setProdWhatsapp(p.whatsapp);
    setProdPrice(p.price?.toString() ?? "");
    setProdOrigPrice(p.originalPrice?.toString() ?? "");
    setProdCat(p.category);
    setProdBadge(p.badge ?? "NINGUNO");
    setProdDesc(p.description);
    const existingImg = p.image.startsWith("data:image/svg+xml") ? "" : p.image;
    setProdImg(existingImg);
    setShowImgLink(!!existingImg && !existingImg.startsWith("data:image/jpeg"));
    setProdExpires(p.expiresAt ?? "");
    setFormMode("edit");
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const whatsappDigits = normalizeWhatsapp(prodWhatsapp);
    if (!prodName || whatsappDigits.length < 8) return;

    const priceText = prodPrice ? `$${prodPrice}` : "consultar";
    const message = encodeURIComponent(
      `¡Hola! Vi tu producto "${prodName}" en PediClick por ${priceText} y me interesa comprarlo.`
    );
    const targetUrl = `https://wa.me/${whatsappDigits}?text=${message}`;

    setSubmitting(true);
    try {
      const payload = {
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
      };

      if (editingId) {
        const existing = products.find((p) => p.id === editingId);
        const nextStatus: ProductStatus = existing?.status === "pending" ? "approved" : existing?.status ?? "approved";
        await productsService.update(editingId, { ...payload, status: nextStatus });
        showToast(existing?.status === "pending" ? "Solicitud aprobada y publicada" : "Cambios guardados");
      } else {
        await productsService.create({ ...payload, status: "approved" as ProductStatus });
        showToast("Producto publicado");
      }
      await refreshProducts();
      closeForm();
    } catch (err) {
      console.error(err);
      showToast("Ocurrió un error al guardar. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (p: ProductLink) => {
    try {
      await productsService.update(p.id, { status: "approved" });
      await refreshProducts();
      showToast("Solicitud aprobada y publicada");
    } catch {
      showToast("No se pudo aprobar la solicitud.");
    }
  };

  const handleDelete = async (p: ProductLink, isPending: boolean) => {
    if (!confirm(isPending ? "¿Rechazar y eliminar esta solicitud?" : "¿Eliminar este producto del catálogo?")) return;
    try {
      await productsService.remove(p.id);
      await refreshProducts();
      showToast(isPending ? "Solicitud rechazada" : "Producto eliminado");
    } catch {
      showToast("No se pudo eliminar.");
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

  const pendingProducts = products.filter((p) => p.status === "pending");
  const activeCount = products.filter((p) => p.status === "approved" && !isExpired(p)).length;

  const visibleProducts = products
    .filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      if (!matchesSearch) return false;
      if (statusFilter === "pendiente") return p.status === "pending";
      if (statusFilter === "activo") return p.status === "approved" && !isExpired(p);
      if (statusFilter === "vencido") return p.status === "approved" && isExpired(p);
      return true;
    })
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  const editingExisting = editingId ? products.find((p) => p.id === editingId) : undefined;
  const isReviewingPending = editingExisting?.status === "pending";

  if (loading) {
    return (
      <div
        className={`${archivo.variable} min-h-screen flex items-center justify-center text-sm font-medium`}
        style={{ background: C.paper, color: C.inkFaint, fontFamily: "var(--font-body)" }}
      >
        Cargando panel…
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div
        className={`${fraunces.variable} ${archivo.variable} min-h-screen flex items-center justify-center p-4`}
        style={{ background: C.paper, fontFamily: "var(--font-body)" }}
      >
        <form
          onSubmit={handleLogin}
          className="p-6 rounded-2xl border shadow-sm max-w-xs w-full space-y-4 text-center"
          style={{ background: C.surface, borderColor: C.line }}
        >
          <div className="flex justify-center">
            <Mark size={44} />
          </div>
          <div>
            <h2 className="font-bold text-[16px]">Panel de administración</h2>
            <p className="text-[12px] mt-1" style={{ color: C.inkSoft }}>
              Ingresa tu PIN para gestionar el catálogo de PediClick
            </p>
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
              style={{ background: C.paperSoft, borderColor: pinError ? C.offer : C.line, color: C.ink }}
            />
            {pinError && (
              <p className="text-[11px] font-medium mt-1" style={{ color: C.offer }} role="alert">
                PIN incorrecto
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full font-semibold py-3 rounded-xl text-[13px] transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" /> Ingresar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      className={`${fraunces.variable} ${archivo.variable} min-h-screen pb-20`}
      style={{ background: C.paper, color: C.ink, fontFamily: "var(--font-body)" }}
    >
      <style jsx global>{`
        @keyframes pc-toast-in {
          from { opacity: 0; transform: translate(-50%, -8px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
        @keyframes pc-fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pc-pop-in {
          from { opacity: 0; transform: translateY(12px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (prefers-reduced-motion: reduce) { .pc-anim { animation: none !important; } }
      `}</style>

      {toast && (
        <div
          className="fixed top-5 left-1/2 z-[60] text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg pc-anim animate-[pc-toast-in_0.2s_ease-out_forwards]"
          style={{ background: C.ink, color: C.paper }}
          role="status"
        >
          {toast}
        </div>
      )}

      <header className="max-w-3xl mx-auto px-5 pt-10 sm:pt-14">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Mark size={38} />
            <div className="leading-none">
              <div className="text-[20px] font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                PediClick
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: C.inkFaint }}>
                Panel de administración
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsConfigOpen(true)}
              className="p-2 rounded-full border transition-colors border-[#E6E8E5] text-[#5B6066] hover:bg-[#F6F7F6] hover:text-[#15171A]"
              title="Configuración"
              aria-label="Configuración del administrador"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="p-2 rounded-full border transition-colors border-[#E6E8E5] text-[#5B6066] hover:bg-[#FBE4E1] hover:text-[#DC4B3F]"
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12px]" style={{ color: C.inkSoft }}>
          <span>{activeCount} productos activos</span>
          {pendingProducts.length > 0 && (
            <span className="font-semibold" style={{ color: C.highlight }}>
              {pendingProducts.length} pendiente{pendingProducts.length === 1 ? "" : "s"} de aprobación
            </span>
          )}
        </div>

        {loadError && (
          <div
            className="mt-5 text-xs font-medium rounded-xl p-3 flex items-center gap-2 border"
            style={{ background: C.offerPale, borderColor: C.offer, color: C.offer }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0" /> {loadError}
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
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
            <Plus className="w-4 h-4" /> Agregar producto
          </button>
        </div>

        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
          {([
            ["todos", "Todos"],
            ["pendiente", "Pendientes"],
            ["activo", "Activos"],
            ["vencido", "Vencidos"],
          ] as [StatusFilter, string][]).map(([key, label]) => {
            const active = statusFilter === key;
            return (
              <button
                key={key}
                onClick={() => setStatusFilter(key)}
                className={`px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors border ${
                  active
                    ? "bg-[#14A76C] border-[#14A76C] text-white hover:bg-[#0F8A58]"
                    : "bg-[#F6F7F6] border-[#E6E8E5] text-[#5B6066] hover:bg-[#E6E8E5] hover:text-[#15171A]"
                }`}
              >
                {label}
                {key === "pendiente" && pendingProducts.length > 0 ? ` (${pendingProducts.length})` : ""}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 mt-8">
        {visibleProducts.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed" style={{ borderColor: C.lineStrong }}>
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: C.paperSoft, color: C.inkFaint }}
            >
              <Info className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-[15px]">Nada por aquí</h3>
            <p className="text-[13px] max-w-xs mx-auto mt-1 leading-relaxed" style={{ color: C.inkSoft }}>
              {products.length === 0
                ? "Aún no hay productos en el catálogo. Agrega el primero."
                : "No hay productos que coincidan con este filtro."}
            </p>
          </div>
        ) : (
          <div className="border-t" style={{ borderColor: C.line }}>
            {visibleProducts.map((p) => {
              const pending = p.status === "pending";
              const expired = !pending && isExpired(p);
              const badge = p.badge && p.badge !== "NINGUNO" ? BADGE_META[p.badge] : null;
              return (
                <div
                  key={p.id}
                  className="py-4 px-3 -mx-3 rounded-xl flex flex-col sm:flex-row gap-3 sm:items-center border-b transition-colors hover:bg-[#F6F7F6]"
                  style={{ borderColor: C.line }}
                >
                  <div
                    className="w-14 h-14 rounded-lg overflow-hidden shrink-0"
                    style={{ background: C.paperSoft, opacity: expired ? 0.5 : 1 }}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = initialsPlaceholder(p.name);
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-[14px]">{p.name}</p>
                      {pending && (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
                          style={{ color: C.highlight, borderColor: C.highlight, background: C.highlightPale }}
                        >
                          Pendiente
                        </span>
                      )}
                      {expired && (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
                          style={{ color: C.offer, borderColor: C.offer, background: C.offerPale }}
                        >
                          Vencido
                        </span>
                      )}
                      {badge && (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full border"
                          style={{ color: badge.color, borderColor: badge.color, background: badge.pale }}
                        >
                          {badge.label}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color: C.inkFaint }}>
                      {p.category} · WhatsApp {p.whatsapp}
                    </p>
                    {p.price && (
                      <p className="text-[13px] font-semibold mt-1">${p.price.toFixed(2)}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {pending && (
                      <button
                        onClick={() => handleApprove(p)}
                        className="text-[11px] font-semibold px-3 py-2 rounded-lg transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" /> Aprobar
                      </button>
                    )}
                    <a
                      href={p.targetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg transition-colors text-[#8E9298] hover:bg-[#E1F5EA] hover:text-[#0F8A58]"
                      title="Ver chat de WhatsApp"
                      aria-label={`Ver WhatsApp de ${p.name}`}
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => openEditForm(p)}
                      className="p-2 rounded-lg transition-colors text-[#8E9298] hover:bg-[#E1F5EA] hover:text-[#0F8A58]"
                      title="Editar"
                      aria-label={`Editar ${p.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(p, pending)}
                      className="p-2 rounded-lg transition-colors text-[#8E9298] hover:bg-[#FBE4E1] hover:text-[#DC4B3F]"
                      title={pending ? "Rechazar" : "Eliminar"}
                      aria-label={pending ? `Rechazar ${p.name}` : `Eliminar ${p.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── Modal: agregar / editar producto ───────────────────────── */}
      {formMode !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pc-anim animate-[pc-fade-in_0.18s_ease-out]"
          style={{ background: "rgba(21,23,26,0.55)" }}
        >
          <form
            onSubmit={handleFormSubmit}
            role="dialog"
            aria-modal="true"
            aria-label="Formulario de producto"
            className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto pc-anim animate-[pc-pop-in_0.22s_ease-out]"
            style={{ background: C.surface }}
          >
            <div
              className="flex items-center justify-between px-6 pt-6 pb-3 border-b sticky top-0 z-10"
              style={{ borderColor: C.line, background: C.surface }}
            >
              <h3 className="font-bold text-[16px]">
                {isReviewingPending ? "Revisar solicitud" : editingId ? "Editar producto" : "Agregar producto"}
              </h3>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Cerrar"
                className="p-2 rounded-full transition-colors bg-[#F6F7F6] text-[#5B6066] hover:bg-[#E6E8E5] hover:text-[#15171A] shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pt-4 space-y-4">
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
                    {CATEGORIES.map((c) => (
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
                <Field label="WhatsApp del vendedor *" hint="Se usa para generar el enlace de contacto directo.">
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 8095551234"
                    value={prodWhatsapp}
                    onChange={(e) => setProdWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-mono outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                    style={{ background: C.paperSoft, borderColor: C.line }}
                  />
                </Field>
              </Section>

              <Section title="Foto">
                <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} onChange={handlePickImage} />
                {prodImg.startsWith("data:image/jpeg") ? (
                  <div className="flex items-center gap-3 rounded-xl border p-2.5" style={{ borderColor: C.line, background: C.paperSoft }}>
                    <img src={prodImg} alt="Foto del producto" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-semibold">Foto lista</p>
                      <p className="text-[10px]" style={{ color: C.inkFaint }}>La ajustamos automáticamente.</p>
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
                      <span className="text-[12px] font-semibold">{imgProcessing ? "Procesando foto…" : "Subir foto desde tu dispositivo"}</span>
                      <span className="text-[10px]" style={{ color: C.inkFaint }}>JPG o PNG. La ajustamos automáticamente.</span>
                    </button>
                    {showImgLink ? (
                      <Field label="Link de la foto (opcional)" hint="Si no subes nada, usamos un ícono con la inicial del producto.">
                        <input
                          type="url"
                          autoFocus
                          placeholder="https://..."
                          value={prodImg}
                          onChange={(e) => setProdImg(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                          style={{ background: C.paperSoft, borderColor: C.line }}
                        />
                      </Field>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowImgLink(true)}
                        className="text-[11px] font-semibold self-start hover:underline"
                        style={{ color: C.inkFaint }}
                      >
                        ¿Ya tienes la foto en un link? Pégalo aquí
                      </button>
                    )}
                  </>
                )}
              </Section>

              <Section title="Insignia y vigencia">
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
                  <Field label="Vence el (opcional)">
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
            </div>

            <div className="sticky bottom-0 z-10 px-6 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t mt-4" style={{ borderColor: C.line, background: C.surface }}>
              <button
                type="submit"
                disabled={submitting}
                className="w-full font-semibold py-3.5 rounded-xl text-[13px] shadow-sm disabled:opacity-60 transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white active:scale-[0.98]"
              >
                {submitting ? "Guardando…" : isReviewingPending ? "Aprobar y publicar" : editingId ? "Guardar cambios" : "Publicar en el catálogo"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Modal: ajustes (cambiar PIN) ───────────────────────────── */}
      {isConfigOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 pc-anim animate-[pc-fade-in_0.18s_ease-out]"
          style={{ background: "rgba(21,23,26,0.55)" }}
        >
          <form
            onSubmit={handleSaveConfig}
            role="dialog"
            aria-modal="true"
            aria-label="Ajustes del administrador"
            className="w-full max-w-sm rounded-2xl p-6 shadow-xl space-y-4 pc-anim animate-[pc-pop-in_0.22s_ease-out]"
            style={{ background: C.surface }}
          >
            <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: C.line }}>
              <h3 className="font-semibold text-[15px]">Ajustes del admin</h3>
              <button
                type="button"
                onClick={() => setIsConfigOpen(false)}
                aria-label="Cerrar"
                className="p-1.5 rounded-full transition-colors bg-[#F6F7F6] text-[#5B6066] hover:bg-[#E6E8E5] hover:text-[#15171A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <Field label="Nuevo PIN de acceso">
                <input
                  type="password"
                  maxLength={8}
                  placeholder="Nuevo PIN (4 a 8 caracteres)"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-mono outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                  style={{ background: C.paperSoft, borderColor: C.line }}
                />
              </Field>
              <Field label="Confirmar nuevo PIN">
                <input
                  type="password"
                  maxLength={8}
                  placeholder="Repite el PIN"
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-[13px] font-mono outline-none focus:border-[#14A76C] focus:ring-2 focus:ring-[#14A76C]/20"
                  style={{ background: C.paperSoft, borderColor: C.line }}
                />
              </Field>
              <p className="text-[10px]" style={{ color: C.inkFaint }}>
                El nuevo PIN se guarda en este navegador y aplica tanto aquí como en el directorio principal.
              </p>
              {pinConfigError && (
                <p className="text-[11px] font-medium" style={{ color: C.offer }} role="alert">
                  {pinConfigError}
                </p>
              )}
            </div>
            <button
              type="submit"
              className="w-full font-semibold py-3 rounded-xl text-[13px] transition-colors bg-[#15171A] hover:bg-[#262A2E] text-white active:scale-[0.98]"
            >
              Guardar ajustes
            </button>
          </form>
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

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
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
