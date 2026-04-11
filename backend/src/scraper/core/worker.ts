import { Worker, Job } from 'bullmq';
import { providersRegistry } from '../providers';
import { syncSupermarketData } from './sync';
import { ScraperLogRepository } from '../../repositories/ScraperLogRepository';
import { globalCache } from '../../services/CacheService';

/**
 * ScraperWorker — El "músculo" que ejecuta las tareas de scrape en segundo plano.
 * 
 * Se puede escalar horizontalmente lanzando múltiples instancias de este worker.
 */
export class ScraperWorker {
    private worker: Worker;

    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        this.worker = new Worker('scraper-tasks', async (job: Job) => {
            const { providerId } = job.data;
            return this.processScrape(providerId);
        }, {
            connection: { url: redisUrl },
            concurrency: Number(process.env.SCRAPER_CONCURRENCY) || 2, // Configurable vía ENV
            limiter: {
                max: 1, // Prevenir ráfagas al mismo tiempo
                duration: 1000
            }
        });

        this.worker.on('completed', (job) => {
            console.log(`[Worker] ⭐ Tarea completada para ${job.data.providerId}`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`[Worker] ❌ Tarea fallida para ${job?.data?.providerId}:`, err);
        });

        console.log('[Worker] 👷 Scraper Worker listo y escuchando tareas...');
    }

    private async processScrape(providerId: string) {
        const provider = providersRegistry.find(p => p.id === providerId);
        if (!provider) {
            throw new Error(`Proveedor no encontrado: ${providerId}`);
        }

        console.log(`[Worker] 🤖 Scrapeando [${providerId.toUpperCase()}]...`);
        const providerStart = Date.now();
        let itemsCount = 0;
        let errorCount = 0;
        let errorMsg: string | undefined;

        try {
            const scrapedProducts = await provider.scrape();
            itemsCount = scrapedProducts.length;

            if (itemsCount > 0) {
                await syncSupermarketData(undefined, provider.id, scrapedProducts);
            }
        } catch (err: any) {
            errorCount = 1;
            errorMsg = err.message || String(err);
            throw err; // Re-lanzar para que BullMQ gestione el reintento
        } finally {
            const duration = Date.now() - providerStart;
            const status = itemsCount > 0 ? 'OK' : (errorCount > 0 ? 'FAILED' : 'WARNING');

            // Persistir log
            await ScraperLogRepository.createLog({
                provider: providerId,
                status,
                itemsScraped: itemsCount,
                errors: errorCount,
                errorMessage: errorMsg,
                startedAt: new Date(providerStart),
                finishedAt: new Date(),
            });

            // Actualizar reporte de salud en caché
            const health: any = globalCache.get('scraper_health') || { details: [] };
            const details = (health.details || []).filter((d: any) => d.provider !== providerId);
            details.push({
                provider: providerId,
                itemsScraped: itemsCount,
                status,
                duration
            });
            globalCache.set('scraper_health', { ...health, details, lastUpdate: new Date() });
        }
    }

    async close() {
        await this.worker.close();
    }
}

// Autostart si se ejecuta directamente
if (require.main === module) {
    new ScraperWorker();
}
