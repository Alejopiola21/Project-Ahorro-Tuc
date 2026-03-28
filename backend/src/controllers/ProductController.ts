import { Request, Response } from 'express';
import { ProductRepository } from '../repositories';
import { asyncHandler } from '../middleware/asyncHandler';

export class ProductController {
    static getProducts = asyncHandler(async (req: Request, res: Response) => {
        const { q } = req.query;
        const data = q && typeof q === 'string'
            ? await ProductRepository.search(q)
            : await ProductRepository.findAll();
        res.json(data);
    });

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

        const history = await ProductRepository.getPriceHistory(id, supermarketId);
        res.json(history);
    });
}
