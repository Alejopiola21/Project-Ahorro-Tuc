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

// Include clause reutilizable para traer precios junto con productos
const withCurrentPrices = {
    currentPrices: {
        select: {
            supermarketId: true,
            price: true,
        },
    },
} satisfies Prisma.ProductInclude;

// Tipo inferido de Prisma para Product con precios incluidos
type ProductWithPricesPayload = Prisma.ProductGetPayload<{ include: typeof withCurrentPrices }>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildProductWithPrices(product: ProductWithPricesPayload): ProductWithPrices {
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
    async findAll(category?: string): Promise<ProductWithPrices[]> {
        const products = await prisma.product.findMany({
            where: category && category !== 'Todas' ? { category: { equals: category, mode: 'insensitive' } } : undefined,
            orderBy: [{ category: 'asc' }, { name: 'asc' }],
            take: 100, // Previene colapso si findAll es llamado directamente
            include: withCurrentPrices,
        });
        return products.map(buildProductWithPrices);
    },

    /**
     * Paginación por cursor para datasets grandes.
     * Retorna productos + cursor siguiente (o null si es el final).
     */
    async findAllPaginated(
        category?: string,
        cursor?: number,
        limit: number = 50
    ): Promise<{ products: ProductWithPrices[]; nextCursor: number | null }> {
        const safeLimit = Math.min(limit, 100);

        const products = await prisma.product.findMany({
            where: category && category !== 'Todas'
                ? { category: { equals: category, mode: 'insensitive' } }
                : undefined,
            orderBy: [{ id: 'asc' }],
            take: safeLimit + 1, // Pedimos 1 extra para saber si hay más
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            include: withCurrentPrices,
        });

        const hasMore = products.length > safeLimit;
        const nextCursor = hasMore ? products[products.length - 1].id : null;
        if (hasMore) products.pop();

        return {
            products: products.map(buildProductWithPrices),
            nextCursor,
        };
    },

    async findByIds(ids: number[]): Promise<ProductWithPrices[]> {
        const products = await prisma.product.findMany({
            where: { id: { in: ids } },
            include: withCurrentPrices,
        });
        return products.map(buildProductWithPrices);
    },

    async search(query: string, category?: string): Promise<ProductWithPrices[]> {
        // Implementación segura nativa de Prisma para evitar errores si pg_trgm no está habilitado
        const products = await prisma.product.findMany({
            where: {
                AND: [
                    category && category !== 'Todas' ? { category: { equals: category, mode: 'insensitive' } } : {},
                    {
                        OR: [
                            { name: { contains: query, mode: 'insensitive' } },
                            { category: { contains: query, mode: 'insensitive' } },
                            { brand: { contains: query, mode: 'insensitive' } }
                        ]
                    }
                ]
            },
            take: 50,
            include: withCurrentPrices
        });

        return products.map(buildProductWithPrices);
    },

    async getPriceHistory(productId: number, supermarketId?: string) {
        return prisma.priceHistory.findMany({
            where: {
                productId,
                supermarketId: supermarketId ? supermarketId : undefined
            },
            orderBy: { date: 'asc' }, // Recharts dibuja cronológicamente limpio (izq a der) con asc
            take: 120, // 4 meses si scrapea a diario en 1 super. Al ser múltiple lo expandimos
            select: { price: true, date: true, sourceUrl: true, supermarketId: true },
        });
    },
};

// ── Category Repository ───────────────────────────────────────────────────────
export const CategoryRepository = {
    async findAll(): Promise<{ name: string; count: number }[]> {
        const rawCategories = await prisma.product.groupBy({
            by: ['category'],
            _count: { _all: true },
            orderBy: { category: 'asc' },
        });

        return rawCategories
            .filter(c => c.category && c.category.trim() !== '')
            .map(c => ({ name: c.category, count: c._count._all }));
    },
};

