import { Request, Response } from 'express';
import { ProductRepository } from '../repositories';
import { asyncHandler } from '../middleware/asyncHandler';
import { globalCache } from '../services/CacheService';

export class ProductController {
    static getProducts = asyncHandler(async (req: Request, res: Response) => {
        const { q, category } = req.query;
        
        const qStr = typeof q === 'string' ? q.trim() : '';
        const catStr = typeof category === 'string' && category.trim() !== 'Todas' ? category.trim() : '';
        
        // 1. Interceptor de Caché: Construir Llave multi-variable
        const cacheKey = `search_c:${catStr.toLowerCase()}_q:${qStr.toLowerCase()}`;

        // 2. Verificar existencia en Memoria O(1)
        const cachedData = globalCache.get(cacheKey);

        if (cachedData) {
            console.log(`🚀 [Cache Hit] Sirviendo 0ms: ${cacheKey}`);
            res.json(cachedData); // Cortocircuito inmediato salva la DB de carga
            return;
        }

        // 3. Fallo de caché (Miss), obligados a consultar Neon DB
        console.log(`🐌 [Cache Miss] Resolviendo query pesado en Postgres: ${cacheKey}`);
        
        const data = qStr.length > 0
            ? await ProductRepository.search(qStr, catStr)
            : await ProductRepository.findAll(catStr);
            
        // 4. Salvar el resultado costoso en memoria por 10 Minutos (600.000 ms)
        globalCache.set(cacheKey, data, 600000); 

        res.json(data);
    });

    // ── Opcional: Extender caché al historial de precios ───────────────────
    static getProductHistory = asyncHandler(async (req: Request, res: Response) => {
        const id = Number(req.params.id);
        if (isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'ID de producto inválido' });
            return;
        }

        // El frontend ahora lo pedirá como Query Parameter u otro path, pero flexibilizamos
        // Puede venir como /api/products/1/history o /api/products/1/history/coto
        const supermarketId = req.params.supermarketId ? String(req.params.supermarketId) : undefined;

        // Llave de historial
        const cacheKey = `history_prod_${id}_sup_${supermarketId || 'ALL'}`;
        const cachedHistory = globalCache.get(cacheKey);
        
        if (cachedHistory) {
            res.json(cachedHistory);
            return;
        }

        // Fallo de caché, query a DB
        const history = await ProductRepository.getPriceHistory(id, supermarketId);
        
        // Memoria para el historial (5 min)
        globalCache.set(cacheKey, history, 300000); 
        res.json(history);
    });
}
