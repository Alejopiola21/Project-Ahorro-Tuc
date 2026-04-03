import { z } from 'zod';
import { fetchWithRetry, randomSleep } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const GP_SEARCH_API = 'https://gomezpardo.com.ar/api/catalog/search';

// Esquema Zod para protegerse contra modificaciones imprevistas en su API privada
const gpItemSchema = z.object({
    productName: z.string().or(z.undefined()),
    name: z.string().or(z.undefined()),
    price: z.union([z.string(), z.number()]),
    barcode: z.string().or(z.undefined()),
    brand: z.string().or(z.undefined()),
    id: z.union([z.string(), z.number()]).or(z.undefined()),
    link: z.string().or(z.undefined()),
    image: z.string().or(z.undefined())
}).passthrough();

export class GomezPardoScraper extends BaseScraper {
    constructor() {
        super('gomez_pardo');
    }

    async performScraping(): Promise<void> {
        const searchTerms = ['leche', 'fideos', 'azucar', 'papel', 'coca', 'cerveza', 'perro', 'hamburguesa'];

        for (const term of searchTerms) {
            console.log(`[Provider:GomezPardo] Explorando Catálogo: "${term}"...`);
            
            try {
                await randomSleep(2000, 4500); // Menos restrictivo que grandes plataformas

                const url = `${GP_SEARCH_API}?query=${encodeURIComponent(term)}&limit=15`;
                const data = await fetchWithRetry<any[]>(url, {
                    headers: { 'Accept': 'application/json' }
                });

                if (!Array.isArray(data)) continue;

                for (const rawItem of data) {
                    const parsed = gpItemSchema.safeParse(rawItem);
                    if (!parsed.success) {
                        console.warn(`[Provider:GomezPardo] Omitiendo item con formato estructurado desconocido.`);
                        continue;
                    }
                    
                    const item = parsed.data;
                    const priceVal = typeof item.price === 'string' ? parseFloat(item.price) : item.price;

                    if (!item.name && !item.productName) continue; // sin nombre
                    if (isNaN(priceVal)) continue; // sin precio real

                    this.addResult({
                        name: (item.productName || item.name)!,
                        price: priceVal,
                        ean: item.barcode,
                        brand: item.brand,
                        sourceUrl: item.link || `https://gomezpardo.com.ar/producto/${item.id}`,
                        imageUrl: item.image
                    });
                }
            } catch (error) {
                console.warn(`[Provider:GomezPardo] Servidor rechazó la petición API para el término "${term}".`);
            }
        }
    }
}
