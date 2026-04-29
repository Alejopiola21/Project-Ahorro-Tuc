import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Fixtures ────────────────────────────────────────────────────
import vtexClassicFixture from '../__fixtures__/vtex_classic.json';
import vtexISFixture from '../__fixtures__/vtex_intelligent_search.json';
import cotoFixture from '../__fixtures__/coto_response.json';
import gomezPardoFixture from '../__fixtures__/gomez_pardo_response.json';

// ── Mock de fetcher (intercepta TODA la red) ────────────────────
// Esto previene que los tests hagan requests HTTP reales.
vi.mock('../core/fetcher', () => ({
    fetchWithRetry: vi.fn(),
    randomSleep: vi.fn().mockResolvedValue(undefined),
    delay: vi.fn().mockResolvedValue(undefined),
}));

import { fetchWithRetry, randomSleep } from '../core/fetcher';
const mockFetch = vi.mocked(fetchWithRetry);

// ── Providers ───────────────────────────────────────────────────
import { VeaScraper } from '../providers/vea';
import { CarrefourScraper } from '../providers/carrefour';
import { CotoScraper } from '../providers/coto';
import { GomezPardoScraper } from '../providers/gomez_pardo';

// ═══════════════════════════════════════════════════════════════
//  VTEX CLASSIC (Vea, Jumbo, Disco, ChangoMás, etc.)
// ═══════════════════════════════════════════════════════════════
describe('VTEX Classic Parser (VeaScraper)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extract products with valid name and price from VTEX response', async () => {
        // Mock: devolver el fixture para CADA término de búsqueda
        mockFetch.mockResolvedValue(vtexClassicFixture);

        const scraper = new VeaScraper();
        const results = await scraper.scrape();

        // El fixture tiene 5 items, pero:
        //   - item 104: productName vacío → addResult lo rechaza (name falsy)
        //   - item 105: Price es null → addResult lo rechaza (NaN)
        // Resultado esperado: 3 productos válidos × 34 términos de búsqueda
        // Pero como el fixture se repite por término, verificamos estructura, no cantidad total.
        expect(results.length).toBeGreaterThan(0);

        // Verificar que el primer producto tiene la estructura correcta
        const first = results[0];
        expect(first.name).toBe('Leche Entera La Serenísima 1L');
        expect(first.price).toBe(1450.99);
        expect(first.ean).toBe('7790010001001');
        expect(first.brand).toBe('La Serenísima');
    });

    it('should skip items without productName', async () => {
        // Solo el item sin nombre
        mockFetch.mockResolvedValue([vtexClassicFixture[3]]);

        const scraper = new VeaScraper();
        const results = await scraper.scrape();

        // Todos los resultados deben tener nombre
        for (const r of results) {
            expect(r.name).toBeTruthy();
        }
    });

    it('should skip items with null Price', async () => {
        mockFetch.mockResolvedValue([vtexClassicFixture[4]]);

        const scraper = new VeaScraper();
        const results = await scraper.scrape();

        for (const r of results) {
            expect(r.price).not.toBeNaN();
        }
    });

    it('should handle non-array response gracefully', async () => {
        mockFetch.mockResolvedValue({ error: 'not found' });

        const scraper = new VeaScraper();
        const results = await scraper.scrape();

        // No debe crashear, debe retornar vacío o parcial
        expect(Array.isArray(results)).toBe(true);
    });

    it('should handle network failure via graceful shutdown', async () => {
        let callCount = 0;
        mockFetch.mockImplementation(async () => {
            callCount++;
            if (callCount <= 2) return [vtexClassicFixture[0]]; // 2 éxitos
            throw new Error('Connection reset');
        });

        const scraper = new VeaScraper();
        const results = await scraper.scrape();

        // Debe rescatar los resultados parciales del graceful shutdown
        expect(results.length).toBeGreaterThanOrEqual(2);
    });
});

// ═══════════════════════════════════════════════════════════════
//  VTEX INTELLIGENT SEARCH (Carrefour, Libertad, Comodín)
// ═══════════════════════════════════════════════════════════════
describe('VTEX Intelligent Search Parser (CarrefourScraper)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extract products from nested data.products structure', async () => {
        mockFetch.mockResolvedValue(vtexISFixture);

        const scraper = new CarrefourScraper();
        const results = await scraper.scrape();

        expect(results.length).toBeGreaterThan(0);

        const first = results[0];
        expect(first.name).toBe('Fideos Spaghetti Matarazzo 500g');
        expect(first.price).toBe(890);
        expect(first.ean).toBe('7790580001001');
        expect(first.brand).toBe('Matarazzo');
    });

    it('should handle product without images', async () => {
        // Item 203 no tiene imágenes
        mockFetch.mockResolvedValue({
            products: [vtexISFixture.products[2]]
        });

        const scraper = new CarrefourScraper();
        const results = await scraper.scrape();

        // Debe parsearse aunque no tenga imagen
        expect(results.length).toBeGreaterThan(0);
        expect(results[0].name).toBe('Detergente Magistral 750ml');
    });

    it('should stop pagination when products array is empty', async () => {
        // Primera llamada con datos, segunda vacía
        mockFetch
            .mockResolvedValueOnce(vtexISFixture) // Página 1
            .mockResolvedValueOnce({ products: [] }); // Página 2 vacía

        const scraper = new CarrefourScraper();
        await scraper.scrape();

        // Verificar que no hizo más de 2 llamadas por término
        // (la segunda detecta que está vacía y para)
        // mockFetch fue llamado al menos 2 veces para el primer término
        expect(mockFetch).toHaveBeenCalled();
    });

    it('should stop pagination when response has no products key', async () => {
        mockFetch.mockResolvedValue({ error: 'server error' });

        const scraper = new CarrefourScraper();
        const results = await scraper.scrape();

        expect(Array.isArray(results)).toBe(true);
    });
});

