import { Request, Response } from 'express';
import { ProductRepository } from '../repositories';
import { asyncHandler } from '../middleware/asyncHandler';
import { globalCache } from '../services/CacheService';

export class ProductController {
    static getProducts = asyncHandler(async (req: Request, res: Response) => {
        const { q, category, cursor, limit, minPrice, maxPrice, brands, inStock, sort } = req.query;

        const qStr = typeof q === 'string' ? q.trim() : '';
        const catStr = typeof category === 'string' && category.trim() !== 'Todas' ? category.trim() : '';
        const cursorNum = cursor ? Number(cursor) : undefined;
        const limitNum = limit ? Math.min(Number(limit), 100) : 50;

        // Nuevos filtros
        const minPriceNum = minPrice ? parseFloat(String(minPrice)) : undefined;
        const maxPriceNum = maxPrice ? parseFloat(String(maxPrice)) : undefined;
        const brandsArr = brands && typeof brands === 'string' ? brands.split(',').filter(Boolean) : [];
        const inStockBool = inStock === 'true';
        const sortStr = typeof sort === 'string' ? (sort as 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | 'brand_asc' | 'brand_desc') : undefined;

        // 1. Interceptor de Caché: Construir Llave multi-variable
        const cacheKey = `search_c:${catStr.toLowerCase()}_q:${qStr.toLowerCase()}_cur:${cursorNum || 0}_lim:${limitNum}_min:${minPriceNum || 0}_max:${maxPriceNum || 0}_b:${brandsArr.join('-')}_stock:${inStockBool}_sort:${sortStr || 'default'}`;

        // 2. Verificar existencia en Memoria O(1)
        const cachedData = globalCache.get(cacheKey);

        if (cachedData) {
            console.log(`🚀 [Cache Hit] Sirviendo 0ms: ${cacheKey}`);
            res.json(cachedData);
            return;
        }

        // 3. Fallo de caché (Miss), obligados a consultar Neon DB
        console.log(`🐌 [Cache Miss] Resolviendo query pesado en Postgres: ${cacheKey}`);

        let responseData: unknown;

        if (qStr.length > 0) {
            // Búsqueda con texto: usa búsqueda tradicional (sin paginación aún)
            const data = await ProductRepository.search(qStr, catStr);

            // Aplicar filtros adicionales post-búsqueda
            let filteredData = data;

            if (minPriceNum || maxPriceNum || brandsArr.length > 0 || inStockBool || sortStr) {
                filteredData = filteredData.filter(p => {
                    // Filtro por precio mínimo
                    const minProductPrice = Math.min(...Object.values(p.prices).filter(pr => pr > 0));
                    if (isNaN(minProductPrice)) return false;
                    if (minPriceNum && minProductPrice < minPriceNum) return false;
                    if (maxPriceNum && minProductPrice > maxPriceNum) return false;

                    // Filtro por marca
                    if (brandsArr.length > 0 && (!p.brand || !brandsArr.includes(p.brand))) return false;

                    // Filtro por stock
                    if (inStockBool && Object.values(p.prices).every(pr => pr === 0 || pr === undefined)) return false;

                    return true;
                });

                // Ordenar si es necesario
                if (sortStr) {
                    filteredData.sort((a, b) => {
                        switch (sortStr) {
                            case 'price_asc': {
                                const minA = Math.min(...Object.values(a.prices).filter(p => p > 0));
                                const minB = Math.min(...Object.values(b.prices).filter(p => p > 0));
                                return (isNaN(minA) ? Infinity : minA) - (isNaN(minB) ? Infinity : minB);
                            }
                            case 'price_desc': {
                                const minA = Math.min(...Object.values(a.prices).filter(p => p > 0));
                                const minB = Math.min(...Object.values(b.prices).filter(p => p > 0));
                                return (isNaN(minB) ? Infinity : minB) - (isNaN(minA) ? Infinity : minA);
                            }
                            case 'name_asc': return a.name.localeCompare(b.name);
                            case 'name_desc': return b.name.localeCompare(a.name);
                            case 'brand_asc': return (a.brand || '').localeCompare(b.brand || '');
                            case 'brand_desc': return (b.brand || '').localeCompare(a.brand || '');
                            default: return 0;
                        }
                    });
                }
            }

            responseData = { products: filteredData, nextCursor: null };
        } else {
            // Listado: usa paginación por cursor con filtros
            const { products, nextCursor } = await ProductRepository.findAllPaginated(
                catStr,
                cursorNum,
                limitNum,
                {
                    minPrice: minPriceNum,
                    maxPrice: maxPriceNum,
                    brands: brandsArr.length > 0 ? brandsArr : undefined,
                    inStock: inStockBool || undefined,
                    sortBy: sortStr,
                }
            );
            responseData = { products, nextCursor };
        }

        // 4. Salvar el resultado costoso en memoria por 10 Minutos (600.000 ms)
        globalCache.set(cacheKey, responseData, 600000);

        res.json(responseData);
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
