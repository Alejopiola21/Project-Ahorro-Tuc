import { prisma } from '../db/client';

export interface ScraperLogInput {
    provider: string;
    status: 'OK' | 'WARNING' | 'FAILED';
    itemsScraped: number;
    errors: number;
    errorMessage?: string;
    startedAt: Date;
    finishedAt: Date;
}

export interface ProviderHealth {
    provider: string;
    status: string;
    itemsScraped: number;
    errors: number;
    errorMessage: string | null;
    lastRun: string;
}

export const ScraperLogRepository = {
    /**
     * Persiste un log individual de una ejecución de proveedor.
     */
    async createLog(input: ScraperLogInput): Promise<void> {
        await prisma.scraperLog.create({
            data: {
                provider: input.provider,
                status: input.status,
                itemsScraped: input.itemsScraped,
                errors: input.errors,
                errorMessage: input.errorMessage || null,
                startedAt: input.startedAt,
                finishedAt: input.finishedAt,
            }
        });
    },

    /**
     * Crea un log resumen global de toda la ejecución del orquestador.
     */
    async createGlobalSummary(input: Omit<ScraperLogInput, 'provider'>): Promise<void> {
        await prisma.scraperLog.create({
            data: {
                provider: 'ALL',
                status: input.status,
                itemsScraped: input.itemsScraped,
                errors: input.errors,
                errorMessage: input.errorMessage || null,
                startedAt: input.startedAt,
                finishedAt: input.finishedAt,
            }
        });
    },

    /**
     * Retorna el estado de salud más reciente por proveedor.
     * Un registro por proveedor, ordenados por última ejecución.
     */
    async getLatestByProvider(): Promise<ProviderHealth[]> {
        // Subquery: obtener el log más reciente por cada proveedor
        const rawLogs = await prisma.scraperLog.groupBy({
            by: ['provider'],
            _max: {
                finishedAt: true,
            },
            orderBy: {
                _max: {
                    finishedAt: 'desc',
                },
            },
        });

        // Para cada proveedor, obtener el log completo del más reciente
        const health: ProviderHealth[] = [];

        for (const group of rawLogs) {
            const latestLog = await prisma.scraperLog.findFirst({
                where: { provider: group.provider },
                orderBy: { finishedAt: 'desc' },
            });

            if (latestLog) {
                health.push({
                    provider: latestLog.provider,
                    status: latestLog.status,
                    itemsScraped: latestLog.itemsScraped,
                    errors: latestLog.errors,
                    errorMessage: latestLog.errorMessage,
                    lastRun: latestLog.finishedAt.toISOString(),
                });
            }
        }

        return health;
    },

    /**
     * Retorna el último log global (provider = 'ALL').
     */
    async getLatestGlobal() {
        const log = await prisma.scraperLog.findFirst({
            where: { provider: 'ALL' },
            orderBy: { finishedAt: 'desc' },
        });

        return log;
    },

    /**
     * Retorna los últimos N logs de cualquier tipo para auditoría.
     */
    async getRecentLogs(limit: number = 20) {
        return prisma.scraperLog.findMany({
            orderBy: { finishedAt: 'desc' },
            take: limit,
        });
    },
};
