// import { Meilisearch, Index } from 'meilisearch'; // Eliminado por incompatibilidad ESM/CJS

export interface SearchProduct {
    id: number;
    name: string;
    brand: string | null;
    category: string;
    ean: string | null;
    imageUrl: string;
}

export class SearchService {
    private client: any | null = null;
    private index: any | null = null;
    private enabled: boolean = false;

    constructor() {
        const host = process.env.MEILI_HOST || 'http://localhost:7700';
        const apiKey = process.env.MEILI_MASTER_KEY;

        if (apiKey) {
            // Carga dinámica para soportar ESM en un proyecto CommonJS
            // @ts-ignore - Incompatibilidad ESM/CJS en compilación
            (import('meilisearch') as any).then(({ Meilisearch }: any) => {
                try {
                    this.client = new Meilisearch({ host, apiKey });
                    this.index = this.client.index('products');
                    this.enabled = true;
                    this.initializeIndex();
                    console.log(`[SearchService] 🟢 MeiliSearch conectado en ${host}`);
                } catch (err) {
                    console.error('[SearchService] ❌ Error inicializando MeiliSearch:', err);
                }
            }).catch((err: any) => {
                console.error('[SearchService] ❌ Error cargando módulo meilisearch:', err);
            });
        } else {
            console.log('[SearchService] ⚠️ MEILI_MASTER_KEY no configurado. Búsqueda NoSQL desactivada.');
        }
    }

    private async initializeIndex() {
        if (!this.index) return;
        try {
            // Configurar campos buscables y filtrables
            await this.index.updateSettings({
                searchableAttributes: ['name', 'brand', 'category', 'ean'],
                filterableAttributes: ['category'],
                rankingRules: [
                    'words',
                    'typo',
                    'proximity',
                    'attribute',
                    'sort',
                    'exactness'
                ]
            });
        } catch (err) {
            console.error('[SearchService] Error configurando index:', err);
        }
    }

    /**
     * Realiza una búsqueda ultra-rápida con tolerancia a errores.
     */
    async search(query: string, options: { category?: string; limit?: number } = {}) {
        if (!this.enabled || !this.index) return null;

        try {
            const result = await this.index.search(query, {
                filter: options.category && options.category !== 'Todas' 
                    ? `category = "${options.category}"` 
                    : undefined,
                limit: options.limit || 50
            });
            
            return result.hits.map((h: any) => h.id as number);
        } catch (err) {
            console.error('[SearchService] Fallo en búsqueda:', err);
            return null;
        }
    }

    /**
     * Indexa o actualiza productos en masa.
     */
    async indexProducts(products: SearchProduct[]) {
        if (!this.enabled || !this.index) return;

        try {
            await this.index.addDocuments(products);
            console.log(`[SearchService] ⚡ Indexados ${products.length} productos.`);
        } catch (err) {
            console.error('[SearchService] Error indexando documentos:', err);
        }
    }

    /**
     * Elimina un producto del índice.
     */
    async deleteProduct(id: number) {
        if (!this.enabled || !this.index) return;
        try {
            await this.index.deleteDocument(id);
        } catch (err) {
            console.error('[SearchService] Error eliminando documento:', err);
        }
    }

    /**
     * Verifica si el servicio está operativo.
     */
    isAvailable(): boolean {
        return this.enabled;
    }
}

// Instancia global Singleton
export const globalSearch = new SearchService();
