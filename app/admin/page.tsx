"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Store, Package, Check } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
}

export default function AdminPage() {
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeId, setStoreId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);

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
  }, [storeId]);

  // Agregar nuevo producto
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
        image_url: imageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60",
      },
    ]);

    setLoading(false);
    if (error) {
      alert("Error al agregar producto");
      console.error(error);
    } else {
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      fetchProducts();
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (id: string) => {
    const { error } = await supabase.from("pediclick_products").delete().eq("id", id);
    if (!error) fetchProducts();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 max-w-lg mx-auto text-slate-800 space-y-6">
      <header className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <Store className="w-6 h-6 text-emerald-600" />
        <div>
          <h1 className="font-bold text-slate-900">Panel Admin - PediClick</h1>
          <p className="text-xs text-slate-500">Configura tu tienda y menú</p>
        </div>
      </header>

      {/* Paso 1: Configurar Negocio */}
      {!storeId ? (
        <form onSubmit={handleSaveStore} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
            <Store className="w-4 h-4" /> 1. Registra tu Negocio
          </h2>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre del Negocio</label>
            <input
              type="text"
              placeholder="Ej: Pizzeria Roma"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp de Pedidos</label>
            <input
              type="text"
              placeholder="Ej: 8091234567"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Slug / Identificador URL</label>
            <input
              type="text"
              placeholder="Ej: pizzeria-roma"
              value={storeSlug}
              onChange={(e) => setStoreSlug(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 font-bold text-sm shadow-md transition-all"
          >
            {loading ? "Guardando..." : "Guardar y Continuar"}
          </button>
        </form>
      ) : (
        /* Paso 2: Agregar Productos */
        <div className="space-y-6">
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-800">Tienda Activa</p>
              <p className="font-bold text-emerald-950">{storeName}</p>
            </div>
            <span className="text-xs bg-emerald-200 text-emerald-800 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
              <Check className="w-3 h-3" /> Conectado
            </span>
          </div>

          <form onSubmit={handleAddProduct} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2 text-sm">
              <Package className="w-4 h-4" /> Agregar Nuevo Producto
            </h2>
            <input
              type="text"
              placeholder="Nombre del Producto"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              required
            />
            <input
              type="text"
              placeholder="Descripción breve"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Precio ($)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
              required
            />
            <input
              type="url"
              placeholder="URL Imagen (Opcional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> {loading ? "Guardando..." : "Agregar Producto"}
            </button>
          </form>

          {/* Lista de productos guardados */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Productos Registrados ({products.length})</h3>
            {products.map((p) => (
              <div key={p.id} className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-sm">
                <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{p.name}</p>
                  <p className="text-xs text-slate-500">${p.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}