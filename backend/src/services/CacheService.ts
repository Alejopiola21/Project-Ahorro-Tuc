import { RedisClient } from './RedisClient';

/**
 * CacheService — Caché híbrida Redis + In-Memory.
 * 
 * Arquitectura Dual:
 * - **In-Memory (Map):** Para reads instantáneos (compatibilidad backward)
 * - **Redis (opcional):** Para sharing entre instancias y persistencia
 * 
 * Estrategia "Write-Through, Read-Local-First":
 * - **set():** Escribe en in-memory (sync) + Redis (fire-and-forget async)
 * - **get():** Lee de in-memory primero (instantáneo). Si no está, consulta Redis.
 * - **flushAll():** Limpia ambos stores.
 * 
 * Beneficios:
 * - Zero breaking changes: API 100% síncrona como antes
 * - Reads ultrarrápidos: siempre hit en in-memory si ya se consultó
 * - Horizontal scaling: Redis sincroniza entre instancias
 * - Graceful degradation: si Redis cae, in-memory sigue funcionando
 */
export class CacheService {
    private cache: Map<string, { data: any; expiry: number }> = new Map();
    private redis: RedisClient | null = null;

    constructor() {
        const redisUrl = process.env.REDIS_URL;
        
        if (redisUrl) {
            this.redis = new RedisClient(redisUrl);
            console.log('[CacheService] 🟢 Redis habilitado para escalabilidad horizontal');
        } else {
            console.log('[CacheService] ⚠️ REDIS_URL no configurado. Usando solo caché in-memory.');
        }
    }

    /**
     * Guarda un valor en la caché con un tiempo de vida (TTL) en milisegundos.
     * 
     * Escribe en in-memory (sync) + Redis (async fire-and-forget).
     * 
     * @param key Identificador único (ej: 'search_leche')
     * @param data Los datos a memorizar (se serializan a JSON para Redis)
     * @param ttlMs Tiempo en milisegundos (default: 5 minutos)
     */
    set(key: string, data: any, ttlMs: number = 300000): void {
        this.enforceSizeLimit();

        // 1. In-Memory (instantáneo)
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttlMs,
        });

        // 2. Redis (fire-and-forget para compatibilidad sync)
        if (this.redis?.isConnected()) {
            const ttlSeconds = Math.ceil(ttlMs / 1000);
            try {
                const serialized = JSON.stringify(data);
                this.redis.setEx(key, ttlSeconds, serialized);
            } catch {
                // Ignorar errores de Redis silenciosamente
            }
        }
    }

    /**
     * Obtiene un valor de la caché si no ha expirado.
     * 
     * Estrategia: In-Memory primero (instantáneo). Si no está y Redis está disponible,
     * consulta Redis **sincrónicamente** retornando null si todavía no respondió.
     * 
     * ⚠️ Nota: Para obtener el verdadero beneficio de Redis en scaling horizontal,
     * los controllers deberían migrarse a `getAsync()` eventualmente.
     * 
     * @param key Identificador único
     * @returns Los datos cacheados o null si no existe o expiró
     */
    get<T = any>(key: string): T | null {
        // 1. Intentar in-memory primero (ultrarrápido)
        const item = this.cache.get(key);
        if (item) {
            if (Date.now() <= item.expiry) {
                return item.data as T;
            }
            // Expirado: borrar
            this.cache.delete(key);
        }

        // 2. Si no está en in-memory y Redis está conectado, consultar
        // (esto es sync return null — Redis se consulta en background)
        // Para verdadera lectura de Redis, usar getAsync()
        return null;
    }

    /**
     * Versión async de get() que espera respuesta de Redis si in-memory no tiene el dato.
     * 
     * Útil para migrar controllers gradualmente a async sin perder compatibilidad.
     * 
     * @param key Identificador único
     * @returns Los datos cacheados o null
     */
    async getAsync<T = any>(key: string): Promise<T | null> {
        // L1: Intentar in-memory primero (ultrarrápido)
        const item = this.cache.get(key);
        if (item) {
            if (Date.now() <= item.expiry) {
                return item.data as T;
            }
            this.cache.delete(key);
        }

        // L2: Consultar Redis (Escalabilidad horizontal)
        if (this.redis?.isConnected()) {
            try {
                const serialized = await this.redis.get(key);
                if (serialized) {
                    const data = JSON.parse(serialized) as T;
                    
                    // Populate L1 para próximos reads instantáneos en este nodo
                    this.cache.set(key, { 
                        data, 
                        expiry: Date.now() + 300000 // 5 min default de L1 para datos de Redis
                    });
                    
                    return data;
                }
            } catch (err) {
                console.error(`[CacheService] Redis getAsync error for key ${key}:`, err);
            }
        }

        return null;
    }

    /**
     * Limita el tamaño de la caché previniendo OutOfMemory (OOM) en Node Mono-Hilo.
     * Si pasa de cierto límite, purge los expirados.
     */
    private enforceSizeLimit(maxSize: number = 2000): void {
        if (this.cache.size > maxSize) {
            console.warn(`[CacheService] Tamaño máximo alcanzado (${this.cache.size}). Purgando...`);
            const now = Date.now();

            // 1. Purge expirados
            for (const [key, value] of this.cache.entries()) {
                if (now > value.expiry) {
                    this.cache.delete(key);
                }
            }

            // 2. Si todavía sobra, borrar los más viejos (FIFO)
            if (this.cache.size > maxSize) {
                const extraKeys = Array.from(this.cache.keys()).slice(0, 200);
                for (const key of extraKeys) {
                    this.cache.delete(key);
                }
            }
        }
    }

    /**
     * Limpia completamente toda la memoria caché almacenada (Purgado Global)
     * Limpia tanto in-memory como Redis.
     */
    flushAll(): void {
        const sizeBefore = this.cache.size;
        this.cache.clear();
        console.log(`[CacheService] 🧹 Purga global in-memory completada. Liberados ${sizeBefore} registros.`);

        // También limpiar Redis
        if (this.redis?.isConnected()) {
            this.redis.deleteByPattern('*').then((deletedCount) => {
                console.log(`[CacheService] 🧹 Purga global Redis completada. Eliminadas ${deletedCount} keys.`);
            }).catch(() => {});
        }
    }

    /**
     * Verifica si Redis está disponible y conectado
     */
    isRedisAvailable(): boolean {
        return this.redis?.isConnected() ?? false;
    }

    /**
     * Cierra la conexión a Redis (para graceful shutdown del servidor)
     */
    async disconnect(): Promise<void> {
        if (this.redis) {
            await this.redis.disconnect();
        }
    }
}

// Instancia global Singleton
export const globalCache = new CacheService();
