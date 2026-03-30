import 'dotenv/config'; // Cargar variables para Prisma y configuraciones
// import { prisma } from '../db/client'; // Ya no es estrictamente necesario pasarlo al enrutador
import { syncSupermarketData } from './core/sync';
import { VeaScraper } from './providers/vea';
import { JumboScraper } from './providers/jumbo';
import { DiscoScraper } from './providers/disco';

async function main() {
    console.log('============================================');
    console.log(' 🤖 AHORRO TUC :: MOTOR DE SCRAPING :: 🤖 ');
    console.log('============================================\n');

    try {
        // --- 1. VEA ---
        const veaProducts = await new VeaScraper().scrape();
        if (veaProducts.length > 0) await syncSupermarketData(null, 'vea', veaProducts);
        
        // --- 2. JUMBO ---
        const jumboProducts = await new JumboScraper().scrape();
        if (jumboProducts.length > 0) await syncSupermarketData(null, 'jumbo', jumboProducts);

        // --- 3. DISCO ---
        const discoProducts = await new DiscoScraper().scrape();
        if (discoProducts.length > 0) await syncSupermarketData(null, 'disco', discoProducts);
        
    } catch (error) {
        console.error('❌ Error general en la ejecución del Scraper:', error);
    } finally {
        console.log('\n✅ Proceso de scraping finalizado.');
        // Para cerrar la conexión cleanly la delegaríamos al repository o prisma client al apagar el root app
    }
}

// Ejecutar si el archivo es llamado directamente en la terminal
if (require.main === module) {
    main();
}
