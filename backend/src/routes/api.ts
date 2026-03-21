import { Router } from 'express';
import { ProductController } from '../controllers/ProductController';
import { SupermarketController } from '../controllers/SupermarketController';
import { OptimizationController } from '../controllers/OptimizationController';

const router = Router();

// GET /api/supermarkets
router.get('/supermarkets', SupermarketController.getSupermarkets);

// GET /api/products?q=yerba
router.get('/products', ProductController.getProducts);

// GET /api/products/:id/history/:supermarketId
router.get('/products/:id/history/:supermarketId', ProductController.getProductHistory);

// POST /api/optimize-cart
router.post('/optimize-cart', OptimizationController.optimizeCart);

export default router;
