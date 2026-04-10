import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { globalCache } from '../services/CacheService';
import { ScraperLogRepository } from '../repositories/ScraperLogRepository';

function formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
}

export const ScraperController = {
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
