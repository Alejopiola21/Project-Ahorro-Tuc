import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../db/client';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/asyncHandler';

const reportSchema = z.object({
    productId: z.number().int().positive(),
    supermarketId: z.string().min(1),
    reportedPrice: z.number().positive()
});

export class ReportController {
    static createReport = asyncHandler(async (req: Request, res: Response) => {
        const data = reportSchema.parse(req.body);
        const userId = (req as any).user?.id || null; // Opcional, si hay token pasa por authMiddleware(opcional)

        // Verificar que producto y supermercado existen
        const product = await prisma.product.findUnique({ where: { id: data.productId } });
        if (!product) throw new ApiError('Producto no encontrado', 404);

        const supermarket = await prisma.supermarket.findUnique({ where: { id: data.supermarketId } });
        if (!supermarket) throw new ApiError('Supermercado no encontrado', 404);

        const report = await prisma.priceReport.create({
            data: {
                productId: data.productId,
                supermarketId: data.supermarketId,
                reportedPrice: data.reportedPrice,
                userId
            }
        });

        res.status(201).json(report);
    });
}
