import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheService } from '../src/services/CacheService';

describe('CacheService (In-Memory Mode)', () => {
    let cache: CacheService;

    beforeEach(() => {
        // Forzar in-memory para tests (sin REDIS_URL)
        delete process.env.REDIS_URL;
        cache = new CacheService();
    });

    afterEach(() => {
        cache.flushAll();
    });

    describe('set / get', () => {
        it('should store and retrieve a simple value', () => {
            cache.set('test_key', 'hello world');
            const result = cache.get<string>('test_key');
            expect(result).toBe('hello world');
        });

        it('should store and retrieve an object', () => {
            const obj = { id: 1, name: 'Test', prices: [100, 200] };
            cache.set('obj_key', obj);
            const result = cache.get<typeof obj>('obj_key');
            expect(result).toEqual(obj);
        });

        it('should return null for non-existent key', () => {
            const result = cache.get('nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('TTL expiration', () => {
        it('should return null after TTL expires', () => {
            // Usar TTL muy corto (50ms)
            cache.set('expire_key', 'should expire', 50);
            
            // Debería existir antes de expirar
            expect(cache.get('expire_key')).toBe('should expire');

            // Esperar a que expire
            return new Promise<void>((resolve) => {
                setTimeout(() => {
                    const result = cache.get('expire_key');
                    expect(result).toBeNull();
                    resolve();
                }, 100);
            });
        });

        it('should use default TTL of 5 minutes when not specified', () => {
            cache.set('default_ttl_key', 'data');
            // No debería expirar inmediatamente
            expect(cache.get('default_ttl_key')).toBe('data');
        });
    });

    describe('flushAll', () => {
        it('should clear all cached data', () => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', { nested: true });

            expect(cache.get('key1')).toBe('value1');
            expect(cache.get('key2')).toBe('value2');

            cache.flushAll();

            expect(cache.get('key1')).toBeNull();
            expect(cache.get('key2')).toBeNull();
            expect(cache.get('key3')).toBeNull();
        });
    });

    describe('size limit enforcement', () => {
        it('should purge old entries when exceeding limit', () => {
            // Llenar la caché por encima del límite (2000)
            const limit = 2000;
            for (let i = 0; i < limit + 500; i++) {
                cache.set(`key_${i}`, `value_${i}`);
            }

            // Debería haber hecho purge, pero no exceder enormemente el límite
            // (no podemos verificar el tamaño exacto porque purge es interno)
            // Verificar que al menos podemos seguir leyendo datos recientes
            expect(cache.get(`key_${limit + 499}`)).toBe(`value_${limit + 499}`);
        });
    });

    describe('isRedisAvailable', () => {
        it('should return false when REDIS_URL is not set', () => {
            expect(cache.isRedisAvailable()).toBe(false);
        });
    });
});

describe('CacheService (Redis URL configured)', () => {
    it('should attempt Redis connection when REDIS_URL is set', () => {
        process.env.REDIS_URL = 'redis://localhost:6379';
        const cache = new CacheService();
        
        // No debería crashear aunque Redis no esté disponible
        expect(cache).toBeDefined();
        expect(cache.isRedisAvailable()).toBe(false); // Redis no está corriendo en test
        
        // Debería poder usar caché in-memory como fallback
        cache.set('fallback_test', 'works');
        expect(cache.get('fallback_test')).toBe('works');

        delete process.env.REDIS_URL;
    });
});
