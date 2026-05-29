import { Request, Response } from 'express';
import { prisma } from '../db/client';
import { asyncHandler } from '../middleware/asyncHandler';

export class AnalyticsController {
    static getMyAnalytics = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;

        const lists = await prisma.userList.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: { currentPrices: true }
                        }
                    }
                }
            }
        });

        let totalLists = lists.length;
        let totalItemsSaved = 0;
        let projectedSavings = 0;
        let projectedMaxCost = 0;
        let projectedMinCost = 0;

        for (const list of lists) {
            for (const item of list.items) {
                totalItemsSaved += item.quantity;

                if (item.product.currentPrices.length > 0) {
                    const prices = item.product.currentPrices.map((p: any) => p.price);
                    const minPrice = Math.min(...prices);
                    const maxPrice = Math.max(...prices);

                    projectedMinCost += minPrice * item.quantity;
                    projectedMaxCost += maxPrice * item.quantity;
                }
            }
        }

        projectedSavings = projectedMaxCost - projectedMinCost;

        // Determinar insignias
        const badges = [];
        
        if (totalLists > 0) {
            badges.push({ id: 'FIRST_LIST', name: 'Organizador Novato', description: 'Creaste tu primera lista guardada', icon: 'FileText' });
        }
        
        if (totalLists >= 3) {
            badges.push({ id: 'LIST_MASTER', name: 'Maestro de Listas', description: 'Alcanzaste el límite de listas guardadas', icon: 'Layers' });
        }

        if (totalItemsSaved >= 20) {
            badges.push({ id: 'BULK_BUYER', name: 'Comprador Mayorista', description: 'Guardaste más de 20 productos', icon: 'ShoppingCart' });
        }

        if (projectedSavings > 5000) {
            badges.push({ id: 'SMART_SAVER', name: 'Ahorrador Inteligente', description: 'Tus decisiones ahorran más de $5,000', icon: 'Award' });
        }

        if (projectedSavings > 20000) {
            badges.push({ id: 'SAVINGS_GURU', name: 'Gurú del Ahorro', description: '¡Lograste ahorros proyectados mayores a $20,000!', icon: 'Star' });
        }

        res.json({
            metrics: {
                totalLists,
                totalItemsSaved,
                projectedSavings,
                projectedMaxCost,
                projectedMinCost
            },
            badges
        });
    });
}
