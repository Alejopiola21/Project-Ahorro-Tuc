import 'dotenv/config'; 
import { syncSupermarketData } from './core/sync';
import { providersRegistry } from './providers';
import { globalCache } from '../services/CacheService';

async function main() {
    console.log('============================================');
    console.log(' 🤖 AHORRO TUC :: AUTO-REGISTRY SCRAPER 🤖 ');
    console.log('============================================\n');

    const scrapeStats: any[] = [];
    const startTime = Date.now();

    try {
        console.log(`[Orquestador] Arrancando ${providersRegistry.length} proveedores encadenados...`);

        // Ejecutar linealmente para no abrumar la DB
        for (const provider of providersRegistry) {
            const scrapedProducts = await provider.scrape();
            
            if (scrapedProducts.length > 0) {
                await syncSupermarketData(null, provider.id, scrapedProducts);
            }

            scrapeStats.push({
                provider: provider.id,
                itemsScraped: scrapedProducts.length,
                status: scrapedProducts.length > 0 ? 'OK' : 'WARNING'
            });
        }
        
        // Purgar la caché global
        console.log(`[Orquestador] Purgando caché in-memory...`);
        globalCache.flushAll();

        // Almacenar métricas de salud vitales
        globalCache.set('scraper_health', {
            lastRun: new Date().toISOString(),
            durationMs: Date.now() - startTime,
            details: scrapeStats
        });
        
    } catch (error) {
        console.error('❌ Crash fatal en orquestador superior:', error);
        
        globalCache.set('scraper_health', {
            lastRun: new Date().toISOString(),
            status: 'FAILED',
            error: (error as Error).message
        });
    } finally {
        console.log('\n✅ Proceso batch completo finalizado.');
    }
}

// Ejecutar si el archivo es invocado por node cron o bash
if (require.main === module) {
    main();
}
