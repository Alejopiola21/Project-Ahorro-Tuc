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
    ean: string | null;
    prices: Record<string, number>;
}

export interface CartItem {
    product: Product;
    quantity: number;
}

export interface CartTotals {
    sortedTotals: [string, number][];
    maxSavings: number;
    incompleteSupermarkets?: { id: string; name: string; missingProducts: number }[];
}
