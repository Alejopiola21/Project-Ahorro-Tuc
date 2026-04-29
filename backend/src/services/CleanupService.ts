import { prisma } from '../db/client';

// Timeout por operación de limpieza individual (5 minutos)
const CLEANUP_TIMEOUT_MS = Number(process.env.CLEANUP_TIMEOUT_MS) || 5 * 60 * 1000;
// Timeout global del ciclo completo de mantenimiento (12 minutos)
const CLEANUP_GLOBAL_TIMEOUT_MS = Number(process.env.CLEANUP_GLOBAL_TIMEOUT_MS) || 12 * 60 * 1000;

/**
 * Envuelve una promesa con un timeout duro.
 * Si la operación no responde en el plazo, lanza error controlado.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`[TIMEOUT] ${label} excedió ${ms / 1000}s`)), ms)
    );
    return Promise.race([promise, timeout]);
}

/**
 * CleanupService — Gestión de mantenimiento y purga de datos antiguos.
 * 
 * Este servicio se encarga de evitar que la base de datos crezca indefinidamente
 * eliminando registros históricos que ya no son relevantes para el usuario.
 * Cada operación tiene un timeout individual configurable (CLEANUP_TIMEOUT_MS).
 */
export class CleanupService {
    /**
     * Elimina el historial de precios más antiguo de 3 meses.
     * @returns Número de registros eliminados
     */
    static async cleanOldPrices(): Promise<number> {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - 90);

        console.log(`[Cleanup] 🧹 Iniciando purga de PriceHistory anterior a ${threshold.toISOString()}`);

        try {
            const result = await withTimeout(
                prisma.priceHistory.deleteMany({
                    where: {
                        date: {
                            lt: threshold
                        }
                    }
                }),
                CLEANUP_TIMEOUT_MS,
                'cleanOldPrices'
            );
            console.log(`[Cleanup] ✅ Se eliminaron ${result.count} registros de PriceHistory.`);
            return result.count;
        } catch (error) {
            console.error('[Cleanup] ❌ Error en cleanOldPrices:', error);
            return 0;
        }
    }

    /**
     * Elimina logs de scraping más antiguos de 30 días.
     * @returns Número de registros eliminados
     */
    static async cleanOldLogs(): Promise<number> {
        const threshold = new Date();
        threshold.setDate(threshold.getDate() - 30);

        console.log(`[Cleanup] 🧹 Iniciando purga de ScraperLog anterior a ${threshold.toISOString()}`);

        try {
            const result = await withTimeout(
                prisma.scraperLog.deleteMany({
                    where: {
                        startedAt: {
                            lt: threshold
                        }
                    }
                }),
                CLEANUP_TIMEOUT_MS,
                'cleanOldLogs'
            );
            console.log(`[Cleanup] ✅ Se eliminaron ${result.count} registros de ScraperLog.`);
            return result.count;
        } catch (error) {
            console.error('[Cleanup] ❌ Error en cleanOldLogs:', error);
            return 0;
        }
    }

    /**
     * Ejecuta todas las tareas de mantenimiento con timeout global.
     */
    static async runAll(): Promise<void> {
        console.log(`[Cleanup] 🚀 Iniciando ciclo de mantenimiento (timeout global: ${CLEANUP_GLOBAL_TIMEOUT_MS / 1000}s)...`);
        const start = Date.now();

        try {
            await withTimeout(
                (async () => {
                    await this.cleanOldPrices();
                    await this.cleanOldLogs();
                })(),
                CLEANUP_GLOBAL_TIMEOUT_MS,
                'runAll (ciclo completo)'
            );
            console.log(`[Cleanup] ✨ Ciclo de mantenimiento finalizado en ${Date.now() - start}ms`);
        } catch (error) {
            console.error(`[Cleanup] ❌ Ciclo de mantenimiento abortado tras ${Date.now() - start}ms:`, error);
        }
    }
}

