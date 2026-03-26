import { Request, Response } from 'express';
import { SupermarketRepository } from '../repositories';

export class SupermarketController {
    static async getSupermarkets(_req: Request, res: Response) {
        try {
            const data = await SupermarketRepository.findAll();
            res.json(data);
        } catch (error) {
            console.error('[SupermarketController] Error:', error);
            res.status(500).json({ error: 'Error al obtener supermercados' });
        }
    }
}
