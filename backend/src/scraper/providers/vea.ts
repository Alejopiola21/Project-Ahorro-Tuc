import { fetchWithRetry } from '../core/fetcher';
import { ScrapedProduct } from '../core/sync';

// API Clásica de VTEX usada por Cencosud (Vea, Disco, Jumbo)
const VEA_SEARCH_API = 'https://www.vea.com.ar/api/catalog_system/pub/products/search';

export async function scrapeVea(): Promise<ScrapedProduct[]> {
    console.log('\n[Provider:Vea] 🛒 Iniciando extracción (VTEX API)...');
    const results: ScrapedProduct[] = [];
    
    // Términos clave a recolectar (Para una prueba controlada). 
    // En producción iteraríamos por IDs de categoría (ej ?fq=C:100/)
    const searchTerms = ['leche', 'fideos', 'azucar', 'papel'];

    // P-Limit o bucle secuencial para no saturar la API
    for (const term of searchTerms) {
        console.log(`[Provider:Vea] Buscando: "${term}"...`);
        try {
            // El API de VTEX Search devuelve un arreglo de productos
            const data = await fetchWithRetry<any[]>(`${VEA_SEARCH_API}?ft=${term}`);

            if (!Array.isArray(data)) {
                console.warn(`[Provider:Vea] Respuesta inválida para ${term}`);
                continue;
            }

            for (const item of data) {
                // Parseador estándar de VTEX
                const name = item.productName;
                const brand = item.brand;
                
                // La estructura de precios en VTEX está anidada en items -> sellers -> commertialOffer
                const sku = item.items?.[0];
                const ean = sku?.ean;
                const price = sku?.sellers?.[0]?.commertialOffer?.Price; // Precio real (suele ser Float)
                const sourceUrl = item.link || `https://www.vea.com.ar${item.linkText}/p`;
                const imageUrl = sku?.images?.[0]?.imageUrl;

                if (name && typeof price === 'number') {
                    results.push({
                        name,
                        price,
                        ean,
                        brand,
                        sourceUrl,
                        imageUrl
                    });
                }
            }
        } catch (error) {
            console.error(`[Provider:Vea] Error al buscar producto "${term}":`, (error as Error).message);
        }
    }
    
    console.log(`[Provider:Vea] ✅ Terminado. Total extraído: ${results.length} ítems únicos.`);
    return results;
}
