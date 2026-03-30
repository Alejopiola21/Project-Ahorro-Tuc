import { fetchWithRetry } from '../core/fetcher';
import { ScrapedProduct } from '../core/sync';

const DISCO_SEARCH_API = 'https://www.disco.com.ar/api/catalog_system/pub/products/search';

export async function scrapeDisco(): Promise<ScrapedProduct[]> {
    console.log('\n[Provider:Disco] 🔴 Iniciando extracción (VTEX API)...');
    const results: ScrapedProduct[] = [];
    
    const searchTerms = ['leche', 'fideos', 'azucar', 'papel'];

    for (const term of searchTerms) {
        try {
            const data = await fetchWithRetry<any[]>(`${DISCO_SEARCH_API}?ft=${term}`);

            if (!Array.isArray(data)) continue;

            for (const item of data) {
                const name = item.productName;
                const brand = item.brand;
                const sku = item.items?.[0];
                const ean = sku?.ean;
                const price = sku?.sellers?.[0]?.commertialOffer?.Price;
                const sourceUrl = item.link || `https://www.disco.com.ar${item.linkText}/p`;
                const imageUrl = sku?.images?.[0]?.imageUrl;

                if (name && typeof price === 'number') {
                    results.push({ name, price, ean, brand, sourceUrl, imageUrl });
                }
            }
        } catch (error) {
            console.error(`[Provider:Disco] Error buscando "${term}":`, (error as Error).message);
        }
    }
    
    console.log(`[Provider:Disco] ✅ Extraídos: ${results.length} ítems.`);
    return results;
}
