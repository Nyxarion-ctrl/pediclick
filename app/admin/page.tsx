"use client";

import React, { useState, useEffect } from "react";
import { Fraunces, Archivo } from "next/font/google";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Store, Package, Check, Lock, ShieldCheck } from "lucide-react";

/* Mismo sistema de diseño que la página principal — ver /page.tsx para el detalle. */
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

function Mark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M6 6h20a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H14l-6 5v-5H6a4 4 0 0 1-4-4V10a4 4 0 0 1 4-4Z"
        fill={C.accent}
      />
      <path d="M11 15.6 14.2 19 21 11" stroke={C.paper} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  badge?: string;
}

export default function AdminPage() {
  // Autenticación por PIN
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");

  // Datos de la Tienda
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeId, setStoreId] = useState<string | null>(null);

  // Datos de Productos
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [badge, setBadge] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // Validar PIN de Administrador
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Cambia "1234" por tu PIN deseado
    if (pinInput === "1234") {
      setIsAuthenticated(true);
    } else {
      alert("PIN incorrecto. Inténtalo de nuevo.");
      setPinInput("");
    }
  };

  // Crear o guardar negocio
  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !storePhone || !storeSlug) return;

    setLoading(true);
    const { data, error } = await supabase
      .from("pediclick_stores")
      .insert([{ name: storeName, phone: storePhone, slug: storeSlug.toLowerCase() }])
      .select()
      .single();

    setLoading(false);
    if (error) {
      alert("Error al crear el negocio o el slug ya existe");
      console.error(error);
    } else if (data) {
      setStoreId(data.id);
    }
  };

  // Cargar productos del negocio activo
  const fetchProducts = async () => {
    if (!storeId) return;
    const { data, error } = await supabase
      .from("pediclick_products")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // Agregar nuevo producto (incluye campo de insignia/badge)
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !name || !price) return;

    setLoading(true);
    const { error } = await supabase.from("pediclick_products").insert([
      {
        store_id: storeId,
        name,
        description,
        price: parseFloat(price),
        badge: badge || null,
        image_url:
          imageUrl ||
          `data:image/svg+xml,${encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><rect width="400" height="400" fill="${C.paperSoft}"/><text x="50%" y="55%" font-family="Georgia, serif" font-size="168" fill="${C.ink}" fill-opacity="0.14" text-anchor="middle" dominant-baseline="middle">${(name?.[0] || "P").toUpperCase()}</text></svg>`
          )}`,
      },
    ]);

    setLoading(false);
    if (error) {
      alert("Error al agregar producto. Asegúrate de tener la columna 'badge' en tu tabla de Supabase.");
      console.error(error);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setBadge("");
      setImageUrl("");
      fetchProducts();
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("pediclick_products").delete().eq("id", id);
    if (!error) fetchProducts();
  };

  const pageShell = `${fraunces.variable} ${archivo.variable}`;

  // 1. PANTALLA DE ACCESO POR PIN
  if (!isAuthenticated) {
    return (
      <div
        className={`${pageShell} min-h-screen flex items-center justify-center p-4`}
        style={{ background: C.paper, fontFamily: "var(--font-body)" }}
      >
        <form
          onSubmit={handleLogin}
          className="p-6 rounded-2xl border shadow-sm max-w-sm w-full space-y-4 text-center"
          style={{ background: C.surface, borderColor: C.line }}
        >
          <Mark size={40} />
          <div>
            <h2 className="font-bold text-[16px]">
              Acceso administrador
            </h2>
            <p className="text-[12px] mt-1" style={{ color: C.inkSoft }}>
              Ingresa tu PIN para gestionar el menú
            </p>
          </div>
          <input
            type="password"
            placeholder="Ingresa tu PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            className="w-full text-[13px] rounded-xl px-3.5 py-2.5 text-center outline-none border"
            style={{ background: C.paperSoft, borderColor: C.line, color: C.ink }}
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded-xl py-3 font-semibold text-[13px] transition-colors flex items-center justify-center gap-2"
            style={{ background: C.ink, color: C.paper }}
          >
            <ShieldCheck className="w-4 h-4" /> Ingresar
          </button>
        </form>
      </div>
    );
  }

  // 2. PANEL DE ADMINISTRACIÓN
  return (
    <div
      className={`${pageShell} min-h-screen p-4 max-w-lg mx-auto space-y-6 pb-16`}
      style={{ background: C.paper, color: C.ink, fontFamily: "var(--font-body)" }}
    >
      <header
        className="p-4 rounded-2xl border shadow-sm flex items-center gap-3"
        style={{ background: C.surface, borderColor: C.line }}
      >
        <Mark size={34} />
        <div>
          <h1 className="font-bold text-[15px]">
            Panel admin — PediClick
          </h1>
          <p className="text-[12px]" style={{ color: C.inkSoft }}>
            Configura tu tienda y menú
          </p>
        </div>
      </header>

      {/* Paso 1: Configurar Negocio */}
      {!storeId ? (
        <form
          onSubmit={handleSaveStore}
          className="p-5 rounded-2xl border shadow-sm space-y-4"
          style={{ background: C.surface, borderColor: C.line }}
        >
          <h2 className="font-semibold flex items-center gap-2 text-[13px]">
            <Store className="w-4 h-4" style={{ color: C.inkSoft }} /> 1. Registra tu negocio
          </h2>
          <Field label="Nombre del negocio">
            <input
              type="text"
              placeholder="Ej: Pizzería Roma"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full text-[13px] rounded-xl px-3.5 py-2.5 outline-none border"
              style={{ background: C.paperSoft, borderColor: C.line }}
              required
            />
          </Field>
          <Field label="WhatsApp de pedidos">
            <input
              type="text"
              placeholder="Ej: 8091234567"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              className="w-full text-[13px] rounded-xl px-3.5 py-2.5 outline-none border font-mono"
              style={{ background: C.paperSoft, borderColor: C.line }}
              required
            />
          </Field>
          <Field label="Slug / identificador de URL">
            <input
              type="text"
              placeholder="Ej: pizzeria-roma"
              value={storeSlug}
              onChange={(e) => setStoreSlug(e.target.value)}
              className="w-full text-[13px] rounded-xl px-3.5 py-2.5 outline-none border"
              style={{ background: C.paperSoft, borderColor: C.line }}
              required
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 font-semibold text-[13px] shadow-sm transition-colors disabled:opacity-60"
            style={{ background: C.ink, color: C.paper }}
          >
            {loading ? "Guardando…" : "Guardar y continuar"}
          </button>
        </form>
      ) : (
        /* Paso 2: Agregar Productos */
        <div className="space-y-6">
          <div
            className="border p-4 rounded-2xl flex items-center justify-between"
            style={{ background: C.accentPale, borderColor: C.accent }}
          >
            <div>
              <p className="text-[11px] font-semibold" style={{ color: C.accentDeep }}>Tienda activa</p>
              <p className="font-semibold text-[15px]">{storeName}</p>
            </div>
            <span
              className="text-[11px] px-2.5 py-1 rounded-full font-semibold flex items-center gap-1"
              style={{ background: C.surface, color: C.accentDeep }}
            >
              <Check className="w-3 h-3" /> Conectado
            </span>
          </div>

          <form
            onSubmit={handleAddProduct}
            className="p-5 rounded-2xl border shadow-sm space-y-3"
            style={{ background: C.surface, borderColor: C.line }}
          >
            <h2 className="font-semibold flex items-center gap-2 text-[13px]">
              <Package className="w-4 h-4" style={{ color: C.inkSoft }} /> Agregar nuevo producto
            </h2>
            <input
              type="text"
              placeholder="Nombre del producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-[13px] rounded-xl px-3.5 py-2.5 outline-none border"
              style={{ background: C.paperSoft, borderColor: C.line }}
              required
            />
            <input
              type="text"
              placeholder="Descripción breve"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-[13px] rounded-xl px-3.5 py-2.5 outline-none border"
              style={{ background: C.paperSoft, borderColor: C.line }}
            />
            <input
              type="number"
              step="0.01"
              placeholder="Precio ($)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full text-[13px] rounded-xl px-3.5 py-2.5 outline-none border"
              style={{ background: C.paperSoft, borderColor: C.line }}
              required
            />

            <Field label="Insignia (opcional)">
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full text-[13px] rounded-xl px-3.5 py-2.5 outline-none border"
                style={{ background: C.paperSoft, borderColor: C.line }}
              >
                <option value="">Sin insignia</option>
                <option value="DESTACADO">Destacado</option>
                <option value="POPULAR">Popular</option>
                <option value="OFERTA">Oferta</option>
                <option value="NUEVO">Nuevo</option>
              </select>
            </Field>

            <input
              type="url"
              placeholder="URL imagen (opcional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full text-[13px] rounded-xl px-3.5 py-2.5 outline-none border"
              style={{ background: C.paperSoft, borderColor: C.line }}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 font-semibold text-[13px] shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: C.ink, color: C.paper }}
            >
              <Plus className="w-4 h-4" /> {loading ? "Guardando…" : "Agregar producto"}
            </button>
          </form>

          {/* Lista de productos guardados */}
          <div className="space-y-3">
            <h3 className="font-semibold text-[13px]">Productos registrados ({products.length})</h3>
            {products.length === 0 ? (
              <div
                className="text-center py-10 rounded-2xl border border-dashed text-[13px]"
                style={{ borderColor: C.lineStrong, color: C.inkFaint }}
              >
                Aún no has agregado productos.
              </div>
            ) : (
              products.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl border flex items-center justify-between gap-3 shadow-sm"
                  style={{ background: C.surface, borderColor: C.line }}
                >
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="w-12 h-12 rounded-lg object-cover shrink-0"
                    style={{ background: C.paperSoft }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[13px] truncate">{p.name}</p>
                      {p.badge && (
                        <span
                          className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border"
                          style={{ color: C.highlight, borderColor: C.highlight, background: C.highlightPale }}
                        >
                          {p.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[12px]" style={{ color: C.inkSoft }}>${p.price.toFixed(2)}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(p.id)}
                    className="p-2 rounded-lg transition-colors"
                    style={{ color: C.offer }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[12px] font-semibold mb-1" style={{ color: C.inkSoft }}>
        {label}
      </label>
      {children}
    </div>
  );
}
