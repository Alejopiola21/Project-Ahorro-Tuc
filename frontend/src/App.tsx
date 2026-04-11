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
import { useAuthStore } from './store/authStore';
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
  const { cartTotals, isOptimizing } = useCartOptimizer();

  // 3. Zustand Stores para lógica de UI global
  const cart = useCartStore(state => state.cart);
  const addToCart = useCartStore(state => state.addToCart);

  const setSupermarkets = useSupermarketStore(state => state.setSupermarkets);
  const checkAuth = useAuthStore(state => state.checkAuth);

  const hasSeenPersistenceWarning = useCartStore(state => state.hasSeenPersistenceWarning);
  const setHasSeenPersistenceWarning = useCartStore(state => state.setHasSeenPersistenceWarning);

  // Verificar auth y persistencia al montar la app
  useEffect(() => {
    checkAuth();

    // 1. Verificar si localStorage está disponible y funcional
    let storageAvailable = false;
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      storageAvailable = true;
    } catch (e) {
      storageAvailable = false;
    }

    if (!storageAvailable) {
      toast.error('Storage no disponible. Tu lista se perderá al cerrar esta pestaña.', {
        duration: Infinity,
        id: 'storage-blocked-warning',
        description: 'Parece que estás en modo incógnito estricto o tenés el almacenamiento bloqueado.'
      });
      return;
    }

    // 2. Mostrar aviso informativo una sola vez para nuevos usuarios
    if (!hasSeenPersistenceWarning) {
      setTimeout(() => {
        toast.info('💡 Tu lista se guarda localmente en este navegador.', {
          description: 'Si limpiás el historial o cambiás de navegador, tu lista no estará disponible.',
          duration: 10000,
          id: 'persistence-tip',
          action: {
            label: 'Entendido',
            onClick: () => setHasSeenPersistenceWarning(true)
          }
        });
        // Marcar como visto para que no moleste en la siguiente carga
        setHasSeenPersistenceWarning(true);
      }, 2000);
    }
  }, [checkAuth, hasSeenPersistenceWarning, setHasSeenPersistenceWarning]);

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
        isOptimizing={isOptimizing}
      />

      <Footer />
    </div>
  );
}
