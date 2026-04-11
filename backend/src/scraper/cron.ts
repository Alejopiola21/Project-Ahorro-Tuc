import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';

import { CleanupService } from '../services/CleanupService';

console.log('--- ⏰ Iniciando Agendador de Scraping (CRON) ---');
console.log('El scraper se ejecutará todos los días a las 00:00 (Medianoche).');
console.log('La limpieza de DB (Retención) se ejecutará los domingos a las 03:00.');

// ── 1. Scraper Diario (00:00) ───────────────────────────────
cron.schedule('0 0 * * *', () => {
    console.log(`\n[Cron] 🕒 Ejecutando rutina de actualización de precios: ${new Date().toISOString()}`);

    const scraperProcess = spawn('npm', ['run', 'scrape'], {
        cwd: path.resolve(__dirname, '../../'),
        stdio: 'inherit',
        shell: true
    });

    scraperProcess.on('close', (code) => {
        if (code === 0) {
            console.log(`[Cron] ✅ Rutina finalizada con éxito.`);
        } else {
            console.error(`[Cron] ❌ La rutina falló con código de salida ${code}.`);
        }
    });
});

// ── 2. Limpieza Semanal (Domingos 03:00) ─────────────────────
cron.schedule('0 3 * * 0', async () => {
    console.log(`\n[Cron] 🧹 Iniciando mantenimiento semanal: ${new Date().toISOString()}`);
    await CleanupService.runAll();
});

// Para mantener el proceso vivo (útil si se corre como demonio con PM2 o Docker)
// Si está alojado en el mismo thread que Express, esto no es necesario bloquearlo.
