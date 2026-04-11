import 'dotenv/config';
import { providersRegistry } from './providers';
import { globalQueues } from '../services/QueueService';
import { ScraperLogRepository } from '../repositories/ScraperLogRepository';

async function main() {
    console.log('============================================');
    console.log(' 🤖 AHORRO TUC :: QUEUE-BASED SCRAPER 🤖 ');
    console.log('============================================\n');

    const globalStart = Date.now();

    try {
        console.log(`[Orquestador] Encolando ${providersRegistry.length} tareas de scraping en BullMQ...`);

        // Encolar trabajos de manera asíncrona
        const jobs = await Promise.all(
            providersRegistry.map(provider => globalQueues.addScrapeJob(provider.id))
        );

        console.log(`[Orquestador] ✅ ${jobs.length} tareas puestas en cola exitosamente.`);

        // Persistir log global informativo
        await ScraperLogRepository.createGlobalSummary({
            status: 'OK',
            itemsScraped: 0, // El conteo se hace en los workers
            errors: 0,
            startedAt: new Date(globalStart),
            finishedAt: new Date(),
            errorMessage: 'Tareas encoladas en BullMQ para procesamiento asíncrono'
        });

    } catch (error) {
        const errMsg = (error as Error).message || String(error);
        console.error('❌ Error al encolar tareas:', error);

        await ScraperLogRepository.createGlobalSummary({
            status: 'FAILED',
            itemsScraped: 0,
            errors: 1,
            errorMessage: `Error de encolado: ${errMsg}`,
            startedAt: new Date(globalStart),
            finishedAt: new Date(),
        });
    } finally {
        console.log('\n✅ Proceso de orquestación (encolado) finalizado.');
        // No cerramos globalQueues aquí para permitir que el proceso termine naturalmente 
        // o si es un cron corto, BullMQ se encarga.
    }
}

// Ejecutar si el archivo es invocado por node cron o bash
if (require.main === module) {
    main();
}
