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
     */
    async createProduct(data: NewProductData) {
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
     * Crea un nuevo precio para un producto y supermercado
     */
    async createPrice(data: NewPriceData) {
        return prisma.price.create({
            data: {
                productId: data.productId,
                supermarketId: data.supermarketId,
                price: data.price,
                unitPrice: data.unitPrice,
            }
        });
    },

    /**
     * Inyecta cientos de actualizaciones de precios en un solo viaje de red ($transaction).
     * Esto salva enormemente la latencia con bases de datos Cloud (como Neon).
     */
    async batchUpdatePrices(supermarketId: string, updates: ScraperPriceUpdate[]) {
        if (updates.length === 0) return;

        console.log(`[ScraperRepository] Compilando ${updates.length * 2} transacciones para inyección en bloque...`);

        const transactionOperations = [];

        for (const update of updates) {
            // Upsert al precio actual
            transactionOperations.push(
                prisma.price.upsert({
                    where: {
                        productId_supermarketId: {
                            productId: update.productId,
                            supermarketId: supermarketId
                        }
                    },
                    update: { price: update.price, unitPrice: update.unitPrice, updatedAt: new Date() },
                    create: { productId: update.productId, supermarketId: supermarketId, price: update.price, unitPrice: update.unitPrice }
                })
            );

            // Registro en historial
            transactionOperations.push(
                prisma.priceHistory.create({
                    data: {
                        productId: update.productId,
                        supermarketId: supermarketId,
                        price: update.price,
                        sourceUrl: update.sourceUrl,
                        date: new Date()
                    }
                })
            );
        }

        await prisma.$transaction(transactionOperations);
        console.log(`[ScraperRepository] Transacción masiva completada exitosamente.`);
    }
};
