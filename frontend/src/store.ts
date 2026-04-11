import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem, Supermarket } from './types';

interface CartState {
    cart: CartItem[];
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
    hasSeenPersistenceWarning: boolean;
    setHasSeenPersistenceWarning: (val: boolean) => void;
}

interface SupermarketState {
    supermarkets: Supermarket[];
    setSupermarkets: (supermarkets: Supermarket[]) => void;
    getSupermarket: (id: string) => Supermarket | undefined;
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
            },
            clearCart: () => set({ cart: [] }),
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

// ── Helpers reutilizables ──────────────────────────────────────────────────────
export function getCheapest(prices: Record<string, number>): [string, number] | null {
    const entries = Object.entries(prices);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => a[1] - b[1])[0];
}
