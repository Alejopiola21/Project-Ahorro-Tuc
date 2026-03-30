import { fetchWithRetry } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const DISCO_SEARCH_API = 'https://www.disco.com.ar/api/catalog_system/pub/products/search';

export class DiscoScraper extends BaseScraper {
    constructor() {
        super('disco');
    }

    async performScraping(): Promise<void> {
        const searchTerms = ['leche', 'fideos', 'azucar', 'papel'];

        for (const term of searchTerms) {
            console.log(`[Provider:Disco] Buscando: "${term}"...`);
            
            const data = await fetchWithRetry<any[]>(`${DISCO_SEARCH_API}?ft=${term}`);

            if (!Array.isArray(data)) {
                console.warn(`[Provider:Disco] Respuesta inválida para ${term}`);
                continue;
            }

            for (const item of data) {
                const name = item.productName;
                const brand = item.brand;
                const sku = item.items?.[0];
                const ean = sku?.ean;
                const price = sku?.sellers?.[0]?.commertialOffer?.Price;
                const sourceUrl = item.link || `https://www.disco.com.ar${item.linkText}/p`;
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
