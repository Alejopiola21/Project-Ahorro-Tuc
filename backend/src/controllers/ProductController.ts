import { Request, Response } from 'express';
import { ProductRepository } from '../repositories';

export class ProductController {
    static async getProducts(req: Request, res: Response) {
        try {
            const { q } = req.query;
            const data = q && typeof q === 'string'
                ? await ProductRepository.search(q)
                : await ProductRepository.findAll();
            res.json(data);
        } catch (error) {
            console.error('[ProductController] Error:', error);
            res.status(500).json({ error: 'Error al obtener productos' });
        }
    }

    static async getProductHistory(req: Request, res: Response) {
        try {
            const id = Number(req.params.id);
            const supermarketId = String(req.params.supermarketId);
            const history = await ProductRepository.getPriceHistory(id, supermarketId);
            res.json(history);
        } catch (error) {
            console.error('[ProductController] Error:', error);
            res.status(500).json({ error: 'Error al obtener historial' });
        }
    }
}
