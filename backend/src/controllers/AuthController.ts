import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/AuthService';
import { asyncHandler } from '../middleware/asyncHandler';
import type { AuthRequest } from '../middleware/authMiddleware';
import { ApiError } from '../utils/ApiError';

const RegisterSchema = z.object({
    email: z.string().email('Email inválido').min(1).max(255),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(128),
    name: z.string().min(1).max(100).optional(),
});

const LoginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(1),
});

const MagicRequestSchema = z.object({
    email: z.string().email('Email inválido')
});

const MagicLoginSchema = z.object({
    token: z.string().min(1, 'Token requerido')
});

export class AuthController {
    static register = asyncHandler(async (req: Request, res: Response) => {
        const { email, password, name } = RegisterSchema.parse(req.body);
        const result = await AuthService.register({ email, password, name });

        res.status(201).json(result);
    });

    static login = asyncHandler(async (req: Request, res: Response) => {
        const { email, password } = LoginSchema.parse(req.body);
        const result = await AuthService.login({ email, password });

        res.status(200).json(result);
    });

    static getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
        if (!req.userId) {
            throw new ApiError('Token inválido', 401);
        }

        const user = await AuthService.getUserById(req.userId);
        res.status(200).json({ user });
    });

    static requestMagicLink = asyncHandler(async (req: Request, res: Response) => {
        const { email } = MagicRequestSchema.parse(req.body);
        const magicLink = await AuthService.requestMagicLink(email);

        res.status(200).json({
            message: 'Enlace de acceso generado con éxito.',
            // En desarrollo, devolvemos el link para facilitar pruebas
            link: process.env.NODE_ENV === 'development' ? magicLink : undefined
        });
    });

    static magicLogin = asyncHandler(async (req: Request, res: Response) => {
        const { token } = MagicLoginSchema.parse(req.body);
        const result = await AuthService.loginWithMagicLink(token);

        res.status(200).json(result);
    });
}
