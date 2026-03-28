import { Request, Response } from 'express';
import { z } from 'zod';
import { OptimizationService } from '../services/OptimizationService';
import { asyncHandler } from '../middleware/asyncHandler';

const OptimizeCartSchema = z.object({
    productIds: z.array(z.number().positive())
});

export class OptimizationController {
    static optimizeCart = asyncHandler(async (req: Request, res: Response) => {
        const parseResult = OptimizeCartSchema.safeParse(req.body);

        if (!parseResult.success) {
            res.status(400).json({
                error: 'Payload inválido o malicioso',
                details: parseResult.error.issues
            });
            return;
        }

        const { productIds } = parseResult.data;
        const result = await OptimizationService.optimizeCart(productIds);
        res.json(result);
    });
}
