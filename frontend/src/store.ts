import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem, Supermarket } from './types';

interface CartState {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    mergeWithCart: (items: { product: Product, quantity: number }[]) => void;
    hasSeenPersistenceWarning: boolean;
    setHasSeenPersistenceWarning: (val: boolean) => void;
}

interface SupermarketState {
    supermarkets: Supermarket[];
    setSupermarkets: (supermarkets: Supermarket[]) => void;
    getSupermarket: (id: string) => Supermarket | undefined;
}

interface ComparisonState {
    comparedProducts: Product[];
    toggleCompare: (product: Product) => void;
    clearComparison: () => void;
}

// ── Cart Store ─────────────────────────────────────────────────────────────────
export const useCartStore = create<CartState>()(
    persist(
        (set) => ({
            cart: [],
            addToCart: (product) => set((state) => {
                const existing = state.cart.find(i => i.product.id === product.id);
                if (existing) {
                    return {
                        cart: state.cart.map(i =>
                            i.product.id === product.id
                                ? { ...i, quantity: i.quantity + 1 }
                                : i
                        )
                    };
                }
                return { cart: [...state.cart, { product, quantity: 1 }] };
            }),
            removeFromCart: (productId) => set((state) => ({
                cart: state.cart.filter(i => i.product.id !== productId)
            })),
            updateQuantity: (productId, quantity) => set((state) => ({
                cart: quantity <= 0
                    ? state.cart.filter(i => i.product.id !== productId)
                    : state.cart.map(i =>
                        i.product.id === productId
                            ? { ...i, quantity }
                            : i
                    )
            })),
            clearCart: () => set({ cart: [] }),
            mergeWithCart: (items) => set((state) => {
                const newCart = [...state.cart];
                for (const item of items) {
                    const existingIndex = newCart.findIndex(i => i.product.id === item.product.id);
                    if (existingIndex >= 0) {
                        newCart[existingIndex] = {
                            ...newCart[existingIndex],
                            quantity: newCart[existingIndex].quantity + item.quantity
                        };
                    } else {
                        newCart.push(item);
                    }
                }
                return { cart: newCart };
            }),
            hasSeenPersistenceWarning: false,
            setHasSeenPersistenceWarning: (val) => set({ hasSeenPersistenceWarning: val }),
        }),
        {
            name: 'ahorroTucCart-zustand',
        }
    )
);

// ── Supermarket Store (elimina prop drilling de getSup) ────────────────────────
export const useSupermarketStore = create<SupermarketState>()((set, get) => ({
    supermarkets: [],
    setSupermarkets: (supermarkets) => set({ supermarkets }),
    getSupermarket: (id) => get().supermarkets.find(s => s.id === id),
}));

// ── Comparison Store ───────────────────────────────────────────────────────────
export const useComparisonStore = create<ComparisonState>()((set) => ({
    comparedProducts: [],
    toggleCompare: (product) => set((state) => {
        const isSelected = state.comparedProducts.find(p => p.id === product.id);
        if (isSelected) {
            return { comparedProducts: state.comparedProducts.filter(p => p.id !== product.id) };
        }
        if (state.comparedProducts.length >= 4) {
            return state; // Límite de 4 productos
        }
        return { comparedProducts: [...state.comparedProducts, product] };
    }),
    clearComparison: () => set({ comparedProducts: [] })
}));

// ── Helpers reutilizables ──────────────────────────────────────────────────────
export function getCheapest(prices: Record<string, number>): [string, number] | null {
    const entries = Object.entries(prices);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => a[1] - b[1])[0];
}
