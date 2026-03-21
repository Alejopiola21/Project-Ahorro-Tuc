import { Request, Response } from 'express';
import { SupermarketRepository } from '../repositories';

export class SupermarketController {
    static getSupermarkets(_req: Request, res: Response) {
        const data = SupermarketRepository.findAll();
        res.json(data);
    }
}
