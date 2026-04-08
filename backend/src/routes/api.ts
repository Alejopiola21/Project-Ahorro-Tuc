import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { SupermarketController } from '../controllers/SupermarketController';
import { OptimizationController } from '../controllers/OptimizationController';
import { CategoryController } from '../controllers/CategoryController';
import { ScraperController } from '../controllers/ScraperController';

const router = Router();

/**
 * @openapi
 * /api/scraper/status:
 *   get:
 *     summary: Obtiene el estado de salud de la última ejecución del Scraper
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Métricas del último scrape
 */
router.get('/scraper/status', ScraperController.getStatus);

/**
 * @openapi
 * /api/categories:
 *   get:
 *     summary: Obtiene rubros de productos disponibles
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: Arreglo de categorías
 */
router.get('/categories', CategoryController.getCategories);

/**
 * @openapi
 * /api/supermarkets:
 *   get:
 *     summary: Obtiene la lista de supermercados
 *     tags: [Supermarkets]
 *     responses:
 *       200:
 *         description: Lista de supermercados
 */
router.get('/supermarkets', SupermarketController.getSupermarkets);

/**
 * @openapi
 * /api/products:
 *   get:
 *     summary: Busca productos
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Resultados de la búsqueda
 */
router.get('/products', ProductController.getProducts);

/**
 * @openapi
 * /api/products/{id}/history:
 *   get:
 *     summary: Obtiene el historial de precios global de un producto en todos los supers
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial cronológico de precios
 */
router.get('/products/:id/history', ProductController.getProductHistory);

/**
 * @openapi
 * /api/products/{id}/history/{supermarketId}:
 *   get:
 *     summary: Obtiene el historial de precios de un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: supermarketId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Historial de precios
 */
router.get('/products/:id/history/:supermarketId', ProductController.getProductHistory);

/**
 * @openapi
 * /api/optimize-cart:
 *   post:
 *     summary: Calcula el carrito más barato
 *     tags: [Optimization]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Resultado de la optimización
 */
router.post('/optimize-cart', OptimizationController.optimizeCart);

export default router;
