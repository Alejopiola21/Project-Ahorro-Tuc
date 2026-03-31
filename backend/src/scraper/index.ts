import 'dotenv/config'; 
import { syncSupermarketData } from './core/sync';
import { providersRegistry } from './providers';

async function main() {
    console.log('============================================');
    console.log(' 🤖 AHORRO TUC :: AUTO-REGISTRY SCRAPER 🤖 ');
    console.log('============================================\n');

    try {
        console.log(`[Orquestador] Arrancando ${providersRegistry.length} proveedores encadenados...`);

        // Ejecutar linealmente para no abrumar a nuestra base de datos ni a nuestra memoria RAM
        for (const provider of providersRegistry) {
            const scrapedProducts = await provider.scrape();
            
            if (scrapedProducts.length > 0) {
                await syncSupermarketData(null, provider.id, scrapedProducts);
            }
        }
        
    } catch (error) {
        console.error('❌ Crash fatal en orquestador superior:', error);
    } finally {
        console.log('\n✅ Proceso batch completo finalizado.');
    }
}

// Ejecutar si el archivo es invocado por node cron o bash
if (require.main === module) {
    main();
}
