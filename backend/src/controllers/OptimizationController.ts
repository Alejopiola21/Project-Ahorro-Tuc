import { Request, Response } from 'express';
import { z } from 'zod';
import { OptimizationService } from '../services/OptimizationService';
import { asyncHandler } from '../middleware/asyncHandler';

const OptimizeCartSchema = z.object({
    cartItems: z.array(z.object({
        productId: z.number().positive(),
        quantity: z.number().int().min(1)
    }))
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

        const { cartItems } = parseResult.data;
        const result = await OptimizationService.optimizeCart(cartItems);
        res.json(result);
    });
}
