export interface Supermarket { id: string; name: string; color: string; logo: string; }
export interface Product { id: number; name: string; category: string; image: string; prices: Record<string, number>; }
