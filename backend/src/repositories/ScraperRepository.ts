import { prisma } from '../db/client';

export interface ScraperPriceUpdate {
    productId: number;
    price: number;
    unitPrice?: number | null;
    sourceUrl?: string;
}

export const ScraperRepository = {
    /**
     * Cachea todos los productos de la BD en memoria para cruzarlos con el scraper.
     */
    async getAllProductsForMatching() {
        return prisma.product.findMany({
            select: { id: true, name: true, ean: true, unitValue: true, unitType: true }
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
