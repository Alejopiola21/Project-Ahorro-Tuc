import { fetchWithRetry } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

// Día utiliza la infraestructura de VTEX bajo diaonline
const DIA_SEARCH_API = 'https://diaonline.supermercadosdia.com.ar/api/catalog_system/pub/products/search';

export class DiaScraper extends BaseScraper {
    constructor() {
        super('dia');
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
            console.log(`[Provider:Día] Buscando: "${term}"...`);
            
            try {
                const data = await fetchWithRetry<any[]>(`${DIA_SEARCH_API}?ft=${term}`);

                if (!Array.isArray(data)) continue;

                for (const item of data) {
                    const sku = item.items?.[0];
                    this.addResult({
                        name: item.productName,
                        price: sku?.sellers?.[0]?.commertialOffer?.Price,
                        ean: sku?.ean,
                        brand: item.brand,
                        sourceUrl: item.link || `https://diaonline.supermercadosdia.com.ar${item.linkText}/p`,
                        imageUrl: sku?.images?.[0]?.imageUrl
                    });
                }
            } catch (error) {
                console.warn(`[Provider:Día] Proteccion Anti-bot o Timeout aisaldo en ${term}.`);
            }
        }
    }
}
