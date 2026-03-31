import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import './index.css';

import type { Product } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SupermarketsBar } from './components/SupermarketsBar';
import { CategoryNav } from './components/CategoryNav';
import { ProductGrid } from './components/ProductGrid';
import { CartSidebar } from './components/CartSidebar';
import { Footer } from './components/Footer';

// Hooks & Store
import { api } from './api';
import { useCartStore, useSupermarketStore } from './store';
import { useProductSearch } from './hooks/useProductSearch';
import { useCartOptimizer } from './hooks/useCartOptimizer';

export default function App() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  // 1. Lógica de Búsqueda completamente encapsulada
  const { 
    query, setQuery, debouncedQuery, 
    activeCategory, setActiveCategory,
    products, loading 
  } = useProductSearch();

  // 2. Lógica de Optimización de Carrito encapsulada (se suscribe autonómicamente)
  const { cartTotals } = useCartOptimizer();

  // 3. Zustand Stores para lógica de UI global
  const cart = useCartStore(state => state.cart);
  const addToCart = useCartStore(state => state.addToCart);
  
  const setSupermarkets = useSupermarketStore(state => state.setSupermarkets);

  // Carga inicial de datos estáticos (Supermercados) - Este es el único fetch que queda aquí
  // porque necesita correr solo una vez on-mount para popular el Zustand store base.
  useEffect(() => {
    api.get('/supermarkets')
      .then(r => setSupermarkets(r.data))
      .catch((e) => console.error("Error cargando supermercados:", e)); 
  }, [setSupermarkets]);

  // Helpers de UI
  const handleAddToCart = (p: Product) => {
    addToCart(p);
    const existing = cart.find(i => i.product.id === p.id);
    toast.success(
      existing
        ? `${p.name} — cantidad actualizada ✅`
        : `${p.name} agregado a tu lista ✅`,
      { duration: 2000 }
    );
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="app-container">
      <Toaster position="bottom-right" richColors />
      <Header cartCount={totalItems} onOpenCart={() => setIsCartOpen(true)} />

      <Hero query={query} setQuery={setQuery} />
      
      <SupermarketsBar />
      
      <CategoryNav 
        activeCategory={activeCategory} 
        onSelect={(cat) => setActiveCategory(cat)} 
      />

      <ProductGrid
        loading={loading}
        products={products}
        debouncedQuery={debouncedQuery}
        onAddToCart={handleAddToCart}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartTotals={cartTotals}
      />

      <Footer />
    </div>
  );
}
