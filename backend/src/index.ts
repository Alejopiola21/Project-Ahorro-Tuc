import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { runMigrations } from './db/migrations';
import { seedDatabase } from './db/seed';
import apiRoutes from './routes/api';

dotenv.config();

// ── Ensure data directory exists ─────────────────────────────────────────────
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Bootstrap database ────────────────────────────────────────────────────────
runMigrations();
seedDatabase();

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'AhorroTuc API is running!', db: 'SQLite', timestamp: new Date() });
});

app.use('/api', apiRoutes);

app.listen(port, () => {
    console.log(`[🚀] AhorroTuc Backend running on http://localhost:${port}`);
});
