import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';

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
        res.status(401).json({ error: 'Token de autenticación requerido' });
        return;
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>"

    if (!token) {
        res.status(401).json({ error: 'Token de autenticación requerido' });
        return;
    }

    try {
        const decoded = AuthService.verifyToken(token);
        req.userId = decoded.sub;
        req.userEmail = decoded.email;
        next();
    } catch (error: any) {
        res.status(error.statusCode || 401).json({ error: error.message || 'Token inválido o expirado' });
        return;
    }
};
