import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { globalCache } from '../services/CacheService';
import { ScraperLogRepository } from '../repositories/ScraperLogRepository';
import { providersRegistry } from '../scraper/providers';
import { syncSupermarketData } from '../scraper/core/sync';
import { globalQueues } from '../services/QueueService';

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
}

export const ScraperController = {
    /**
     * Dispara el scraper manualmente (síncrono, sin BullMQ).
     * POST /api/scraper/trigger
     * Opcional: query param ?provider=carrefour para ejecutar solo uno
     */
    triggerScraper: asyncHandler(async (req: Request, res: Response) => {
        const { provider } = req.query;
        const providerFilter = typeof provider === 'string' ? provider : null;

        // Filtrar providers si se especificó uno
        const providersToRun = providerFilter
            ? providersRegistry.filter(p => p.id === providerFilter)
            : providersRegistry;

        if (providersToRun.length === 0) {
            res.status(404).json({ error: `Provider '${providerFilter}' no encontrado` });
            return;
        }

        console.log(`\n[API Trigger] Iniciando scrapeo ${providerFilter ? `de '${providerFilter}'` : 'COMPLETO'} (${providersToRun.length} providers)...`);

        const globalStart = Date.now();
        let totalItems = 0;
        let totalErrors = 0;
        const results: Array<{ provider: string; status: string; items: number; error?: string }> = [];

        // Ejecutar cada provider secuencialmente
        for (const provider of providersToRun) {
            const start = Date.now();
            try {
                console.log(`\n[API] 🔄 Ejecutando ${provider.id}...`);
                const scrapedItems = await provider.scrape();
                const items = scrapedItems.length;
                totalItems += items;

                // Sincronizar con la base de datos
                await syncSupermarketData(undefined, provider.id, scrapedItems);

                const duration = Date.now() - start;
                console.log(`[API] ✅ ${provider.id} completado: ${items} productos en ${formatDuration(duration)}`);

                results.push({ provider: provider.id, status: 'OK', items });

                // Log a DB
                await ScraperLogRepository.createLog({
                    provider: provider.id,
                    status: 'OK',
                    itemsScraped: items,
                    errors: 0,
                    startedAt: new Date(start),
                    finishedAt: new Date(),
                });
            } catch (error) {
                const errMsg = (error as Error).message || String(error);
                totalErrors++;
                console.error(`[API] ❌ ${provider.id} falló: ${errMsg}`);
                results.push({ provider: provider.id, status: 'FAILED', items: 0, error: errMsg });

                await ScraperLogRepository.createLog({
                    provider: provider.id,
                    status: 'FAILED',
                    itemsScraped: 0,
                    errors: 1,
                    errorMessage: errMsg,
                    startedAt: new Date(start),
                    finishedAt: new Date(),
                });
            }
        }

        // Log global
        await ScraperLogRepository.createGlobalSummary({
            status: totalErrors > 0 ? 'WARNING' : 'OK',
            itemsScraped: totalItems,
            errors: totalErrors,
            startedAt: new Date(globalStart),
            finishedAt: new Date(),
        });

        const duration = Date.now() - globalStart;
        console.log(`\n[API] 🏁 Scraping completado: ${totalItems} productos totales en ${formatDuration(duration)}`);

        // Invalidar caché de productos para que el frontend vea los nuevos precios/productos
        globalCache.flushAll();
        console.log('[API] 🧹 Caché invalidada');

        res.json({
            status: totalErrors > 0 ? 'WARNING' : 'OK',
            duration: formatDuration(duration),
            providersRun: providersToRun.length,
            totalItemsScraped: totalItems,
            totalErrors,
            results,
            message: `Scraping ${providerFilter ? `de '${providerFilter}'` : 'completo'} completado. ${totalItems} productos procesados.`,
        });
    }),

    /**
     * Devuelve las métricas de salud del último proceso de extracción.
     * Prioriza la base de datos (persistente) sobre el caché (volátil).
     */
    getStatus: asyncHandler(async (req: Request, res: Response) => {
        // 1. Intentar obtener datos de la DB (sobrevive reinicios)
        const globalLog = await ScraperLogRepository.getLatestGlobal();
        const providerHealth = await ScraperLogRepository.getLatestByProvider();

        if (!globalLog) {
            // No hay registros en DB — fallback a caché volátil
            const cacheHealth = globalCache.get('scraper_health');
            if (!cacheHealth) {
                return res.json({
                    status: 'UNKNOWN',
                    message: 'No hay procesos de scraper completados aún. Ejecutá `npm run scrape` para iniciar.',
                    nextExpectedRun: '00:00 AM',
                    fromSource: 'none',
                });
            }

            return res.json({
                status: cacheHealth.status === 'FAILED' ? 'FAILED' : 'ONLINE',
                data: cacheHealth,
                fromSource: 'cache',
            });
        }

        // 2. Construir respuesta con datos persistentes de la DB
        const durationMs = globalLog.finishedAt.getTime() - globalLog.startedAt.getTime();
        const failedProviders = providerHealth.filter(p => p.status === 'FAILED').length;
        const warningProviders = providerHealth.filter(p => p.status === 'WARNING').length;

        let overallStatus = 'OK';
        if (globalLog.status === 'FAILED') overallStatus = 'FAILED';
        else if (globalLog.status === 'WARNING' || failedProviders > 0) overallStatus = 'WARNING';
        else if (warningProviders > 0) overallStatus = 'WARNING';

        res.json({
            status: overallStatus,
            lastGlobalRun: globalLog.finishedAt.toISOString(),
            duration: formatDuration(durationMs),
            summary: {
                totalProviders: providerHealth.length,
                okProviders: providerHealth.filter(p => p.status === 'OK').length,
                warningProviders,
                failedProviders,
                totalItemsScraped: globalLog.itemsScraped,
                totalErrors: globalLog.errors,
            },
            providers: providerHealth,
            errorMessage: globalLog.errorMessage,
            nextExpectedRun: '00:00 AM',
            fromSource: 'database',
        });
    }),

    /**
     * Retorna los últimos N logs de auditoría para debugging.
     */
    getRecentLogs: asyncHandler(async (req: Request, res: Response) => {
        const limit = Math.min(Number(req.query.limit) || 20, 100);
        const logs = await ScraperLogRepository.getRecentLogs(limit);
        res.json({ logs, limit });
    }),
};
