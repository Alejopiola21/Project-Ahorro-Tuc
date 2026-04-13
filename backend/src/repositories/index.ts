import { prisma } from '../db/client';
import { Prisma } from '@prisma/client';
import { globalSearch } from '../services/SearchService';

// ── Types ────────────────────────────────────────────────────────────────────
// Tipo de retorno consistente con lo que el frontend espera
interface ProductWithPrices {
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

// Include clause reutilizable para traer precios junto con productos
const withCurrentPrices = {
    currentPrices: {
        select: {
            supermarketId: true,
            price: true,
            unitPrice: true,
        },
    },
} satisfies Prisma.ProductInclude;

// Tipo inferido de Prisma para Product con precios incluidos
type ProductWithPricesPayload = Prisma.ProductGetPayload<{ include: typeof withCurrentPrices }>;

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildProductWithPrices(product: ProductWithPricesPayload): ProductWithPrices {
    const prices: Record<string, number> = {};
    const unitPrices: Record<string, number | null> = {};
    if (product.currentPrices) {
        for (const p of product.currentPrices) {
            prices[p.supermarketId] = p.price;
            unitPrices[p.supermarketId] = p.unitPrice;
        }
    }
    return {
        id: product.id,
        name: product.name,
        category: product.category,
        image: product.imageUrl,
        brand: product.brand ?? null,
        weight: product.weight ?? null,
        unitValue: product.unitValue ?? null,
        unitType: product.unitType ?? null,
        ean: product.ean ?? null,
        prices,
        unitPrices,
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
        limit: number = 50,
        filters?: {
            minPrice?: number;
            maxPrice?: number;
            brands?: string[];
            inStock?: boolean;
            sortBy?: 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'brand_asc' | 'brand_desc';
        }
    ): Promise<{ products: ProductWithPrices[]; nextCursor: number | null }> {
        const safeLimit = Math.min(limit, 100);

        // Construir WHERE clause con filtros avanzados
        const whereClause: Prisma.ProductWhereInput = {
            ...(category && category !== 'Todas' ? { category: { equals: category, mode: 'insensitive' } } : {}),
        };

        // Filtro por marcas
        if (filters?.brands && filters.brands.length > 0) {
            whereClause.brand = { in: filters.brands };
        }

        // Filtro de stock: al menos un precio > 0
        if (filters?.inStock) {
            whereClause.currentPrices = {
                some: {
                    price: { gt: 0 },
                },
            };
        }

        // Determinar ordenamiento
        let orderBy: Prisma.ProductOrderByWithRelationInput[] = [{ id: 'asc' }];
        if (filters?.sortBy) {
            switch (filters.sortBy) {
                case 'price_asc':
                    orderBy = [{ name: 'asc' }]; // Se ordena post-query por precio
                    break;
                case 'price_desc':
                    orderBy = [{ name: 'asc' }];
                    break;
                case 'name_asc':
                    orderBy = [{ name: 'asc' }];
                    break;
                case 'name_desc':
                    orderBy = [{ name: 'desc' }];
                    break;
                case 'brand_asc':
                    orderBy = [{ brand: 'asc' }, { name: 'asc' }];
                    break;
                case 'brand_desc':
                    orderBy = [{ brand: 'desc' }, { name: 'asc' }];
                    break;
            }
        }

        const products = await prisma.product.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            orderBy,
            take: safeLimit + 1,
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            include: withCurrentPrices,
        });

        const hasMore = products.length > safeLimit;
        const nextCursor = hasMore ? products[products.length - 1].id : null;
        if (hasMore) products.pop();

        let resultProducts = products.map(buildProductWithPrices);

        // Aplicar filtros de precio (post-query porque necesitamos prices calculado)
        if (filters?.minPrice || filters?.maxPrice) {
            resultProducts = resultProducts.filter(p => {
                const minPrice = Math.min(...Object.values(p.prices).filter(pr => pr > 0));
                if (isNaN(minPrice)) return false;
                if (filters.minPrice && minPrice < filters.minPrice) return false;
                if (filters.maxPrice && minPrice > filters.maxPrice) return false;
                return true;
            });
        }

        // Ordenar por precio si es necesario
        if (filters?.sortBy === 'price_asc' || filters?.sortBy === 'price_desc') {
            resultProducts.sort((a, b) => {
                const minA = Math.min(...Object.values(a.prices).filter(p => p > 0));
                const minB = Math.min(...Object.values(b.prices).filter(p => p > 0));
                const priceA = isNaN(minA) ? Infinity : minA;
                const priceB = isNaN(minB) ? Infinity : minB;
                return filters.sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
            });
        }

        return {
            products: resultProducts,
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
        // 1. Intentar búsqueda rápida con MeiliSearch (Escalabilidad NoSQL)
        if (globalSearch.isAvailable()) {
            const productIds = await globalSearch.search(query, { category, limit: 100 });

            if (productIds && productIds.length > 0) {
                // Traer datos completos y precios de los IDs encontrados
                return this.findByIds(productIds);
            }
        }

        // 2. Fallback: Búsqueda nativa de Prisma (pg_trgm o contains)
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

// ── Brand Repository ──────────────────────────────────────────────────────────
export const BrandRepository = {
    async findAll(): Promise<string[]> {
        const brands = await prisma.product.findMany({
            where: {
                brand: { not: null },
            },
            select: { brand: true },
        });

        const uniqueBrands = [...new Set(brands.map(b => b.brand).filter((b): b is string => b !== null))];
        return uniqueBrands.sort();
    },
};

