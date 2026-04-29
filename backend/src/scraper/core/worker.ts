import { Worker, Job } from 'bullmq';
import { providersRegistry } from '../providers';
import { syncSupermarketData } from './sync';
import { ScraperLogRepository } from '../../repositories/ScraperLogRepository';
import { globalCache } from '../../services/CacheService';

// Timeout máximo por job individual (5 minutos).
// Si un scraper no responde en este intervalo, se mata y se registra como TIMEOUT.
const JOB_TIMEOUT_MS = Number(process.env.SCRAPER_JOB_TIMEOUT_MS) || 5 * 60 * 1000;

/**
 * ScraperWorker — El "músculo" que ejecuta las tareas de scrape en segundo plano.
 * 
 * Se puede escalar horizontalmente lanzando múltiples instancias de este worker.
 * Cada job tiene un timeout configurable (SCRAPER_JOB_TIMEOUT_MS, default 5 min)
 * y un lockDuration de 10 min para prevenir que BullMQ lo re-encole prematuramente.
 */
export class ScraperWorker {
    private worker: Worker;

    constructor() {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        
        this.worker = new Worker('scraper-tasks', async (job: Job) => {
            const { providerId } = job.data;
            return this.processScrapeWithTimeout(providerId);
        }, {
            connection: { url: redisUrl },
            concurrency: Number(process.env.SCRAPER_CONCURRENCY) || 2,
            lockDuration: 10 * 60 * 1000, // 10 min — evita re-encolado prematuro durante scrapes largos
            limiter: {
                max: 1,
                duration: 1000
            }
        });

        this.worker.on('completed', (job) => {
            console.log(`[Worker] ⭐ Tarea completada para ${job.data.providerId}`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`[Worker] ❌ Tarea fallida para ${job?.data?.providerId}:`, err);
        });

        console.log(`[Worker] 👷 Scraper Worker listo (timeout por job: ${JOB_TIMEOUT_MS / 1000}s, lock: 10min)`);
    }

    /**
     * Envuelve processScrape con un timeout duro.
     * Si el scraper excede JOB_TIMEOUT_MS, se aborta y se lanza error controlado.
     */
    private async processScrapeWithTimeout(providerId: string): Promise<void> {
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
                reject(new Error(`[TIMEOUT] Scraper '${providerId}' excedió el límite de ${JOB_TIMEOUT_MS / 1000}s`));
            }, JOB_TIMEOUT_MS);
        });

        // Promise.race: gana el scrape o el timeout, lo que ocurra primero
        await Promise.race([
            this.processScrape(providerId),
            timeoutPromise,
        ]);
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
