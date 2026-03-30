import { fetchWithRetry } from '../core/fetcher';
import { ScrapedProduct } from '../core/sync';

const JUMBO_SEARCH_API = 'https://www.jumbo.com.ar/api/catalog_system/pub/products/search';

export async function scrapeJumbo(): Promise<ScrapedProduct[]> {
    console.log('\n[Provider:Jumbo] 🐘 Iniciando extracción (VTEX API)...');
    const results: ScrapedProduct[] = [];
    
    // Términos clave a recolectar
    const searchTerms = ['leche', 'fideos', 'azucar', 'papel'];

    for (const term of searchTerms) {
        try {
            const data = await fetchWithRetry<any[]>(`${JUMBO_SEARCH_API}?ft=${term}`);

            if (!Array.isArray(data)) continue;

            for (const item of data) {
                const name = item.productName;
                const brand = item.brand;
                const sku = item.items?.[0];
                const ean = sku?.ean;
                const price = sku?.sellers?.[0]?.commertialOffer?.Price;
                const sourceUrl = item.link || `https://www.jumbo.com.ar${item.linkText}/p`;
                const imageUrl = sku?.images?.[0]?.imageUrl;

                if (name && typeof price === 'number') {
                    results.push({ name, price, ean, brand, sourceUrl, imageUrl });
                }
            }
        } catch (error) {
            console.error(`[Provider:Jumbo] Error buscando "${term}":`, (error as Error).message);
        }
    }
    
    console.log(`[Provider:Jumbo] ✅ Extraídos: ${results.length} ítems.`);
    return results;
}
