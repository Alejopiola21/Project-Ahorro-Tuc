import { fetchWithRetry } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

// API Clásica de VTEX usada por Cencosud
const JUMBO_SEARCH_API = 'https://www.jumbo.com.ar/api/catalog_system/pub/products/search';

export class JumboScraper extends BaseScraper {
    constructor() {
        super('jumbo');
    }

    async performScraping(): Promise<void> {
        const searchTerms = ['leche', 'fideos', 'azucar', 'papel'];

        for (const term of searchTerms) {
            console.log(`[Provider:Jumbo] Buscando: "${term}"...`);
            
            const data = await fetchWithRetry<any[]>(`${JUMBO_SEARCH_API}?ft=${term}`);

            if (!Array.isArray(data)) {
                console.warn(`[Provider:Jumbo] Respuesta inválida para ${term}`);
                continue;
            }

            for (const item of data) {
                const name = item.productName;
                const brand = item.brand;
                const sku = item.items?.[0];
                const ean = sku?.ean;
                const price = sku?.sellers?.[0]?.commertialOffer?.Price;
                const sourceUrl = item.link || `https://www.jumbo.com.ar${item.linkText}/p`;
                const imageUrl = sku?.images?.[0]?.imageUrl;

                this.addResult({
                    name,
                    price,
                    ean,
                    brand,
                    sourceUrl,
                    imageUrl
                });
            }
        }
    }
}
