"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Info,
  MapPin,
  Tag,
  Star,
  ShieldCheck,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  featured?: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Auriculares Inalámbricos Noise Cancelling",
    description: "Cancelación activa de ruido, 30 horas de batería y sonido de alta fidelidad.",
    price: 89.99,
    category: "Tecnología",
    featured: true,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    name: "Camiseta Oversize Minimalista",
    description: "100% algodón de alto gramaje, confección premium y corte relaxed fit.",
    price: 25.00,
    category: "Ropa & Moda",
    featured: true,
    image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "3",
    name: "Reloj Minimalista de Cuero",
    description: "Caja de acero inoxidable, cristal de zafiro y correa de cuero genuino.",
    price: 120.00,
    category: "Accesorios",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "4",
    name: "Lámpara LED de Escritorio Inteligente",
    description: "Luz regulable, temperatura de color ajustable y puerto de carga USB integrado.",
    price: 45.50,
    category: "Hogar",
    image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600&auto=format&fit=crop&q=80",
  },
];

const CATEGORIES = ["Todos", "Tecnología", "Ropa & Moda", "Accesorios", "Hogar"];

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      const updated = current + delta;
      if (updated <= 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: updated };
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = PRODUCTS.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);

  const sendWhatsAppOrder = () => {
    if (totalItems === 0) return;
    let message = `🛍️ *NUEVO PEDIDO - PEDICLICK STORE*\n`;
    message += `─────────────────────────\n\n`;
    Object.entries(cart).forEach(([id, qty]) => {
      const product = PRODUCTS.find((p) => p.id === id);
      if (product) {
        message += `▪️ *${qty}x* ${product.name}\n   └ Precio unitario: *$${product.price.toFixed(2)}*\n`;
      }
    });
    message += `\n─────────────────────────\n`;
    message += `💳 *TOTAL DE LA COMPRA:* *$${totalPrice.toFixed(2)} USD*\n\n`;
    message += `📍 *Dirección de envío:* (Escribe tu dirección exacta)\n`;
    message += `👤 *Nombre del cliente:* (Tu nombre)\n`;
    message += `💬 *Notas de la orden:* (Talla, color o detalles adicionales)`;

    window.open(`https://wa.me/8091234567?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-32">
      {/* Portada Estilo Showcase de Tienda Comercial */}
      <div className="relative h-60 sm:h-72 w-full bg-slate-950 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&auto=format&fit=crop&q=80"
          alt="Portada Tienda"
          className="w-full h-full object-cover opacity-40 scale-105 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-slate-950/40 to-transparent" />
      </div>

      {/* Tarjeta Principal del Comercio */}
      <div className="max-w-2xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white/85 backdrop-blur-xl rounded-3xl p-6 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            
            {/* Logo Comercial Versátil */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 p-[2px] shadow-xl shadow-slate-950/10">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-indigo-500/20 rounded-full blur-xl" />
                  <ShoppingBag className="w-7 h-7 text-indigo-400 mb-0.5" />
                  <div className="flex items-center gap-0.5 font-black text-sm tracking-tight text-white">
                    PediClick<span className="text-indigo-400">.</span>
                  </div>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-1 shadow-md border-2 border-white">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Información de la Tienda */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">PediClick Store</h1>
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Tienda Verificada
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Catálogo de productos exclusivos. Realiza tu pedido directo por WhatsApp con envíos a todo el país.
              </p>

              {/* Badges Informativos */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Disponible para pedidos
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Envíos Nacionales
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador de Productos */}
        <div className="mt-6 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por producto, marca o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-sm placeholder:text-slate-400 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 transition-all"
            />
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
                      ? "bg-slate-950 text-white shadow-lg shadow-slate-950/15 scale-[1.02]"
                      : "bg-white text-slate-600 border border-slate-200/70 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Muestra de Productos */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-950 text-lg tracking-tight">Catálogo de Productos</h2>
            <span className="text-xs text-slate-400 font-semibold">{filteredProducts.length} artículos</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-6">
              <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 text-sm font-semibold">No se encontraron productos</p>
              <p className="text-xs text-slate-400 mt-1">Intenta con otros términos de búsqueda.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const qty = cart[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="group bg-white p-4 rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-xl hover:shadow-slate-950/5 transition-all duration-300 flex flex-col sm:flex-row gap-4 items-start sm:items-center relative overflow-hidden"
                >
                  {/* Foto del Producto */}
                  <div className="relative w-full sm:w-28 h-40 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {p.featured && (
                      <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-amber-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-400/30">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> Destacado
                      </span>
                    )}
                  </div>

                  {/* Info Detallada */}
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-slate-950 text-base leading-snug group-hover:text-indigo-600 transition-colors">
                      {p.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed line-clamp-2">
                      {p.description}
                    </p>
                    <p className="font-black text-slate-950 text-base mt-3 flex items-baseline gap-1">
                      ${p.price.toFixed(2)}
                      <span className="text-[10px] text-slate-400 font-normal">USD</span>
                    </p>
                  </div>

                  {/* Selector de Cantidad */}
                  <div className="w-full sm:w-auto flex justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {qty === 0 ? (
                      <button
                        onClick={() => updateQuantity(p.id, 1)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-slate-950/10 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Añadir
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                        <button
                          onClick={() => updateQuantity(p.id, -1)}
                          className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center shadow-sm hover:bg-slate-200 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-xs text-slate-950 w-4 text-center">{qty}</span>
                        <button
                          onClick={() => updateQuantity(p.id, 1)}
                          className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-sm hover:bg-indigo-600 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Botón Flotante de Compra */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-xl mx-auto z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <button
            onClick={sendWhatsAppOrder}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-3xl shadow-2xl shadow-emerald-600/30 flex items-center justify-between font-bold text-sm transition-all active:scale-[0.98] border border-emerald-400/30 backdrop-blur-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700/60 flex items-center justify-center text-white font-black text-sm border border-white/20">
                {totalItems}
              </div>
              <div className="text-left">
                <p className="text-xs text-emerald-100 font-medium leading-none">Confirmar selección</p>
                <p className="font-extrabold text-white text-sm mt-1 flex items-center gap-1">
                  Pedir por WhatsApp <ArrowRight className="w-4 h-4 ml-0.5" />
                </p>
              </div>
            </div>
            <div className="text-right pl-4 border-l border-emerald-500/40">
              <span className="text-[10px] text-emerald-200 block uppercase font-bold tracking-wider">Total</span>
              <span className="text-lg font-black text-white">${totalPrice.toFixed(2)}</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
