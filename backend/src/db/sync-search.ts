import { prisma } from './client';
import { globalSearch } from '../services/SearchService';

/**
 * Script de sincronización masiva para MeiliSearch.
 * Vuelca todos los productos de PostgreSQL al motor NoSQL.
 */
async function syncSearch() {
    console.log('🔄 Iniciando sincronización masiva PostgreSQL -> MeiliSearch...');
    const start = Date.now();

    try {
        const products = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                brand: true,
                category: true,
                ean: true,
                imageUrl: true
            }
        });

        console.log(`📦 Encontrados ${products.length} productos en la base de datos.`);

        if (products.length > 0) {
            await globalSearch.indexProducts(products);
            console.log('✅ Sincronización enviada a MeiliSearch.');
        } else {
            console.log('⚠️ No hay productos para indexar.');
        }

    } catch (err) {
        console.error('❌ Error fatal en sincronización de búsqueda:', err);
    } finally {
        const duration = (Date.now() - start) / 1000;
        console.log(`⏱️ Proceso finalizado en ${duration.toFixed(2)}s`);
        process.exit(0);
    }
}

if (require.main === module) {
    syncSearch();
}
