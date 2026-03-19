import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { ProductRepository, SupermarketRepository } from '../repositories';

const OptimizeCartSchema = z.object({
    productIds: z.array(z.number().positive())
});

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

// POST /api/optimize-cart
router.post('/optimize-cart', (req: Request, res: Response) => {
    const parseResult = OptimizeCartSchema.safeParse(req.body);

    if (!parseResult.success) {
        res.status(400).json({
            error: 'Payload inválido o malicioso',
            details: parseResult.error.issues
        });
        return;
    }

    const { productIds } = parseResult.data;
    const products = ProductRepository.findByIds(productIds);
    const supermarkets = SupermarketRepository.findAll();

    const totals: Record<string, number> = {};
    supermarkets.forEach(s => totals[s.id] = 0);

    products.forEach(item => {
        Object.entries(item.prices).forEach(([sup, price]) => {
            if (totals[sup] !== undefined) totals[sup] += price as number;
        });
    });

    const sortedTotals = Object.entries(totals).sort((a, b) => a[1] - b[1]);
    const maxSavings = sortedTotals.length > 0 ? sortedTotals[sortedTotals.length - 1][1] - sortedTotals[0][1] : 0;

    res.json({ sortedTotals, maxSavings });
});

export default router;
