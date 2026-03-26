import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { seedDatabase } from './db/seed';
import apiRoutes from './routes/api';
import { setupSwagger } from './swagger';

dotenv.config();

// ── Bootstrap database & start server ─────────────────────────────────────────
async function main() {
    // Seed si es la primera vez
    await seedDatabase();

    // ── Express app ───────────────────────────────────────────────────────────
    const app = express();
    const port = process.env.PORT || 3001;

    // Seguridad
    app.use(helmet());

    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutos
        max: 100, // Limita a 100 peticiones por ventana de 15 minutos por IP
        message: 'Demasiadas peticiones desde esta IP, por favor intenta de nuevo más tarde.'
    });
    app.use(limiter);

    const allowedOrigins = [process.env.FRONTEND_URL || 'http://localhost:5173'];
    app.use(cors({
        origin: (origin, callback) => {
            // En desarrollo local a veces el origen viene undefined usando postman
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Bloqueado nativamente por la política CORS'));
            }
        }
    }));
    app.use(express.json());

    // Activar Swagger
    setupSwagger(app);

    // Routes
    app.get('/api/health', (_req: Request, res: Response) => {
        res.json({ status: 'AhorroTuc API is running!', db: 'PostgreSQL', timestamp: new Date() });
    });

    app.use('/api', apiRoutes);

    // ── Manejador Global de Errores (Silenciador) ─────────────────────────────
    app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
        console.error('[💥 Error Event]', new Date().toISOString(), err.message || err);
        res.status(500).json({ error: 'Error Interno del Servidor' });
    });

    app.listen(port, () => {
        console.log(`[🚀] AhorroTuc Backend running on http://localhost:${port}`);
    });
}

main().catch((err) => {
    console.error('[💀 Fatal Error] Failed to start server:', err);
    process.exit(1);
});
