import { fetchWithRetry } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const CHANGOMAS_SEARCH_API = 'https://www.masonline.com.ar/api/catalog_system/pub/products/search';

export class ChangomasScraper extends BaseScraper {
    constructor() {
        super('changomas');
    }

    async performScraping(): Promise<void> {
        // Expandimos los términos de búsqueda para cubrir las nuevas categorías
        const searchTerms = ['leche', 'fideos', 'azucar', 'papel', 'coca', 'cerveza', 'perro', 'hamburguesa'];

        for (const term of searchTerms) {
            console.log(`[Provider:ChangoMás] Buscando: "${term}"...`);
            
            try {
                const data = await fetchWithRetry<any[]>(`${CHANGOMAS_SEARCH_API}?ft=${term}`);

                if (!Array.isArray(data)) continue;

                for (const item of data) {
                    const sku = item.items?.[0];
                    this.addResult({
                        name: item.productName,
                        price: sku?.sellers?.[0]?.commertialOffer?.Price,
                        ean: sku?.ean,
                        brand: item.brand,
                        sourceUrl: item.link || `https://www.masonline.com.ar${item.linkText}/p`,
                        imageUrl: sku?.images?.[0]?.imageUrl
                    });
                }
            } catch (error) {
                console.warn(`[Provider:ChangoMás] Excepción aisalda buscando ${term}. Omitiendo.`);
            }
        }
    }
}
