import { fetchWithRetry } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const VEA_SEARCH_API = 'https://www.vea.com.ar/api/catalog_system/pub/products/search';

export class VeaScraper extends BaseScraper {
    constructor() {
        super('vea');
    }

    async performScraping(): Promise<void> {
        const searchTerms = ['leche', 'fideos', 'azucar', 'papel'];

        for (const term of searchTerms) {
            console.log(`[Provider:Vea] Buscando: "${term}"...`);
            
            const data = await fetchWithRetry<any[]>(`${VEA_SEARCH_API}?ft=${term}`);

            if (!Array.isArray(data)) {
                console.warn(`[Provider:Vea] Respuesta inválida para ${term}`);
                continue;
            }

            for (const item of data) {
                const name = item.productName;
                const brand = item.brand;
                const sku = item.items?.[0];
                const ean = sku?.ean;
                const price = sku?.sellers?.[0]?.commertialOffer?.Price;
                const sourceUrl = item.link || `https://www.vea.com.ar${item.linkText}/p`;
                const imageUrl = sku?.images?.[0]?.imageUrl;

                // addResult() automáticamente valida la nulabilidad
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
