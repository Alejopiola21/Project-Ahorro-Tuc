import { prisma } from '../db/client';

/**
 * CleanupService — Gestión de mantenimiento y purga de datos antiguos.
 * 
 * Este servicio se encarga de evitar que la base de datos crezca indefinidamente
 * eliminando registros históricos que ya no son relevantes para el usuario.
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
            const result = await prisma.priceHistory.deleteMany({
                where: {
                    date: {
                        lt: threshold
                    }
                }
            });
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
            const result = await prisma.scraperLog.deleteMany({
                where: {
                    startedAt: {
                        lt: threshold
                    }
                }
            });
            console.log(`[Cleanup] ✅ Se eliminaron ${result.count} registros de ScraperLog.`);
            return result.count;
        } catch (error) {
            console.error('[Cleanup] ❌ Error en cleanOldLogs:', error);
            return 0;
        }
    }

    /**
     * Ejecuta todas las tareas de mantenimiento.
     */
    static async runAll(): Promise<void> {
        console.log('[Cleanup] 🚀 Iniciando ciclo de mantenimiento completo...');
        const start = Date.now();
        
        await this.cleanOldPrices();
        await this.cleanOldLogs();

        console.log(`[Cleanup] ✨ Ciclo de mantenimiento finalizado en ${Date.now() - start}ms`);
    }
}
