import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../middleware/asyncHandler';
import type { AuthRequest } from '../middleware/authMiddleware';

const RegisterSchema = z.object({
    email: z.string().email('Email inválido').min(1).max(255),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(128),
    name: z.string().min(1).max(100).optional(),
});

const LoginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1),
});

export class AuthController {
    static register = asyncHandler(async (req: Request, res: Response) => {
        const parseResult = RegisterSchema.safeParse(req.body);

        if (!parseResult.success) {
            res.status(400).json({
                error: 'Datos inválidos',
                details: parseResult.error.issues,
            });
            return;
        }

        const { email, password, name } = parseResult.data;
        const result = await AuthService.register({ email, password, name });

        res.status(201).json(result);
    });

    static login = asyncHandler(async (req: Request, res: Response) => {
        const parseResult = LoginSchema.safeParse(req.body);

        if (!parseResult.success) {
            res.status(400).json({
                error: 'Datos inválidos',
                details: parseResult.error.issues,
            });
            return;
        }

        const { email, password } = parseResult.data;
        const result = await AuthService.login({ email, password });

        res.status(200).json(result);
    });

    static getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
        if (!req.userId) {
            res.status(401).json({ error: 'Token inválido' });
            return;
        }

        const user = await AuthService.getUserById(req.userId);
        res.status(200).json({ user });
    });
}
