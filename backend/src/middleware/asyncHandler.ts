import { Request, Response, NextFunction } from 'express';

/**
 * Wrapper para controladores async que captura errores automáticamente
 * y los pasa al middleware global de errores, eliminando la necesidad
 * de try/catch repetidos en cada controlador.
 */
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
    (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
