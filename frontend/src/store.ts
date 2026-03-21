import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from './types';

interface CartState {
    cart: Product[];
    addToCart: (product: Product) => void;
    removeFromCart: (index: number) => void;
    clearCart: () => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            cart: [],
            addToCart: (product) => set((state) => ({ cart: [...state.cart, product] })),
            removeFromCart: (index) => set((state) => ({ cart: state.cart.filter((_, i) => i !== index) })),
            clearCart: () => set({ cart: [] })
        }),
        {
            name: 'ahorroTucCart-zustand', // Storage name
        }
    )
);
