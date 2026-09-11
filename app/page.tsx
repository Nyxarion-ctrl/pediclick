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
  Flame,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  popular?: boolean;
}

const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Hamburguesa Trufada & Queso Smash",
    description: "Doble carne Smash de res angus, queso cheddar añejo, mayo de trufa negra y pan brioche artesanal.",
    price: 8.50,
    category: "Hamburguesas",
    popular: true,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "2",
    name: "Pizza Pepperoni Napolitana",
    description: "Masa de fermentación lenta de 48h, salsa de tomate San Marzano, mozzarella fior di latte y pepperoni artesanal.",
    price: 12.00,
    category: "Pizzas",
    popular: true,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "3",
    name: "Papas Rústicas de Trufa & Parmesano",
    description: "Corte rústico con piel, sal marina, aceite de trufa blanca y queso parmesano gratinado al momento.",
    price: 4.50,
    category: "Acompañantes",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80",
  },
  {
    id: "4",
    name: "Limonada Menta & Jengibre",
    description: "Infusión fría de limones amarillos frescos, hojas de menta del huerto y un toque picante de jengibre natural.",
    price: 3.50,
    category: "Bebidas",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80",
  },
];

const CATEGORIES = ["Todos", "Hamburguesas", "Pizzas", "Acompañantes", "Bebidas"];

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
    let message = `🛍️ *NUEVO PEDIDO - PEDICLICK*\n`;
    message += `─────────────────────────\n\n`;
    Object.entries(cart).forEach(([id, qty]) => {
      const product = PRODUCTS.find((p) => p.id === id);
      if (product) {
        message += `▪️ *${qty}x* ${product.name}\n   └ Total: *$${(product.price * qty).toFixed(2)}*\n`;
      }
    });
    message += `\n─────────────────────────\n`;
    message += `💳 *TOTAL ESTIMADO:* *$${totalPrice.toFixed(2)} USD*\n\n`;
    message += `📍 *Ubicación de entrega:* (Escribe tu dirección aquí)\n`;
    message += `✨ *Notas especiales:* (Ej. Sin cebolla, extra salsa)`;

    window.open(`https://wa.me/8091234567?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-32">
      {/* Portada Minimalista Estilo Neobrutalista/SaaS */}
      <div className="relative h-60 sm:h-72 w-full bg-slate-950 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1600&auto=format&fit=crop&q=80"
          alt="Portada Negocio"
          className="w-full h-full object-cover opacity-35 scale-105 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F8FAFC] via-slate-950/40 to-transparent" />
      </div>

      {/* Tarjeta de Identidad de Marca Unica */}
      <div className="max-w-2xl mx-auto px-4 -mt-20 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            
            {/* Logo Geométrico & Elegante */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 p-[2px] shadow-xl shadow-slate-950/10">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute -top-6 -right-6 w-12 h-12 bg-emerald-500/20 rounded-full blur-xl" />
                  <div className="flex items-center gap-0.5 font-black text-2xl tracking-tighter text-white">
                    P<span className="text-emerald-400">.</span>C
                  </div>
                  <span className="text-[9px] font-semibold tracking-widest text-emerald-400 uppercase mt-0.5">
                    Gourmet
                  </span>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md border-2 border-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Detalles del Establecimiento */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">PediClick Studio</h1>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Oficial
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                Gastronomía artesanal & entregas exprés integradas directamente con WhatsApp.
              </p>

              {/* Badges de Información Tecno-Minimalistas */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Abierto ahora
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> 20-35 min
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> San Francisco
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Buscador de Alta Fidelidad */}
        <div className="mt-6 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar platillo, ingrediente o bebida..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-sm placeholder:text-slate-400 outline-none focus:border-slate-950 focus:ring-4 focus:ring-slate-950/5 transition-all"
            />
          </div>

          {/* Categorías Flotantes Estilo Píldora */}
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

        {/* Listado de Productos */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-950 text-lg tracking-tight">Menú Seleccionado</h2>
            <span className="text-xs text-slate-400 font-semibold">{filteredProducts.length} opciones</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-6">
              <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-600 text-sm font-semibold">Sin resultados encontrados</p>
              <p className="text-xs text-slate-400 mt-1">Intenta buscar otra palabra o cambia la categoría.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const qty = cart[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="group bg-white p-4 rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-xl hover:shadow-slate-950/5 transition-all duration-300 flex flex-col sm:flex-row gap-4 items-start sm:items-center relative overflow-hidden"
                >
                  {/* Foto del Producto con Aspect Ratio Cuadrado Limpio */}
                  <div className="relative w-full sm:w-28 h-40 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {p.popular && (
                      <span className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-500/30">
                        <Flame className="w-3 h-3 text-emerald-400 fill-emerald-400" /> TOP
                      </span>
                    )}
                  </div>

                  {/* Info Detallada */}
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-slate-950 text-base leading-snug group-hover:text-emerald-700 transition-colors">
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

                  {/* Selector de Cantidad Estilo Flotante */}
                  <div className="w-full sm:w-auto flex justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {qty === 0 ? (
                      <button
                        onClick={() => updateQuantity(p.id, 1)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-slate-950/10 active:scale-95 transition-all"
                      >
                        <Plus className="w-4 h-4" /> Agregar
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
                          className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-sm hover:bg-emerald-600 transition-colors"
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

      {/* Checkout Bar Flotante Minimalista */}
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
                <p className="text-xs text-emerald-100 font-medium leading-none">Completar pedido</p>
                <p className="font-extrabold text-white text-sm mt-1 flex items-center gap-1">
                  Enviar por WhatsApp <ArrowRight className="w-4 h-4 ml-0.5" />
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
