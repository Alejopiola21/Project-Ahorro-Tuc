import Redis from 'ioredis';

/**
 * Adapter de Redis con TTL nativo del servidor y API síncrona compatible.
 * 
 * Estrategia: Redis se usa async internamente, pero CacheService expone API sync
 * para compatibilidad con código existente. Los writes son fire-and-forget,
 * los reads pueden retornar stale data si Redis no respondió todavía.
 * 
 * Para producción con scaling horizontal, los controllers deberían migrarse
 * a async/await eventualmente.
 */
export class RedisClient {
    private client: Redis;
    private connected = false;

    constructor(redisUrl: string) {
        this.client = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3) return null;
                return Math.min(times * 200, 2000);
            },
            lazyConnect: true,
        });

        this.client.on('connect', () => {
            this.connected = true;
            console.log('[Redis] ✅ Conectado exitosamente');
        });

        this.client.on('error', (err) => {
            this.connected = false;
            console.error(`[Redis] ❌ Error: ${err.message}`);
        });

        this.client.on('close', () => {
            this.connected = false;
            console.warn('[Redis] ⚠️ Conexión cerrada');
        });

        // Intentar conectar en background
        this.client.connect().catch((err) => {
            console.error(`[Redis] ❌ Fallo de conexión: ${err.message}`);
        });
    }

    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Set con TTL — fire-and-forget para compatibilidad sync
     */
    setEx(key: string, ttlSeconds: number, value: string): void {
        if (!this.connected) return;
        
        this.client.setex(key, ttlSeconds, value).catch((err) => {
            console.error(`[Redis] setEx(${key}) failed: ${err.message}`);
        });
    }

    /**
     * Get — retorna Promise para callers que quieran esperar
     */
    async get(key: string): Promise<string | null> {
        if (!this.connected) return null;
        
        try {
            return await this.client.get(key);
        } catch (err: any) {
            console.error(`[Redis] get(${key}) failed: ${err.message}`);
            return null;
        }
    }

    /**
     * Delete por patrón usando SCAN (production-safe)
     */
    async deleteByPattern(pattern: string): Promise<number> {
        if (!this.connected) return 0;

        try {
            const keys: string[] = [];
            const scanStream = this.client.scanStream({ match: pattern, count: 100 });

            await new Promise<void>((resolve, reject) => {
                scanStream.on('data', (resultKeys: string[]) => keys.push(...resultKeys));
                scanStream.on('end', () => resolve());
                scanStream.on('error', reject);
            });

            if (keys.length > 0) {
                await this.client.del(...keys);
            }

            return keys.length;
        } catch (err: any) {
            console.error(`[Redis] deleteByPattern(${pattern}) failed: ${err.message}`);
            return 0;
        }
    }

    /**
     * Graceful shutdown
     */
    async disconnect(): Promise<void> {
        await this.client.quit();
        this.connected = false;
        console.log('[Redis] 🔌 Desconectado');
    }
}
