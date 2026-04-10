import { fetchWithRetry } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const VEA_SEARCH_API = 'https://www.vea.com.ar/api/catalog_system/pub/products/search';

export class VeaScraper extends BaseScraper {
    constructor() {
        super('vea');
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
