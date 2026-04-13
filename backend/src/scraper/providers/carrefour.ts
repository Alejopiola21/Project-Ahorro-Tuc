import { fetchWithRetry, randomSleep } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const CARREFOUR_SEARCH_API = 'https://www.carrefour.com.ar/api/io/_v/api/intelligent-search/product_search/';
const MAX_PAGES = 5; // Máximo 5 páginas por término (15 productos c/u = 75 max)

export class CarrefourScraper extends BaseScraper {
    constructor() {
        super('carrefour');
    }

    async performScraping(): Promise<void> {
        const searchTerms = [
            // Lácteos
            'leche', 'yogur', 'queso', 'manteca', 'dulce de leche',
            // Almacén
            'fideos', 'arroz', 'aceite', 'azucar', 'harina', 'sal', 'atun', 'salsa de tomate',
            'galletitas', 'yerba', 'cafe', 'agua mineral',
            // Limpieza
            'detergente', 'lavandina', 'papel higienico', 'jabon', 'suavizante',
            // Bebidas
            'coca cola', 'cerveza', 'jugo', 'vino', 'gaseosa',
            // Carnes
            'pollo', 'carne picada', 'milanesa',
            // Panadería
            'pan lactal', 'facturas', 'pan dulce',
            // Mascotas
            'alimento perro', 'alimento gato',
            // Perfumería
            'shampoo', 'desodorante', 'crema dental', 'protector solar',
            // Verdulería
            'papa', 'tomate', 'cebolla', 'banana', 'limon',
            // Congelados
            'empanada', 'hamburguesa', 'pizza congelada',
        ];

        for (const term of searchTerms) {
            console.log(`[Provider:Carrefour] Exploración Inteligente: "${term}"...`);

            let page = 1;
            let hasMorePages = true;

            while (hasMorePages && page <= MAX_PAGES) {
                try {
                    // Fundamental para modo Stealth
                    await randomSleep(2000, 4000);

                    const url = `${CARREFOUR_SEARCH_API}?query=${encodeURIComponent(term)}&page=${page}&count=15`;
                    const data = await fetchWithRetry<any>(url, {
                        headers: {
                            'Accept': 'application/json',
                            'x-vtex-tenant': 'carrefourar',
                            'Referer': 'https://www.carrefour.com.ar/',
                            'Origin': 'https://www.carrefour.com.ar'
                        }
                    });

                    if (!data || !Array.isArray(data.products) || data.products.length === 0) {
                        hasMorePages = false;
                        break;
                    }

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

                    console.log(`[Provider:Carrefour] Página ${page}: ${data.products.length} productos`);

                    // Si trae menos de 15, es la última página
                    if (data.products.length < 15) {
                        hasMorePages = false;
                    }

                    page++;
                } catch (error) {
                    console.warn(`[Provider:Carrefour] Error en página ${page} de "${term}".`, (error as Error).message);
                    hasMorePages = false;
                }
            }
        }
    }
}
