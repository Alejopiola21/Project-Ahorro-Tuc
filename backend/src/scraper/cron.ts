import cron from 'node-cron';
import { spawn } from 'child_process';
import path from 'path';

console.log('--- ⏰ Iniciando Agendador de Scraping (CRON) ---');
console.log('El scraper se ejecutará todos los días a las 00:00 (Medianoche).');

// Cron Expression: 0 0 * * * (Min 0, Hora 0, Cada día)
cron.schedule('0 0 * * *', () => {
    console.log(`\n[Cron] 🕒 Ejecutando rutina de actualización de precios: ${new Date().toISOString()}`);

    // Lanzar el scraper como un subproceso para no ahogar el event loop
    const scraperProcess = spawn('npm', ['run', 'scrape'], {
        cwd: path.resolve(__dirname, '../../'),
        stdio: 'inherit', // Para ver los logs del scraper en esta consola
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

// Para mantener el proceso vivo (útil si se corre como demonio con PM2 o Docker)
// Si está alojado en el mismo thread que Express, esto no es necesario bloquearlo.