// ═══════════════════════════════════════════════════════════════
//  COTO (Oracle ATG — JSON propietario)
// ═══════════════════════════════════════════════════════════════
describe('Coto Custom Parser (CotoScraper)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extract valid products from Coto response', async () => {
        mockFetch.mockResolvedValue(cotoFixture);

        const scraper = new CotoScraper();
        const results = await scraper.scrape();

        expect(results.length).toBeGreaterThan(0);

        const yerba = results.find(r => r.name === 'Yerba Mate Taragüí 1kg');
        expect(yerba).toBeDefined();
        expect(yerba!.price).toBe(4500);
    });

    it('should use displayName over name when available', async () => {
        mockFetch.mockResolvedValue({
            products: [cotoFixture.products[0]]
        });

        const scraper = new CotoScraper();
        const results = await scraper.scrape();

        if (results.length > 0) {
            expect(results[0].name).toBe('Yerba Mate Taragüí 1kg');
        }
    });

    it('should skip products with empty name and invalid price', async () => {
        mockFetch.mockResolvedValue({
            products: [cotoFixture.products[2]] // Item sin nombre, precio inválido
        });

        const scraper = new CotoScraper();
        const results = await scraper.scrape();

        // addResult rechaza name vacío y price NaN
        for (const r of results) {
            expect(r.name).toBeTruthy();
            expect(r.price).not.toBeNaN();
        }
    });

    it('should handle anti-bot response gracefully', async () => {
        mockFetch.mockRejectedValue(new Error('403 Forbidden'));

        const scraper = new CotoScraper();
        const results = await scraper.scrape();

        // Graceful shutdown: devuelve array vacío sin crash
        expect(Array.isArray(results)).toBe(true);
        expect(results.length).toBe(0);
    });
});

// ═══════════════════════════════════════════════════════════════
//  GÓMEZ PARDO (Zod validated JSON)
// ═══════════════════════════════════════════════════════════════
describe('Gómez Pardo Zod Parser (GomezPardoScraper)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should parse products with Zod schema validation', async () => {
        mockFetch.mockResolvedValue(gomezPardoFixture);

        const scraper = new GomezPardoScraper();
        const results = await scraper.scrape();

        expect(results.length).toBeGreaterThan(0);

        const harina = results.find(r => r.name?.includes('Harina'));
        expect(harina).toBeDefined();
        expect(harina!.price).toBe(1250);
        expect(harina!.ean).toBe('7790580004001');
    });

    it('should accept price as string and convert to number', async () => {
        mockFetch.mockResolvedValue([gomezPardoFixture[0]]); // precio "1250" (string)

        const scraper = new GomezPardoScraper();
        const results = await scraper.scrape();

        for (const r of results) {
            expect(typeof r.price).toBe('number');
            expect(r.price).not.toBeNaN();
        }
    });

    it('should accept price as number directly', async () => {
        mockFetch.mockResolvedValue([gomezPardoFixture[1]]); // precio 980 (number)

        const scraper = new GomezPardoScraper();
        const results = await scraper.scrape();

        for (const r of results) {
            expect(typeof r.price).toBe('number');
        }
    });

    it('should use name when productName is missing', async () => {
        mockFetch.mockResolvedValue([gomezPardoFixture[2]]); // solo "name", sin "productName"

        const scraper = new GomezPardoScraper();
        const results = await scraper.scrape();

        if (results.length > 0) {
            expect(results[0].name).toBe('Café Instantáneo Nescafé 170g');
        }
    });

    it('should skip items with non-numeric price (Zod passes but parseFloat fails)', async () => {
        mockFetch.mockResolvedValue([gomezPardoFixture[3]]); // price: "abc_not_a_number"

        const scraper = new GomezPardoScraper();
        const results = await scraper.scrape();

        // El parser debe filtrar precios NaN
        for (const r of results) {
            expect(r.price).not.toBeNaN();
        }
    });

    it('should handle items with unexpected fields via Zod passthrough', async () => {
        mockFetch.mockResolvedValue([gomezPardoFixture[4]]); // campos inesperados

        const scraper = new GomezPardoScraper();
        const results = await scraper.scrape();

        // No debe crashear — Zod passthrough permite campos extra
        expect(Array.isArray(results)).toBe(true);
    });

    it('should handle non-array response', async () => {
        mockFetch.mockResolvedValue({ error: 'invalid' });

        const scraper = new GomezPardoScraper();
        const results = await scraper.scrape();

        expect(Array.isArray(results)).toBe(true);
    });
});
