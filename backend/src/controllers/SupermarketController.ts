import { Request, Response } from 'express';
import { SupermarketRepository } from '../repositories';
import { asyncHandler } from '../middleware/asyncHandler';

export class SupermarketController {
    static getSupermarkets = asyncHandler(async (_req: Request, res: Response) => {
        const data = await SupermarketRepository.findAll();
        res.json(data);
    });
}
