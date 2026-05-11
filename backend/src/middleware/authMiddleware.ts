import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { ApiError } from '../utils/ApiError';

export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
}

/**
 * Middleware que verifica el token JWT en el header Authorization.
 * Si es válido, adjunta userId y userEmail al request.
 * Si no, retorna 401 inmediatamente.
 */
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        next(new ApiError('Token de autenticación requerido', 401));
        return;
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        next(new ApiError('Token de autenticación requerido', 401));
        return;
    }

    try {
        const decoded = AuthService.verifyToken(token);
        req.userId = decoded.sub;
        req.userEmail = decoded.email;
        next();
    } catch (error: any) {
        next(error);
        return;
    }
};

/**
 * Middleware opcional que verifica el token JWT si está presente.
 * Si es válido, adjunta userId. Si no está o es inválido, continúa sin error.
 */
export const optionalAuthenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return next();
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
        return next();
    }

    try {
        const decoded = AuthService.verifyToken(token);
        req.userId = decoded.sub;
        req.userEmail = decoded.email;
    } catch (error) {
        // Ignorar token inválido para peticiones públicas
    }
    next();
};
