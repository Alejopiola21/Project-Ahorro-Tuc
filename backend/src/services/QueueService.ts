import { Queue, ConnectionOptions } from 'bullmq';

/**
 * QueueService — Gestión de colas de tareas asíncronas con BullMQ.
 * 
 * Centraliza la configuración de Redis para BullMQ y expone las colas disponibles.
 */
export class QueueService {
    private connection: ConnectionOptions;
    
    // Colas registradas
    public scraperQueue: Queue;

    constructor() {
        const redisUrl = process.env.REDIS_URL;
        
        // Parsear REDIS_URL para BullMQ (ioredis connection options)
        if (redisUrl) {
            this.connection = {
                url: redisUrl,
                // Opciones optimizadas para workers de larga duración
                maxRetriesPerRequest: null, 
            };
        } else {
            // Fallback a localhost si no hay URL (entorno dev)
            this.connection = { host: 'localhost', port: 6379 };
        }

        // Inicializar Colas
        this.scraperQueue = new Queue('scraper-tasks', {
            connection: this.connection,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: true,
                removeOnFail: false,
            }
        });

        console.log('[QueueService] 📥 Colas de BullMQ inicializadas');
    }

    /**
     * Encola una tarea de scrape para un supermercado específico.
     */
    async addScrapeJob(providerId: string) {
        return this.scraperQueue.add('scrape-provider', { providerId }, {
            jobId: `${providerId}-${new Date().toISOString().slice(0, 10)}` // Prevenir duplicados el mismo día
        });
    }

    /**
     * Cierra todas las conexiones de colas.
     */
    async close() {
        await this.scraperQueue.close();
    }
}

// Instancia global Singleton
export const globalQueues = new QueueService();
