import { prisma } from '../db/client';
import { Prisma } from '@prisma/client';

// ── Types ────────────────────────────────────────────────────────────────────
// Tipo de retorno consistente con lo que el frontend espera
interface ProductWithPrices {
    id: number;
    name: string;
    category: string;
    image: string;
    brand: string | null;
    weight: string | null;
    ean: string | null;
    prices: Record<string, number>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildProductWithPrices(product: any): ProductWithPrices {
    const prices: Record<string, number> = {};
    if (product.currentPrices) {
        for (const p of product.currentPrices) {
            prices[p.supermarketId] = p.price;
        }
    }
    return {
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.imageUrl,
        brand: product.brand ?? null,
        weight: product.weight ?? null,
        ean: product.ean ?? null,
        prices,
    };
}

// Include clause reutilizable para traer precios junto con productos
const withCurrentPrices = {
    currentPrices: {
        select: {
            supermarketId: true,
            price: true,
        },
    },
} satisfies Prisma.ProductInclude;

// ── Repository ────────────────────────────────────────────────────────────────
export const SupermarketRepository = {
    findAll() {
        return prisma.supermarket.findMany({
            orderBy: { name: 'asc' },
            select: { id: true, name: true, color: true, logo: true },
        });
    },
};

export const ProductRepository = {
    async findAll(): Promise<ProductWithPrices[]> {
        const products = await prisma.product.findMany({
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
            include: withCurrentPrices,
        });
        return products.map(buildProductWithPrices);
    },

    async findByIds(ids: number[]): Promise<ProductWithPrices[]> {
        const products = await prisma.product.findMany({
            where: { id: { in: ids } },
            include: withCurrentPrices,
        });
        return products.map(buildProductWithPrices);
    },

    /**
     * Búsqueda difusa (Fuzzy Search) usando pg_trgm.
     * Utiliza el operador de similaridad `%` de PostgreSQL para encontrar
     * productos incluso con errores de tipeo.
     * Fallback: si no hay resultados difusos, intenta un ILIKE clásico.
     */
    async search(query: string): Promise<ProductWithPrices[]> {
        // Primero intentamos con Fuzzy Search usando pg_trgm
        // similarity() devuelve un score entre 0 y 1
        const products = await prisma.$queryRaw<any[]>`
            SELECT p.id, p.name, p.category, p.image_url AS "imageUrl",
                   p.brand, p.weight, p.ean,
                   similarity(p.name, ${query}) AS score
            FROM "Product" p
            WHERE similarity(p.name, ${query}) > 0.1
               OR p.name ILIKE ${'%' + query + '%'}
               OR p.category ILIKE ${'%' + query + '%'}
            ORDER BY score DESC, p.name ASC
            LIMIT 50
        `;

        // Para cada producto encontrado, obtenemos sus precios
        if (products.length === 0) return [];

        const productIds = products.map((p: any) => p.id);
        const prices = await prisma.price.findMany({
            where: { productId: { in: productIds } },
            select: { productId: true, supermarketId: true, price: true },
        });

        // Agrupamos los precios por productId
        const priceMap: Record<number, Record<string, number>> = {};
        for (const p of prices) {
            if (!priceMap[p.productId]) priceMap[p.productId] = {};
            priceMap[p.productId][p.supermarketId] = p.price;
        }

        return products.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            image: p.imageUrl,
            brand: p.brand ?? null,
            weight: p.weight ?? null,
            ean: p.ean ?? null,
            prices: priceMap[p.id] || {},
        }));
    },

    async getPriceHistory(productId: number, supermarketId: string) {
        return prisma.priceHistory.findMany({
            where: { productId, supermarketId },
            orderBy: { date: 'desc' },
            take: 30,
            select: { price: true, date: true, sourceUrl: true },
        });
    },
};
