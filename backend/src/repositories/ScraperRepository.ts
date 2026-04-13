import { prisma } from '../db/client';

export interface ScraperPriceUpdate {
    productId: number;
    price: number;
    unitPrice?: number | null;
    sourceUrl?: string;
}

export interface NewProductData {
    name: string;
    category: string;
    imageUrl: string | null;
    brand: string | null;
    ean: string | null;
    weight: string | null;
    unitValue: number | null;
    unitType: string | null;
}

export interface NewPriceData {
    productId: number;
    supermarketId: string;
    price: number;
    unitPrice: number | null;
    sourceUrl: string | undefined;
}

export const ScraperRepository = {
    /**
     * Cachea todos los productos de la BD en memoria para cruzarlos con el scraper.
     */
    async getAllProductsForMatching() {
        return prisma.product.findMany({
            select: { id: true, name: true, ean: true, unitValue: true, unitType: true, category: true, brand: true }
        });
    },

    /**
     * Cachea todos los alias de este supermercado guardados en la BD.
     */
    async getAllAliases(supermarketId: string) {
        return prisma.productAlias.findMany({
            where: { supermarketId },
            select: { originalName: true, productId: true }
        });
    },

    /**
     * Crea un nuevo producto en la base de datos (para productos scrapeados que no existían)
     * Si ya existe un producto con el mismo EAN, lo retorna en lugar de crear uno nuevo.
     */
    async createProduct(data: NewProductData) {
        // Si tiene EAN, verificar si ya existe para evitar unique constraint error
        if (data.ean) {
            const existing = await prisma.product.findFirst({
                where: { ean: data.ean }
            });
            if (existing) {
                return existing;
            }
        }

        return prisma.product.create({
            data: {
                name: data.name,
                category: data.category,
                imageUrl: data.imageUrl || '',
                brand: data.brand,
                ean: data.ean,
                weight: data.weight,
                unitValue: data.unitValue,
                unitType: data.unitType,
            }
        });
    },

    /**
     * Crea o actualiza un precio para un producto y supermercado
     */
    async createPrice(data: NewPriceData) {
        return prisma.price.upsert({
            where: {
                productId_supermarketId: {
                    productId: data.productId,
                    supermarketId: data.supermarketId,
                }
            },
            update: {
                price: data.price,
                unitPrice: data.unitPrice,
            },
            create: {
                productId: data.productId,
                supermarketId: data.supermarketId,
                price: data.price,
                unitPrice: data.unitPrice,
            }
        });
    },

    /**
     * Inyecta cientos de actualizaciones de precios.
     * Neon tiene un timeout de transacción de 5s muy restrictivo.
     * Estrategia: upserts individuales fuera de transacción + historial batch.
     */
    async batchUpdatePrices(supermarketId: string, updates: ScraperPriceUpdate[]) {
        if (updates.length === 0) return;

        console.log(`[ScraperRepository] Actualizando ${updates.length} precios (modo Neon-safe)...`);

        // Upserts individuales fuera de transacción para evitar Neon timeout
        let upserted = 0;
        for (let i = 0; i < updates.length; i++) {
            const update = updates[i];
            try {
                await prisma.price.upsert({
                    where: {
                        productId_supermarketId: {
                            productId: update.productId,
                            supermarketId: supermarketId
                        }
                    },
                    update: { price: update.price, unitPrice: update.unitPrice, updatedAt: new Date() },
                    create: { productId: update.productId, supermarketId: supermarketId, price: update.price, unitPrice: update.unitPrice }
                });
                upserted++;
            } catch (err) {
                console.warn(`[ScraperRepository] ⚠️ Error upsert producto ${update.productId}: ${(err as Error).message}`);
            }
        }

        console.log(`[ScraperRepository] ✅ ${upserted}/${updates.length} precios actualizados. Insertando historial...`);

        // Insertar price history individualmente con manejo de duplicados
        let historyInserted = 0;
        for (let i = 0; i < updates.length; i++) {
            const update = updates[i];
            try {
                // Offset de milisegundos para evitar duplicate constraint en recorded_at
                const dateWithOffset = new Date(Date.now() + i);
                await prisma.priceHistory.create({
                    data: {
                        productId: update.productId,
                        supermarketId: supermarketId,
                        price: update.price,
                        sourceUrl: update.sourceUrl,
                        date: dateWithOffset
                    }
                });
                historyInserted++;
            } catch (err) {
                // Ignorar duplicados silenciosamente
                if (!(err as any).code || (err as any).code !== 'P2002') {
                    console.warn(`[ScraperRepository] ⚠️ Skip historial producto ${update.productId}: ${(err as Error).message}`);
                }
            }
        }

        console.log(`[ScraperRepository] ✅ ${historyInserted}/${updates.length} registros de historial insertados.`);
    }
};
