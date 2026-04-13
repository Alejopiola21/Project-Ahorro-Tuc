import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { SupermarketController } from '../controllers/SupermarketController';
import { OptimizationController } from '../controllers/OptimizationController';
import { CategoryController } from '../controllers/CategoryController';
import { ScraperController } from '../controllers/ScraperController';
import { AuthController } from '../controllers/AuthController';
import { BrandController } from '../controllers/BrandController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// ── Auth Routes (public) ────────────────────────────────────────────────────

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *       409:
 *         description: El email ya está registrado
 *       400:
 *         description: Datos inválidos
 */
router.post('/auth/register', AuthController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Inicia sesión con credenciales
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post('/auth/login', AuthController.login);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     summary: Obtiene el perfil del usuario autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: Token inválido o expirado
 */
router.get('/auth/me', authenticateToken, AuthController.getMe);

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
 * /api/scraper/logs:
 *   get:
 *     summary: Obtiene los últimos logs de auditoría del Scraper
 *     tags: [Health]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Cantidad de logs a retornar (máx 100)
 *     responses:
 *       200:
 *         description: Lista de logs del scraper
 */
router.get('/scraper/logs', ScraperController.getRecentLogs);

/**
 * @openapi
 * /api/scraper/trigger:
 *   post:
 *     summary: Dispara el scraper manualmente (síncrono, sin BullMQ)
 *     tags: [Health]
 *     parameters:
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *         description: Provider específico a ejecutar (opcional, ejecuta todos si no se especifica)
 *     responses:
 *       200:
 *         description: Scraping completado con resultados
 *       500:
 *         description: Error durante el scraping
 */
router.post('/scraper/trigger', ScraperController.triggerScraper);

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
 * /api/brands:
 *   get:
 *     summary: Obtiene la lista de marcas disponibles
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de marcas únicas
 */
router.get('/brands', BrandController.getBrands);

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
 *     summary: Busca productos (con filtros avanzados y paginación opcional por cursor)
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: integer
 *         description: Cursor para siguiente página (ID del último producto)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Cantidad de productos por página (máx 100)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Precio máximo
 *       - in: query
 *         name: brands
 *         schema:
 *           type: string
 *         description: Lista de marcas separadas por coma
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *         description: Solo productos con precio > 0
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, name_asc, name_desc, brand_asc, brand_desc]
 *         description: Ordenamiento de resultados
 *     responses:
 *       200:
 *         description: Resultados de la búsqueda con { products, nextCursor }
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
