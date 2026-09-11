"use client";

import React, { useState } from "react";
import { ShoppingBag, Plus, Minus, Send, Check } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
}

interface CartItem extends Product {
  quantity: number;
}

const PRODUCTS: Product[] = [
  {
    id: 1,
    name: "Hamburguesa Clásica PediClick",
    description: "Carne 100% de res, queso cheddar, lechuga fresca y salsa especial.",
    price: 8.5,
    category: "Hamburguesas",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: 2,
    name: "Pizza Pepperoni Especial",
    description: "Masa artesanal, salsa de tomate casera, doble queso mozzarella y pepperoni.",
    price: 12.0,
    category: "Pizzas",
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: 3,
    name: "Papas Fritas Cónicas",
    description: "Papas crujientes con sazón de la casa y baño de queso fundido.",
    price: 4.0,
    category: "Acompañantes",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60",
  },
  {
    id: 4,
    name: "Jugo Natural de Naranja",
    description: "Recién exprimido, 100% fruta natural sin azúcar añadida.",
    price: 3.0,
    category: "Bebidas",
    image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=500&auto=format&fit=crop&q=60",
  },
];

export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState("8090000000"); // Número del negocio de prueba
  const [address, setAddress] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const sendWhatsAppOrder = () => {
    if (cart.length === 0) return;

    let message = `🛒 *NUEVO PEDIDO - PEDICLICK*\n\n`;
    cart.forEach((item) => {
      message += `• ${item.quantity}x *${item.name}* ($${(item.price * item.quantity).toFixed(2)})\n`;
    });
    message += `\n💰 *Total a Pagar:* $${total.toFixed(2)}\n`;
    if (address) {
      message += `📍 *Dirección de Entrega:* ${address}\n`;
    }
    message += `\n_Enviado desde PediClick.app_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 text-slate-800">
      {/* Header del Negocio */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">PediClick Demo</h1>
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Abierto ahora • Pedidos por WhatsApp
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-semibold">
            PediClick
          </span>
        </div>
      </header>

      {/* Lista de Productos */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Nuestro Menú</h2>

        <div className="space-y-4">
          {PRODUCTS.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-sm flex gap-3 items-center"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-20 h-20 rounded-xl object-cover bg-slate-100"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-slate-900 text-sm truncate">
                  {product.name}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                  {product.description}
                </p>
                <p className="text-sm font-bold text-slate-900 mt-2">
                  ${product.price.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => addToCart(product)}
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center shrink-0 active:scale-95 transition-transform"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </main>

      {/* Barra / Botón Flotante del Carrito */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto z-20">
          <button
            onClick={() => setIsCartOpen(!isCartOpen)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-4 shadow-lg shadow-emerald-600/30 flex items-center justify-between font-medium active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="bg-emerald-800/40 px-2.5 py-1 rounded-lg text-xs font-bold">
                {totalItems}
              </div>
              <span>Ver Pedido</span>
            </div>
            <span className="font-bold text-lg">${total.toFixed(2)}</span>
          </button>
        </div>
      )}

      {/* Modal / Resumen del Carrito */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5" /> Resumen de Tu Pedido
              </h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-3 divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.id} className="pt-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      ${item.price.toFixed(2)} x {item.quantity} = ${
                        (item.price * item.quantity).toFixed(2)
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Dirección de entrega (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ej: Calle Principal #12, Apto 2B"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-3 border-t flex justify-between items-center text-slate-900">
              <span className="font-bold">Total a pagar:</span>
              <span className="font-extrabold text-xl">${total.toFixed(2)}</span>
            </div>

            <button
              onClick={sendWhatsAppOrder}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl py-3.5 font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-transform"
            >
              <Send className="w-4 h-4" /> Enviar Pedido a WhatsApp
            </button>
          </div>
        </div>
      )}
    </div>
  );
}