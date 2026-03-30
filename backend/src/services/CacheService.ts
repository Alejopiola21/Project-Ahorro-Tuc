export class CacheService {
    private cache: Map<string, { data: any; expiry: number }> = new Map();

    /**
     * Guarda un valor en la caché con un tiempo de vida (TTL) en milisegundos.
     * @param key Identificador único (ej: 'search_leche')
     * @param data Los datos a memorizar
     * @param ttlMs Tiempo en milisegundos (default: 5 minutos)
     */
    set(key: string, data: any, ttlMs: number = 300000) {
        this.enforceSizeLimit(); // Prevenir Memory Leaks antes de insertar

        this.cache.set(key, {
            data,
            expiry: Date.now() + ttlMs,
        });
    }

    /**
     * Obtiene un valor de la caché si no ha expirado.
     * @param key Identificador único
     * @returns Los datos cacheados o null si no existe o expiró
     */
    get<T = any>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            // Borrado perezoso (Lazy Delete)
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    /**
     * Limita el tamaño de la caché previniendo OutOfMemory (OOM) en Node Mono-Hilo.
     * Si pasa de cierto límite, purga los expirados.
     */
    private enforceSizeLimit(maxSize: number = 2000) {
        if (this.cache.size > maxSize) {
            console.warn(`[CacheService] Tamaño máximo alcanzado (${this.cache.size}). Purgando...`);
            const now = Date.now();
            
            // 1. Purgar expirados
            for (const [key, value] of this.cache.entries()) {
                if (now > value.expiry) {
                    this.cache.delete(key);
                }
            }
            
            // 2. Si todavía sobra, el Map retiene orden de inserción, borramos los más viejos (LRU-Behavior simulado)
            if (this.cache.size > maxSize) {
                 const extraKeys = Array.from(this.cache.keys()).slice(0, 200); // purgamos los primeros 200 insertados
                 for (const key of extraKeys) {
                     this.cache.delete(key);
                 }
            }
        }
    }
}

// Instancia global Singleton
export const globalCache = new CacheService();
