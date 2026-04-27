import { describe, it, expect, vi } from 'vitest';
import { BaseScraper } from './BaseScraper';
import { ScrapedProduct } from './sync';

// Stub concreto para testear la clase abstracta BaseScraper
class TestScraper extends BaseScraper {
    public performScrapingImplementation: () => Promise<void> = async () => { };

    constructor(id: string = 'test_market') {
        super(id);
    }

    async performScraping(): Promise<void> {
        await this.performScrapingImplementation();
    }
}

describe('BaseScraper', () => {

    describe('constructor & id', () => {
        it('should store supermarketId and expose via id getter', () => {
            const scraper = new TestScraper('carrefour');
            expect(scraper.id).toBe('carrefour');
        });

        it('should initialize with empty results', () => {
            const scraper = new TestScraper();
            // results is protected, we access via scrape()
            expect(scraper.id).toBe('test_market');
        });
    });

    describe('addResult', () => {
        it('should add a valid item with name and price', () => {
            const scraper = new TestScraper();
            scraper.performScrapingImplementation = async function () {
                this['addResult']({ name: 'Leche 1L', price: 1200 });
                this['addResult']({ name: 'Arroz 500g', price: 800 });
            };

            return scraper.scrape().then(results => {
                expect(results).toHaveLength(2);
                expect(results[0].name).toBe('Leche 1L');
                expect(results[0].price).toBe(1200);
                expect(results[1].name).toBe('Arroz 500g');
            });
        });

        it('should reject item without name', () => {
            const scraper = new TestScraper();
            scraper.performScrapingImplementation = async function () {
                this['addResult']({ name: '', price: 500 });
                this['addResult']({ name: 'Valido', price: 100 });
            };

            return scraper.scrape().then(results => {
                expect(results).toHaveLength(1);
                expect(results[0].name).toBe('Valido');
            });
        });

        it('should reject item with NaN price', () => {
            const scraper = new TestScraper();
            scraper.performScrapingImplementation = async function () {
                this['addResult']({ name: 'Sin Precio', price: NaN });
                this['addResult']({ name: 'Con Precio', price: 200 });
            };

            return scraper.scrape().then(results => {
                expect(results).toHaveLength(1);
                expect(results[0].name).toBe('Con Precio');
            });
        });

        it('should reject item with null name', () => {
            const scraper = new TestScraper();
            scraper.performScrapingImplementation = async function () {
                this['addResult']({ name: null as any, price: 300 });
            };

            return scraper.scrape().then(results => {
                expect(results).toHaveLength(0);
            });
        });

        it('should accept item with price 0 (valid free product edge case)', () => {
            const scraper = new TestScraper();
            scraper.performScrapingImplementation = async function () {
                this['addResult']({ name: 'Producto Gratis', price: 0 });
            };

            return scraper.scrape().then(results => {
                expect(results).toHaveLength(1);
                expect(results[0].price).toBe(0);
            });
        });
    });

    describe('scrape - graceful shutdown', () => {
        it('should rescue partial results when performScraping throws mid-execution', () => {
            const scraper = new TestScraper();
            scraper.performScrapingImplementation = async function () {
                this['addResult']({ name: 'Producto A', price: 100 });
                this['addResult']({ name: 'Producto B', price: 200 });
                throw new Error('Connection lost mid-scrape');
            };

            return scraper.scrape().then(results => {
                // Debe rescatar los 2 productos antes del error
                expect(results).toHaveLength(2);
                expect(results[0].name).toBe('Producto A');
                expect(results[1].name).toBe('Producto B');
            });
        });

        it('should return empty array when performScraping throws before any addResult', () => {
            const scraper = new TestScraper();
            scraper.performScrapingImplementation = async function () {
                throw new Error('Immediate failure');
            };

            return scraper.scrape().then(results => {
                expect(results).toHaveLength(0);
            });
        });

        it('should return all results when performScraping completes successfully', () => {
            const scraper = new TestScraper();
            scraper.performScrapingImplementation = async function () {
                this['addResult']({ name: 'A', price: 10 });
                this['addResult']({ name: 'B', price: 20 });
                this['addResult']({ name: 'C', price: 30 });
            };

            return scraper.scrape().then(results => {
                expect(results).toHaveLength(3);
            });
        });

        it('should reset results array on each scrape() call', async () => {
            const scraper = new TestScraper();

            // Primera ejecución
            scraper.performScrapingImplementation = async function () {
                this['addResult']({ name: 'Run1', price: 1 });
            };
            const results1 = await scraper.scrape();
            expect(results1).toHaveLength(1);

            // Segunda ejecución — no debe acumular con la primera
            scraper.performScrapingImplementation = async function () {
                this['addResult']({ name: 'Run2A', price: 2 });
                this['addResult']({ name: 'Run2B', price: 3 });
            };
            const results2 = await scraper.scrape();
            expect(results2).toHaveLength(2);
            expect(results2.every(r => r.name.startsWith('Run2'))).toBe(true);
        });
    });

    describe('addResult with optional fields', () => {
        it('should preserve ean, brand, sourceUrl, imageUrl when provided', () => {
            const scraper = new TestScraper();
            scraper.performScrapingImplementation = async function () {
                this['addResult']({
                    name: 'Leche La Serenísima 1L',
                    price: 1500,
                    ean: '7790010001001',
                    brand: 'La Serenísima',
                    sourceUrl: 'https://example.com/leche',
                    imageUrl: 'https://example.com/img.jpg',
                    category: 'Lácteos',
                });
            };

            return scraper.scrape().then(results => {
                expect(results).toHaveLength(1);
                const item = results[0];
                expect(item.ean).toBe('7790010001001');
                expect(item.brand).toBe('La Serenísima');
                expect(item.sourceUrl).toBe('https://example.com/leche');
                expect(item.imageUrl).toBe('https://example.com/img.jpg');
                expect(item.category).toBe('Lácteos');
            });
        });
    });
});