import 'dotenv/config';
import { syncSupermarketData } from './core/sync';
import { providersRegistry } from './providers';
import { globalCache } from '../services/CacheService';
import { ScraperLogRepository } from '../repositories/ScraperLogRepository';

interface ScrapeStat {
    provider: string;
    itemsScraped: number;
    errors: number;
    status: 'OK' | 'WARNING' | 'FAILED';
    errorMessage?: string;
    duration: number;
}

async function main() {
    console.log('============================================');
    console.log(' 🤖 AHORRO TUC :: AUTO-REGISTRY SCRAPER 🤖 ');
    console.log('============================================\n');

    const scrapeStats: ScrapeStat[] = [];
    const globalStart = Date.now();
    let globalErrors = 0;

    try {
        console.log(`[Orquestador] Arrancando ${providersRegistry.length} proveedores encadenados...`);

        // Ejecutar linealmente para no abrumar la DB
        for (const provider of providersRegistry) {
            const providerStart = Date.now();
            let itemsCount = 0;
            let errorCount = 0;
            let errorMsg: string | undefined;

            try {
                const scrapedProducts = await provider.scrape();
                itemsCount = scrapedProducts.length;

                if (scrapedProducts.length > 0) {
                    await syncSupermarketData(undefined, provider.id, scrapedProducts);
                }
            } catch (err: any) {
                errorCount = 1;
                errorMsg = err.message || String(err);
                console.error(`❌ Error en proveedor ${provider.id}:`, errorMsg);
            }

            const status: ScrapeStat['status'] = itemsCount > 0 ? 'OK' : (errorCount > 0 ? 'FAILED' : 'WARNING');

            scrapeStats.push({
                provider: provider.id,
                itemsScraped: itemsCount,
                errors: errorCount,
                status,
                errorMessage: errorMsg,
                duration: Date.now() - providerStart,
            });

            // Persistir log individual por proveedor (sobrevive reinicios)
            await ScraperLogRepository.createLog({
                provider: provider.id,
                status,
                itemsScraped: itemsCount,
                errors: errorCount,
                errorMessage: errorMsg,
                startedAt: new Date(providerStart),
                finishedAt: new Date(),
            });

            globalErrors += errorCount;
        }

        const totalItems = scrapeStats.reduce((sum, s) => sum + s.itemsScraped, 0);
        const globalStatus: 'OK' | 'WARNING' | 'FAILED' =
            globalErrors > 0 ? (totalItems > 0 ? 'WARNING' : 'FAILED') : 'OK';

        // Purgar la caché global
        console.log(`[Orquestador] Purgando caché in-memory...`);
        globalCache.flushAll();

        // Persistir log global resumen
        await ScraperLogRepository.createGlobalSummary({
            status: globalStatus,
            itemsScraped: totalItems,
            errors: globalErrors,
            startedAt: new Date(globalStart),
            finishedAt: new Date(),
        });

        // Almacenar métricas de salud en caché (para acceso rápido)
        globalCache.set('scraper_health', {
            lastRun: new Date().toISOString(),
            durationMs: Date.now() - globalStart,
            status: globalStatus,
            details: scrapeStats
        });

    } catch (error) {
        const errMsg = (error as Error).message || String(error);
        console.error('❌ Crash fatal en orquestador superior:', error);

        // Persistir log de fallo fatal
        await ScraperLogRepository.createGlobalSummary({
            status: 'FAILED',
            itemsScraped: 0,
            errors: 1,
            errorMessage: errMsg,
            startedAt: new Date(globalStart),
            finishedAt: new Date(),
        });

        globalCache.set('scraper_health', {
            lastRun: new Date().toISOString(),
            status: 'FAILED',
            error: errMsg
        });
    } finally {
        console.log('\n✅ Proceso batch completo finalizado.');
    }
}

// Ejecutar si el archivo es invocado por node cron o bash
if (require.main === module) {
    main();
}
