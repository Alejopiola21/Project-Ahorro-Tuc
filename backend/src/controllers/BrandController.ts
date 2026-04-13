import { Request, Response } from 'express';
import { BrandRepository } from '../repositories';
import { asyncHandler } from '../middleware/asyncHandler';
import { globalCache } from '../services/CacheService';

export class BrandController {
    static getBrands = asyncHandler(async (_req: Request, res: Response) => {
        const cacheKey = 'brands_list';
        const cached = globalCache.get(cacheKey);

        if (cached) {
            res.json(cached);
            return;
        }

        const brands = await BrandRepository.findAll();
        globalCache.set(cacheKey, brands, 600000); // 10 minutos
        res.json(brands);
    });
}
