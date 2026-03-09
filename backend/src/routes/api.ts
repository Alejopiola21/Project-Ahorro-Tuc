import { Router, Request, Response } from 'express';
import { ProductRepository, SupermarketRepository } from '../repositories';

const router = Router();

// GET /api/supermarkets
router.get('/supermarkets', (_req: Request, res: Response) => {
    const data = SupermarketRepository.findAll();
    res.json(data);
});

// GET /api/products?q=yerba
router.get('/products', (req: Request, res: Response) => {
    const { q } = req.query;
    const data = q && typeof q === 'string'
        ? ProductRepository.search(q)
        : ProductRepository.findAll();
    res.json(data);
});

// GET /api/products/:id/history/:supermarketId
router.get('/products/:id/history/:supermarketId', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const supermarketId = String(req.params.supermarketId);
    const history = ProductRepository.getPriceHistory(id, supermarketId);
    res.json(history);
});

export default router;
