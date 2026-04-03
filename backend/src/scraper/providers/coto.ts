import * as cheerio from 'cheerio';
import { fetchWithRetry, randomSleep } from '../core/fetcher';
import { BaseScraper } from '../core/BaseScraper';

const COTO_BASE_URL = 'https://www.cotodigital3.com.ar';

export class CotoScraper extends BaseScraper {
    constructor() {
        super('coto');
    }

    async performScraping(): Promise<void> {
        const searchTerms = ['leche', 'fideos', 'azucar', 'papel', 'coca', 'cerveza', 'perro', 'hamburguesa'];

        for (const term of searchTerms) {
            console.log(`[Provider:Coto] Extracción de red profunda HTML: "${term}"...`);
            
            try {
                // Incorporar delay algorítmico prolongado según lo acordado para modo Stealth
                await randomSleep(3000, 5000);

                const url = `${COTO_BASE_URL}/sitios/cdigital/tienda/?q=${encodeURIComponent(term)}`;
                const html = await fetchWithRetry<string>(url, {
                    headers: {
                        'Accept': 'text/html,application/xhtml+xml',
                        'Cookie': 'JSESSIONID=dummy;' // Opcional, para simular navegador
                    }
                });

                if (!html) continue;

                // Parsear HTML rígido usando Cheerio
                const $ = cheerio.load(html);
                const items = $('.product_info_container, .descrip_full'); // Generic Coto Classes

                items.each((_idx, el) => {
                    // Navegación por DOM (Estructuras defensivas por si el tag cambia)
                    const title = $(el).find('.descrip_full').text().trim() || $(el).find('h1, h2, h3').text().trim();
                    const priceRaw = $(el).find('.atg_store_newPrice').text().trim() || $(el).find('.price').text().trim();
                    const link = $(el).find('a').attr('href') || '';
                    const imageUrl = $(el).find('img').attr('src');
                    const sku = $(el).attr('id') || link.split('/').pop() || '';

                    // Limpieza rigurosa de divisa
                    const priceNum = parseFloat(priceRaw.replace(/[^0-9,.]/g, '').replace(',', '.'));

                    if (title && !isNaN(priceNum) && priceNum > 0) {
                        this.addResult({
                            name: title,
                            price: priceNum,
                            ean: sku, // Coto digital uses product IDs mostly
                            brand: 'N/A', // Hay q extraer del título usualmente
                            sourceUrl: link.startsWith('http') ? link : `${COTO_BASE_URL}${link}`,
                            imageUrl: imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${COTO_BASE_URL}${imageUrl}`) : undefined
                        });
                    }
                });
                
            } catch (error) {
                console.warn(`[Provider:Coto] Protección Anti-Bot detectada parseando "${term}".`);
            }
        }
    }
}
