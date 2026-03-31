import { fetchWithRetry } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const CARREFOUR_SEARCH_API = 'https://www.carrefour.com.ar/api/catalog_system/pub/products/search';

export class CarrefourScraper extends BaseScraper {
    constructor() {
        super('carrefour');
    }

    async performScraping(): Promise<void> {
        const searchTerms = ['leche', 'fideos', 'azucar', 'papel', 'coca', 'cerveza', 'perro', 'hamburguesa'];

        for (const term of searchTerms) {
            console.log(`[Provider:Carrefour] Buscando: "${term}"...`);
            
            try {
                // Carrefour suele proteger su VTEX con Cloudflare o tokens de sesión.
                // Intentamos un fetch público.
                const data = await fetchWithRetry<any[]>(`${CARREFOUR_SEARCH_API}?ft=${term}`);

                if (!Array.isArray(data)) continue;

                for (const item of data) {
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
                console.warn(`[Provider:Carrefour] Error de acceso a catálogo por protección/GraphQL forzado en ${term}.`);
            }
        }
    }
}
