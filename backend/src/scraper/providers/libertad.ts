import { fetchWithRetry, randomSleep } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

// VTEX Intelligent Search API o GraphQL Segment
const LIBERTAD_SEARCH_API = 'https://www.libertadsa.com.ar/api/io/_v/api/intelligent-search/product_search/';

export class LibertadScraper extends BaseScraper {
    constructor() {
        super('libertad');
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
            console.log(`[Provider:Libertad] Exploración VTEX Stealth: "${term}"...`);
            
            try {
                // Algoritmo de retraso defensivo inter-requests
                await randomSleep(3500, 6000);

                // Empleando el endpoint de Intelligent Search que suele ser menos restrictivo que catalog_system si se inyectan headers
                const url = `${LIBERTAD_SEARCH_API}?query=${encodeURIComponent(term)}&page=1&count=15`;
                
                const data = await fetchWithRetry<any>(url, {
                    headers: {
                        'Accept': 'application/json',
                        'x-vtex-tenant': 'libertadsa',
                        'Referer': 'https://www.libertadsa.com.ar/',
                        'Origin': 'https://www.libertadsa.com.ar'
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
                        sourceUrl: item.link || `https://www.libertadsa.com.ar${item.linkText}/p`,
                        imageUrl: sku?.images?.[0]?.imageUrl
                    });
                }
            } catch (error) {
                console.warn(`[Provider:Libertad] Barrera WAF detectada al extraer "${term}".`);
            }
        }
    }
}
