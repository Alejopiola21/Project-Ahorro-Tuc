import { Request, Response } from 'express';
import { globalCache } from '../services/CacheService';

export const ScraperController = {
    /**
     * Devuelve las métricas de salud del último proceso de extracción
     */
    async getStatus(req: Request, res: Response) {
        const healthStatus = globalCache.get('scraper_health');

        if (!healthStatus) {
            return res.json({
                status: 'UNKNOWN',
                message: 'No hay procesos de scraper completados desde el último reinicio del servidor.',
                nextExpectedRun: '00:00 AM'
            });
        }

        res.json({
            status: 'ONLINE',
            data: healthStatus
        });
    }
};
