import { Request, Response } from 'express';
import { ProductRepository } from '../repositories';

export class ProductController {
    static getProducts(req: Request, res: Response) {
        const { q } = req.query;
        const data = q && typeof q === 'string'
            ? ProductRepository.search(q)
            : ProductRepository.findAll();
        res.json(data);
    }

    static getProductHistory(req: Request, res: Response) {
        const id = Number(req.params.id);
        const supermarketId = String(req.params.supermarketId);
        const history = ProductRepository.getPriceHistory(id, supermarketId);
        res.json(history);
    }
}
