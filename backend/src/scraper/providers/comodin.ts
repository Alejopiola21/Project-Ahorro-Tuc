import { fetchWithRetry, randomSleep } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

// VTEX Intelligent Search API 
const COMODIN_SEARCH_API = 'https://salta.comodinencasa.com.ar/api/io/_v/api/intelligent-search/product_search/';

export class ComodinScraper extends BaseScraper {
    constructor() {
        super('comodin'); 
    }

    async performScraping(): Promise<void> {
        const searchTerms = ['leche', 'fideos', 'azucar', 'papel', 'coca', 'cerveza', 'perro', 'hamburguesa'];

        for (const term of searchTerms) {
            console.log(`[Provider:Comodin] Exploración VTEX Stealth: "${term}"...`);
            
            try {
                // Algoritmo de retraso defensivo (3-5 segundos aleatorios)
                await randomSleep(3000, 5500);

                const url = `${COMODIN_SEARCH_API}?query=${encodeURIComponent(term)}&page=1&count=15`;
                
                const data = await fetchWithRetry<any>(url, {
                    headers: {
                        'Accept': 'application/json',
                        'x-vtex-tenant': 'comodin',
                        'Referer': 'https://salta.comodinencasa.com.ar/',
                        'Origin': 'https://salta.comodinencasa.com.ar'
                    }
                });

                if (!data || !Array.isArray(data.products)) continue;

                for (const item of data.products) {
                    const sku = item.items?.[0];
                    this.addResult({
                        name: item.productName,
                        price: sku?.sellers?.[0]?.commertialOffer?.Price,
                        ean: sku?.ean,
                        brand: item.brand,
                        sourceUrl: item.link || `https://salta.comodinencasa.com.ar${item.linkText}/p`,
                        imageUrl: sku?.images?.[0]?.imageUrl
                    });
                }
            } catch (error) {
                console.warn(`[Provider:Comodin] Error WAF detectado al extraer - ${term}`);
            }
        }
    }
}
