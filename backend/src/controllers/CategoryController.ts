import { Request, Response } from 'express';
import { prisma } from '../db/client';
// Forced Cache Flush Comment
import { asyncHandler } from '../middleware/asyncHandler';
import { globalCache } from '../services/CacheService';

export class CategoryController {
    static getCategories = asyncHandler(async (req: Request, res: Response) => {
        const cacheKey = 'global_categories_list';
        const cached = globalCache.get(cacheKey);
        
        if (cached) {
            res.json(cached);
            return;
        }

        // Agrupa de la base de datos para saber qué categorías tienen stock actualemente
        const rawCategories = await prisma.product.groupBy({
            by: ['category'],
            _count: { _all: true },
            orderBy: { category: 'asc' }
        });

        // Formatea la salida
        const result = rawCategories
            .filter(c => c.category && c.category.trim() !== '') // ignora basura
            .map(c => ({
                name: c.category,
                count: c._count._all
            }));

        globalCache.set(cacheKey, result, 3600000); // 1 hora, no cambia casi nunca
        res.json(result);
    });
}
