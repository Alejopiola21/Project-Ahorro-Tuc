import { Request, Response } from 'express';
import { ProductRepository } from '../repositories';
import { asyncHandler } from '../middleware/asyncHandler';
import { globalCache } from '../services/CacheService';

export class ProductController {
    static getProducts = asyncHandler(async (req: Request, res: Response) => {
        const { q } = req.query;
        
        // 1. Interceptor de Caché: Construir Llave
        // Si no hay query, traemos todos. Si hay query, normalizamos a lowercase.
        const cacheKey = q && typeof q === 'string' 
            ? `search_${q.toLowerCase().trim()}` 
            : 'search_all_products';

        // 2. Verificar existencia en Memoria O(1)
        const cachedData = globalCache.get(cacheKey);

        if (cachedData) {
            console.log(`🚀 [Cache Hit] Sirviendo 0ms: ${cacheKey}`);
            res.json(cachedData); // Cortocircuito inmediato salva la DB de carga
            return;
        }

        // 3. Fallo de caché (Miss), obligados a consultar Neon DB
        console.log(`🐌 [Cache Miss] Resolviendo query pesado en Postgres: ${cacheKey}`);
        
        const data = q && typeof q === 'string'
            ? await ProductRepository.search(q)
            : await ProductRepository.findAll();
            
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

        const supermarketId = String(req.params.supermarketId);
        if (!supermarketId || supermarketId.trim() === '') {
            res.status(400).json({ error: 'ID de supermercado inválido' });
            return;
        }

        // Llave de historial
        const cacheKey = `history_prod_${id}_sup_${supermarketId}`;
        const cachedHistory = globalCache.get(cacheKey);
        
        if (cachedHistory) {
            res.json(cachedHistory);
            return;
        }

        // Fallo de caché, query a DB
        const history = await ProductRepository.getPriceHistory(id, supermarketId);
        
        // Memoria para el historial (5 min) ya que el usuario podría abrir la gráfica múltiples veces
        globalCache.set(cacheKey, history, 300000); 
        res.json(history);
    });
}
