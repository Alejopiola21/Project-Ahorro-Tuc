import { useState, useEffect } from 'react';
import { api } from '../api';
import { useCartStore, useSupermarketStore } from '../store';
import type { CartTotals } from '../types';

export function useCartOptimizer() {
  const [cartTotals, setCartTotals] = useState<CartTotals | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Hook natively binds to global store
  const cart = useCartStore(state => state.cart);
  const supermarkets = useSupermarketStore(state => state.supermarkets);

  useEffect(() => {
    if (cart.length === 0 || supermarkets.length === 0) {
      setCartTotals(null);
      setIsOptimizing(false);
      return;
    }

    setIsOptimizing(true);

    // Debounce to prevent multiple POSTs on fast clicks
    const timer = setTimeout(() => {
      const cartItems = cart.map(item => ({ productId: item.product.id, quantity: item.quantity }));
      api.post<CartTotals>('/optimize-cart', { cartItems })
        .then(r => {
          setCartTotals(r.data);
          setIsOptimizing(false);
        })
        .catch(e => {
          console.error("Optimize Cart Error:", e);
          setIsOptimizing(false);
        });
    }, 500);

    return () => clearTimeout(timer);
  }, [cart, supermarkets]);

  return { cartTotals, isOptimizing };
}
