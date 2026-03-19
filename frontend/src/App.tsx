import { useState, useEffect } from 'react';
import './index.css';

import type { Product, Supermarket } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SupermarketsBar } from './components/SupermarketsBar';
import { ProductGrid } from './components/ProductGrid';
import { CartSidebar } from './components/CartSidebar';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export default function App() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Product[]>(() => {
    const saved = localStorage.getItem('ahorroTucCart');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTotals, setCartTotals] = useState<{ sortedTotals: [string, number][], maxSavings: number } | null>(null);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch supermarkets once
  useEffect(() => {
    fetch(`${API}/api/supermarkets`)
      .then(r => r.json())
      .then(setSupermarkets)
      .catch(console.error);
  }, []);

  // Fetch products when debounced query changes
  useEffect(() => {
    setLoading(true);
    const url = debouncedQuery
      ? `${API}/api/products?q=${encodeURIComponent(debouncedQuery)}`
      : `${API}/api/products`;

    fetch(url)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedQuery]);

  // Cart totals from backend optimization
  useEffect(() => {
    if (cart.length === 0 || supermarkets.length === 0) {
      setCartTotals(null);
      return;
    }
    const productIds = cart.map(p => p.id);
    fetch(`${API}/api/optimize-cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productIds })
    })
      .then(r => r.json())
      .then(setCartTotals)
      .catch(console.error);
  }, [cart, supermarkets]);

  // Save cart to local storage consistently (Fase 2.5)
  useEffect(() => {
    localStorage.setItem('ahorroTucCart', JSON.stringify(cart));
  }, [cart]);

  // Helpers
  const getSup = (id: string) => supermarkets.find(s => s.id === id);
  const getCheapest = (prices: Record<string, number>) => {
    return Object.entries(prices).sort((a, b) => a[1] - b[1])[0];
  };

  const removeFromCart = (idx: number) => setCart(c => c.filter((_, i) => i !== idx));
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('ahorroTucCart');
  };

  return (
    <div className="app-container">
      <Header cartCount={cart.length} onOpenCart={() => setIsCartOpen(true)} />

      <Hero query={query} setQuery={setQuery} />

      <SupermarketsBar supermarkets={supermarkets} />

      <ProductGrid
        loading={loading}
        products={products}
        debouncedQuery={debouncedQuery}
        getSup={getSup}
        getCheapest={getCheapest}
        onAddToCart={(p) => setCart(c => [...c, p])}
      />

      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        removeFromCart={removeFromCart}
        clearCart={clearCart}
        cartTotals={cartTotals}
        getSup={getSup}
      />
    </div>
  );
}
