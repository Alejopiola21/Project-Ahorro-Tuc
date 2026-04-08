import { fetchWithRetry, randomSleep } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const CARREFOUR_SEARCH_API = 'https://www.carrefour.com.ar/api/io/_v/api/intelligent-search/product_search/';

export class CarrefourScraper extends BaseScraper {
    constructor() {
        super('carrefour');
    }

    async performScraping(): Promise<void> {
        const searchTerms = ['leche', 'fideos', 'azucar', 'papel', 'coca', 'cerveza', 'perro', 'hamburguesa'];

        for (const term of searchTerms) {
            console.log(`[Provider:Carrefour] Exploración Inteligente: "${term}"...`);
            
            try {
                // Fundamental para modo Stealth
                await randomSleep(4000, 7000);

                const url = `${CARREFOUR_SEARCH_API}?query=${encodeURIComponent(term)}&page=1&count=15`;
                const data = await fetchWithRetry<any>(url, {
                    headers: {
                        'Accept': 'application/json',
                        'x-vtex-tenant': 'carrefourar',
                        'Referer': 'https://www.carrefour.com.ar/',
                        'Origin': 'https://www.carrefour.com.ar'
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
                        sourceUrl: item.link || `https://www.carrefour.com.ar${item.linkText}/p`,
                        imageUrl: sku?.images?.[0]?.imageUrl
                    });
                }
            } catch (error) {
                console.warn(`[Provider:Carrefour] Error extrayendo "${term}". Posible bloqueo WAF.`, (error as Error).message);
            }
        }
    }
}
