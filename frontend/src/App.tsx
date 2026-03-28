import { useState, useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import './index.css';

import type { Product, CartTotals } from './types';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SupermarketsBar } from './components/SupermarketsBar';
import { ProductGrid } from './components/ProductGrid';
import { CartSidebar } from './components/CartSidebar';
import { Footer } from './components/Footer';

import { api } from './api';
import { useCartStore, useSupermarketStore } from './store';

export default function App() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartTotals, setCartTotals] = useState<CartTotals | null>(null);

  // Zustand Stores
  const cart = useCartStore(state => state.cart);
  const addToCart = useCartStore(state => state.addToCart);
  const supermarkets = useSupermarketStore(state => state.supermarkets);
  const setSupermarkets = useSupermarketStore(state => state.setSupermarkets);

  // Debounce search query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch supermarkets once
  useEffect(() => {
    api.get('/supermarkets')
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

  // Optimize Cart via Backend (with debounce)
  useEffect(() => {
    if (cart.length === 0 || supermarkets.length === 0) {
      setCartTotals(null);
      return;
    }

    const timer = setTimeout(() => {
      const productIds = cart.map(item => item.product.id);
      api.post<CartTotals>('/optimize-cart', { productIds })
        .then(r => setCartTotals(r.data))
        .catch(() => { });
    }, 500);

    return () => clearTimeout(timer);
  }, [cart, supermarkets]);

  // Helpers
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
