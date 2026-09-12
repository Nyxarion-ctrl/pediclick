"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Info,
  Truck,
  CreditCard,
  User,
  MapPin,
  ShieldCheck,
  X,
  PackagePlus,
  Trash2,
  Settings,
  Lock,
  Unlock,
  Flame,
  Tag,
  CheckCircle2,
  Clock,
  KeyRound,
} from "lucide-react";

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  badge?: "OFERTA" | "MÁS VENDIDO" | "NUEVO" | "NINGUNO";
}

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "demo-1",
    name: "Reloj Smartwatch Pro Edition",
    description: "Pantalla AMOLED, monitoreo de salud 24/7 y batería de 10 días.",
    price: 45.0,
    originalPrice: 65.0,
    category: "Tecnología",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    badge: "OFERTA",
  },
  {
    id: "demo-2",
    name: "Audífonos Inalámbricos BassPro",
    description: "Cancelación de ruido activa, micrófono HD para llamadas y estuche de carga rápida.",
    price: 29.99,
    category: "Tecnología",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    badge: "MÁS VENDIDO",
  },
];

const CATEGORIES = ["Todos", "General", "Tecnología", "Ropa & Moda", "Accesorios", "Hogar"];

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("8091234567");
  const [adminPin, setAdminPin] = useState("1234");
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  // Modales
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Campos Formulario Admin / PIN
  const [inputPin, setInputPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [newPin, setNewPin] = useState("");

  // Formulario Nuevo Producto
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");
  const [newProdOrigPrice, setNewProdOrigPrice] = useState("");
  const [newProdCat, setNewProdCat] = useState("General");
  const [newProdBadge, setNewProdBadge] = useState<"OFERTA" | "MÁS VENDIDO" | "NUEVO" | "NINGUNO">("NINGUNO");
  const [newProdDesc, setNewProdDesc] = useState("");
  const [newProdImg, setNewProdImg] = useState("");

  // Datos Cliente Checkout
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Transferencia / Depósito");

  // Cargar datos locales o inicializar con Demo
  useEffect(() => {
    const savedProducts = localStorage.getItem("pediclick_products");
    const savedPhone = localStorage.getItem("pediclick_phone");
    const savedPin = localStorage.getItem("pediclick_pin");

    if (savedProducts) {
      try {
        const parsed = JSON.parse(savedProducts);
        setProducts(parsed);
      } catch (e) {
        setProducts(DEFAULT_PRODUCTS);
      }
    } else {
      setProducts(DEFAULT_PRODUCTS);
      localStorage.setItem("pediclick_products", JSON.stringify(DEFAULT_PRODUCTS));
    }

    if (savedPhone) setWhatsappNumber(savedPhone);
    if (savedPin) setAdminPin(savedPin);
  }, []);

  const saveProductsToStorage = (updated: Product[]) => {
    setProducts(updated);
    localStorage.setItem("pediclick_products", JSON.stringify(updated));
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPin === adminPin) {
      setIsAdmin(true);
      setIsAdminModalOpen(false);
      setInputPin("");
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName || !newProdPrice) return;

    const createdProduct: Product = {
      id: Date.now().toString(),
      name: newProdName,
      price: parseFloat(newProdPrice),
      originalPrice: newProdOrigPrice ? parseFloat(newProdOrigPrice) : undefined,
      category: newProdCat,
      badge: newProdBadge,
      description: newProdDesc || "Sin descripción corta.",
      image: newProdImg || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    };

    saveProductsToStorage([createdProduct, ...products]);
    setNewProdName("");
    setNewProdPrice("");
    setNewProdOrigPrice("");
    setNewProdDesc("");
    setNewProdImg("");
    setNewProdBadge("NINGUNO");
    setIsAddProductOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm("¿Deseas eliminar este producto del catálogo?")) {
      const updated = products.filter((p) => p.id !== id);
      saveProductsToStorage(updated);
      if (cart[id]) {
        const { [id]: _, ...restCart } = cart;
        setCart(restCart);
      }
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("pediclick_phone", whatsappNumber);
    if (newPin.trim().length >= 4) {
      localStorage.setItem("pediclick_pin", newPin);
      setAdminPin(newPin);
      setNewPin("");
    }
    setIsConfigOpen(false);
  };

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

  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === "Todos" || p.category === selectedCategory;
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);

  const sendWhatsAppOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalItems === 0) return;

    const orderId = Math.floor(1000 + Math.random() * 9000);
    let message = `🛒 *NUEVA ORDEN DE COMPRA #${orderId}*\n`;
    message += `*PediClick Store*\n`;
    message += `─────────────────────────\n\n`;
    
    if (customerName) message += `👤 *Cliente:* ${customerName}\n`;
    if (customerAddress) message += `📍 *Dirección:* ${customerAddress}\n`;
    message += `💳 *Método de Pago:* ${paymentMethod}\n\n`;
    
    message += `📦 *ARTÍCULOS SOLICITADOS:*\n`;
    Object.entries(cart).forEach(([id, qty]) => {
      const product = products.find((p) => p.id === id);
      if (product) {
        message += `▪️ *${qty}x* ${product.name}\n   └ Subtotal: *$${(product.price * qty).toFixed(2)}*\n`;
      }
    });

    message += `\n─────────────────────────\n`;
    message += `💰 *TOTAL A PAGAR:* *$${totalPrice.toFixed(2)} USD*\n\n`;
    message += ` Quedo a la espera de la confirmación para realizar el pago.`;

    const cleanPhone = whatsappNumber.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
    setIsCheckoutOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans antialiased pb-32">
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
                  <ShoppingBag className="w-7 h-7 text-indigo-400 mb-0.5" />
                  <div className="flex items-center gap-0.5 font-black text-sm tracking-tight text-white">
                    PediClick<span className="text-indigo-400">.</span>
                  </div>
                </div>
              </div>
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 shadow-md border-2 border-white" title="Verificado">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>

            {/* Información de la Tienda */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl font-black tracking-tight text-slate-950">PediClick Store</h1>
                <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Tienda Oficial
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
                Catálogo digital en vivo. Haz tu pedido y recibe atención directa por WhatsApp.
              </p>

              {/* Insignias de Confianza */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-4 text-xs font-semibold">
                <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 px-3 py-1 rounded-xl border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Atendiendo Pedidos
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Respuestas Rápidas
                </span>
                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1 rounded-xl border border-slate-200/60">
                  <Truck className="w-3.5 h-3.5 text-slate-400" /> Envíos Seguros
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
                placeholder="Buscar por nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white pl-11 pr-4 py-3.5 rounded-2xl border border-slate-200/80 shadow-sm text-sm placeholder:text-slate-400 outline-none focus:border-slate-950 transition-all"
              />
            </div>

            {isAdmin && (
              <button
                onClick={() => setIsAddProductOpen(true)}
                className="bg-slate-950 hover:bg-indigo-600 text-white px-4 py-3.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 animate-in fade-in"
              >
                <PackagePlus className="w-4 h-4" />
                <span className="hidden sm:inline">Nuevo Producto</span>
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

        {/* Catálogo de Productos */}
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-slate-950 text-lg tracking-tight">Catálogo de Productos</h2>
            <span className="text-xs text-slate-400 font-semibold">{filteredProducts.length} artículos</span>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Info className="w-6 h-6" />
              </div>
              <h3 className="text-slate-950 font-black text-base">Catálogo en Actualización</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1 leading-relaxed">
                {isAdmin
                  ? "Aún no has agregado productos. Presiona el botón para incluir los primeros artículos."
                  : "No hay productos disponibles en esta sección por el momento."}
              </p>
              {isAdmin ? (
                <button
                  onClick={() => setIsAddProductOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 bg-slate-950 hover:bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all"
                >
                  <PackagePlus className="w-4 h-4" /> Agregar Producto
                </button>
              ) : (
                <button
                  onClick={() => setIsAdminModalOpen(true)}
                  className="mt-5 inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs transition-all"
                >
                  <Lock className="w-3.5 h-3.5" /> ¿Eres el dueño? Acceder con PIN
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map((p) => {
              const qty = cart[p.id] || 0;

              return (
                <div
                  key={p.id}
                  className="group bg-white p-4 rounded-3xl border border-slate-200/70 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-4 items-start sm:items-center relative overflow-hidden"
                >
                  {/* Imagen y Badges */}
                  <div className="relative w-full sm:w-28 h-40 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {p.badge && p.badge !== "NINGUNO" && (
                      <span
                        className={`absolute top-2 left-2 px-2 py-0.5 rounded-lg text-[9px] font-black tracking-wider text-white uppercase shadow-md flex items-center gap-1 ${
                          p.badge === "OFERTA"
                            ? "bg-red-500"
                            : p.badge === "MÁS VENDIDO"
                            ? "bg-amber-500"
                            : "bg-indigo-600"
                        }`}
                      >
                        {p.badge === "OFERTA" && <Tag className="w-2.5 h-2.5" />}
                        {p.badge === "MÁS VENDIDO" && <Flame className="w-2.5 h-2.5" />}
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Detalles */}
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
                  </div>

                  {/* Controles de Carrito */}
                  <div className="w-full sm:w-auto flex justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    {qty === 0 ? (
                      <button
                        onClick={() => updateQuantity(p.id, 1)}
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
                      >
                        <Plus className="w-4 h-4" /> Añadir al Carrito
                      </button>
                    ) : (
                      <div className="flex items-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
                        <button
                          onClick={() => updateQuantity(p.id, -1)}
                          className="w-8 h-8 rounded-xl bg-white text-slate-950 flex items-center justify-center shadow-sm hover:bg-slate-200"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-black text-xs text-slate-950 w-4 text-center">{qty}</span>
                        <button
                          onClick={() => updateQuantity(p.id, 1)}
                          className="w-8 h-8 rounded-xl bg-slate-950 text-white flex items-center justify-center shadow-sm hover:bg-indigo-600"
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

        {/* Pie de página con acceso discreto a Administración */}
        <footer className="mt-16 text-center border-t border-slate-200/70 pt-8 pb-4 text-slate-400 text-xs flex flex-col items-center gap-2">
          <p className="font-semibold text-slate-500">PediClick Store &copy; 2026</p>

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
                <span>Acceso Dueño</span>
              </>
            )}
          </button>
        </footer>
      </div>

      {/* Modal Autenticación por PIN */}
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
              <p className="text-xs text-slate-500 mt-1">Ingresa tu clave PIN para gestionar el catálogo</p>
            </div>

            <div>
              <input
                type="password"
                maxLength={8}
                required
                autoFocus
                placeholder="PIN (por defecto: 1234)"
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

      {/* Modal Agregar Producto */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={handleAddProduct}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-950 text-lg">Agregar Nuevo Producto</h3>
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
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Zapatillas Nike Air"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
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
                      <option key={c} value={c}>{c}</option>
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
                    <option value="OFERTA">OFERTA</option>
                    <option value="MÁS VENDIDO">MÁS VENDIDO</option>
                    <option value="NUEVO">NUEVO</option>
                  </select>
                </div>
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
              Publicar en el Catálogo
            </button>
          </form>
        </div>
      )}

      {/* Modal Ajustes del Negocio */}
      {isConfigOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSaveConfig}
            className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-black text-slate-950 text-base">Ajustes del Negocio</h3>
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
                <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp de Recepción de Pedidos:</label>
                <input
                  type="text"
                  required
                  placeholder="8091234567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cambiar Clave PIN (Opcional):</label>
                <input
                  type="password"
                  placeholder="Nuevo PIN de acceso"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-950 text-white font-bold py-3 rounded-xl text-xs"
            >
              Guardar Cambios
            </button>
          </form>
        </div>
      )}

      {/* Modal Checkout / Finalizar Pedido */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <form
            onSubmit={sendWhatsAppOrder}
            className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-950 text-lg">Confirmar Pedido</h3>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="bg-slate-100 p-2 rounded-full text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Nombre Completo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Dirección de Entrega:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Calle Principal #12"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1 mb-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" /> Forma de Pago:
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="Transferencia / Depósito">Transferencia / Depósito Bancario</option>
                  <option value="Pago contra Entrega (Efectivo)">Pago contra Entrega (Efectivo)</option>
                </select>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Final</span>
                <span className="text-lg font-black text-slate-950">${totalPrice.toFixed(2)} USD</span>
              </div>
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg"
              >
                Enviar por WhatsApp <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Barra Flotante de Compra */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-4 right-4 max-w-xl mx-auto z-40">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-3xl shadow-2xl flex items-center justify-between font-bold text-sm border border-emerald-400/30 backdrop-blur-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-700/60 flex items-center justify-center font-black text-sm border border-white/20">
                {totalItems}
              </div>
              <div className="text-left">
                <p className="text-xs text-emerald-100 font-medium leading-none">Tu Carrito</p>
                <p className="font-extrabold text-white text-sm mt-1 flex items-center gap-1">
                  Finalizar Pedido <ArrowRight className="w-4 h-4 ml-0.5" />
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
