export interface Supermarket {
    id: string;
    name: string;
    color: string;
    logo: string;
}

export interface Product {
    id: number;
    name: string;
    category: string;
    image: string;
    brand: string | null;
    weight: string | null;
    unitValue: number | null;
    unitType: string | null;
    ean: string | null;
    prices: Record<string, number>;
    unitPrices: Record<string, number | null>;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface HybridOptimization {
    supermarkets: [string, string];
    totalPrice: number;
    savingsFromSingle: number;
    splits: Record<string, {
        productId: number;
        name: string;
        price: number;
        quantity: number;
        totalPrice: number;
    }[]>;
}

export interface CartTotals {
    sortedTotals: [string, number][];
    maxSavings: number;
    incompleteSupermarkets?: { id: string; name: string; missingProducts: number }[];
    hybridOptimization?: HybridOptimization | null;
}

export interface User {
    id: string;
    email: string;
    name: string | null;
}

export interface AuthResponse {
    user: User;
    token: string;
}
