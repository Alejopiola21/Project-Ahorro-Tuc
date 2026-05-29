import { Request, Response } from 'express';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/client';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../middleware/asyncHandler';

const listSchema = z.object({
    name: z.string().min(1).max(50),
    items: z.array(z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive().default(1)
    })).optional()
});

export class UserListController {
    static getAll = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const lists = await prisma.userList.findMany({
            where: { userId },
            include: {
                items: {
                    include: { product: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(lists);
    });

    static getById = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const listId = parseInt(req.params.id as string);

        if (isNaN(listId)) throw new ApiError('ID inválido', 400);

        const list = await prisma.userList.findFirst({
            where: { id: listId, userId },
            include: {
                items: {
                    include: { product: true }
                }
            }
        });

        if (!list) throw new ApiError('Lista no encontrada', 404);
        res.json(list);
    });

    static create = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const data = listSchema.parse(req.body);

        // Limite de 3 listas
        const count = await prisma.userList.count({ where: { userId } });
        if (count >= 3) {
            throw new ApiError('Límite alcanzado: máximo 3 listas por usuario', 403);
        }

        const newList = await prisma.userList.create({
            data: {
                name: data.name,
                userId,
                items: data.items ? {
                    create: data.items.map(i => ({
                        productId: i.productId,
                        quantity: i.quantity
                    }))
                } : undefined
            },
            include: {
                items: { include: { product: true } }
            }
        });

        res.status(201).json(newList);
    });

    static update = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const listId = parseInt(req.params.id as string);
        const data = listSchema.parse(req.body);

        if (isNaN(listId)) throw new ApiError('ID inválido', 400);

        // Verificar propiedad
        const list = await prisma.userList.findFirst({ where: { id: listId, userId } });
        if (!list) throw new ApiError('Lista no encontrada', 404);

        // Update list and items using a transaction
        const updatedList = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Eliminar items actuales si se pasan nuevos
            if (data.items) {
                await tx.userListItem.deleteMany({ where: { listId } });
            }

            return tx.userList.update({
                where: { id: listId },
                data: {
                    name: data.name,
                    items: data.items ? {
                        create: data.items.map(i => ({
                            productId: i.productId,
                            quantity: i.quantity
                        }))
                    } : undefined
                },
                include: {
                    items: { include: { product: true } }
                }
            });
        });

        res.json(updatedList);
    });

    static delete = asyncHandler(async (req: Request, res: Response) => {
        const userId = (req as any).user.id;
        const listId = parseInt(req.params.id as string);

        if (isNaN(listId)) throw new ApiError('ID inválido', 400);

        const list = await prisma.userList.findFirst({ where: { id: listId, userId } });
        if (!list) throw new ApiError('Lista no encontrada', 404);

        await prisma.userList.delete({ where: { id: listId } });
        res.status(204).send();
    });
}
