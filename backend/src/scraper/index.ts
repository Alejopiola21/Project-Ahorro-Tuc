import 'dotenv/config'; // Cargar variables para Prisma y configuraciones
import { prisma } from '../db/client';
import { syncSupermarketData } from './core/sync';
import { scrapeVea } from './providers/vea';
import { scrapeJumbo } from './providers/jumbo';
import { scrapeDisco } from './providers/disco';

async function main() {
    console.log('============================================');
    console.log(' 🤖 AHORRO TUC :: MOTOR DE SCRAPING :: 🤖 ');
    console.log('============================================\n');

    try {
        // --- 1. VEA ---
        const veaProducts = await scrapeVea();
        if (veaProducts.length > 0) await syncSupermarketData(prisma, 'vea', veaProducts);
        
        // --- 2. JUMBO ---
        const jumboProducts = await scrapeJumbo();
        if (jumboProducts.length > 0) await syncSupermarketData(prisma, 'jumbo', jumboProducts);

        // --- 3. DISCO ---
        const discoProducts = await scrapeDisco();
        if (discoProducts.length > 0) await syncSupermarketData(prisma, 'disco', discoProducts);

        // Proveedores en desarrollo (Ignorados por ahora)
        // const carrefourProducts = await scrapeCarrefour();
        // const chMasProducts = await scrapeChangomas();
        
    } catch (error) {
        console.error('❌ Error general en la ejecución del Scraper:', error);
    } finally {
        console.log('\n✅ Proceso de scraping finalizado.');
        await prisma.$disconnect();
    }
}

// Ejecutar si el archivo es llamado directamente en la terminal
if (require.main === module) {
    main();
}
