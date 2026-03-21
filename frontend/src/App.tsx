import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import './index.css';

import type { Product, Supermarket } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SupermarketsBar } from './components/SupermarketsBar';
import { ProductGrid } from './components/ProductGrid';
import { CartSidebar } from './components/CartSidebar';

import { api } from './api';
import { useCartStore } from './store';

export default function App() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTotals, setCartTotals] = useState<{ sortedTotals: [string, number][], maxSavings: number } | null>(null);

  // Zustand Store
  const cart = useCartStore(state => state.cart);
  const addToCart = useCartStore(state => state.addToCart);
  // Optional, if you want local references: removeFromCart & clearCart

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch supermarkets once
  useEffect(() => {
    api.get<Supermarket[]>('/supermarkets')
      .then(r => setSupermarkets(r.data))
      .catch(() => { }); // handled by interceptor
  }, []);

  // Fetch products
  useEffect(() => {
    setLoading(true);
    const params = debouncedQuery ? { q: debouncedQuery } : {};

    api.get<Product[]>('/products', { params })
      .then(r => setProducts(r.data))
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  // Optimize Cart via Backend calculation
  useEffect(() => {
    if (cart.length === 0 || supermarkets.length === 0) {
      setCartTotals(null);
      return;
    }
    const productIds = cart.map(p => p.id);
    api.post<{ sortedTotals: [string, number][], maxSavings: number }>('/optimize-cart', { productIds })
      .then(r => setCartTotals(r.data))
      .catch(() => { });
  }, [cart, supermarkets]);

  // Helpers
  const getSup = (id: string) => supermarkets.find(s => s.id === id);
  const getCheapest = (prices: Record<string, number>) => {
    return Object.entries(prices).sort((a, b) => a[1] - b[1])[0];
  };

  const handleAddToCart = (p: Product) => {
    addToCart(p);
    toast.success(`${p.name} agregado a tu lista ✅`, {
      duration: 2000,
    });
  };

  return (
    <div className="app-container">
      <Toaster position="bottom-right" richColors />
      <Header cartCount={cart.length} onOpenCart={() => setIsCartOpen(true)} />

      <Hero query={query} setQuery={setQuery} />

      <SupermarketsBar supermarkets={supermarkets} />

      <ProductGrid
        loading={loading}
        products={products}
        debouncedQuery={debouncedQuery}
        getSup={getSup}
        getCheapest={getCheapest}
        onAddToCart={handleAddToCart}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartTotals={cartTotals}
        getSup={getSup}
      />
    </div>
  );
}

