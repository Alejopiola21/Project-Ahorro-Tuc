import { Request, Response } from 'express';
import { CategoryRepository } from '../repositories';
import { asyncHandler } from '../middleware/asyncHandler';
import { globalCache } from '../services/CacheService';

export class CategoryController {
    static getCategories = asyncHandler(async (_req: Request, res: Response) => {
        const cacheKey = 'global_categories_list';
        const cached = globalCache.get(cacheKey);

        if (cached) {
            res.json(cached);
            return;
        }

        // Delega la query al repositorio — no accede a Prisma directamente
        const result = await CategoryRepository.findAll();

        globalCache.set(cacheKey, result, 3600000); // 1 hora, no cambia casi nunca
        res.json(result);
    });
}
