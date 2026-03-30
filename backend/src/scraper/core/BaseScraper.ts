import { ScrapedProduct } from './sync';

export abstract class BaseScraper {
    protected supermarketId: string;
    protected results: ScrapedProduct[] = [];

    constructor(supermarketId: string) {
        this.supermarketId = supermarketId;
    }

    /**
     * Método principal que debe ser sobrescrito por el provider
     */
    abstract performScraping(): Promise<void>;

    /**
     * Ejecuta el scraping con manejo de errores (Graceful Shutdown).
     * Si falla la conexión a mitad de proceso, rescata los resultados parciales.
     */
    async scrape(): Promise<ScrapedProduct[]> {
        console.log(`\n[Scraper:${this.supermarketId.toUpperCase()}] 🛒 Iniciando extracción (Modo Seguro)...`);
        this.results = [];
        try {
            await this.performScraping();
        } catch (error) {
            console.error(`[Scraper:${this.supermarketId.toUpperCase()}] ❌ Fallo inesperado durante extracción masiva:`, (error as Error).message);
            console.warn(`[Scraper:${this.supermarketId.toUpperCase()}] ⚠️ Graceful Shutdown: Rescatando ${this.results.length} ítems extraídos parcialmente para insertar en DB.`);
        }
        
        console.log(`[Scraper:${this.supermarketId.toUpperCase()}] ✅ Extracción cerrada. Total ítems: ${this.results.length}`);
        return this.results;
    }

    /**
     * Protector de consistencia. Añade un producto y previene mutaciones malas.
     */
    protected addResult(item: ScrapedProduct) {
        if (!item.name || isNaN(item.price)) return;
        this.results.push(item);
    }
}
