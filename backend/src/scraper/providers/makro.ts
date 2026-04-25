import { fetchWithRetry, randomSleep } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const MAKRO_SEARCH_API = 'https://www.makro.com.ar/api/catalog_system/pub/products/search';

export class MakroScraper extends BaseScraper {
    constructor() {
        super('makro');
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
            console.log(`[Provider:Makro] Buscando: "${term}"...`);
            
            try {
                await randomSleep(2000, 3500);

                const data = await fetchWithRetry<any[]>(`${MAKRO_SEARCH_API}?ft=${encodeURIComponent(term)}&_from=0&_to=20`, {
                    headers: { 'Accept': 'application/json' }
                });

                if (!Array.isArray(data)) {
                    continue;
                }

                for (const item of data) {
                    const name = item.productName;
                    const brand = item.brand;
                    const sku = item.items?.[0];
                    const ean = sku?.ean;
                    let price = sku?.sellers?.[0]?.commertialOffer?.Price;
                    
                    // Si Makro oculta el precio o es 0 (ej restricción mayorista), lo omitimos.
                    if (!price || price <= 0) continue;

                    const sourceUrl = item.link || `https://www.makro.com.ar${item.linkText}/p`;
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
            } catch (error) {
                console.warn(`[Provider:Makro] Error fetching data for term: ${term}`);
            }
        }
    }
}
