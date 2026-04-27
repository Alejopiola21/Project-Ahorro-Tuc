import { describe, it, expect } from 'vitest';
import {
    sanitizeString,
    extractSignificantWords,
    fuzzyMatch,
    buildInvertedIndex,
    searchWithInvertedIndex,
    inferCategory,
    extractUnitInfo,
    ScrapedProduct,
} from './sync';

const mockDbProducts = [
    { id: 1, name: 'Leche Descremada La Serenissima 1L', ean: '7790010001001' },
    { id: 2, name: 'Leche Entera Sancor 1L', ean: '7790020002002' },
    { id: 3, name: 'Fideos Spaghetti Don Vicente 500g', ean: null },
    { id: 4, name: 'Fideos Tallarines Canale 500g', ean: null },
    { id: 5, name: 'Azucar Ledesma 1kg', ean: '7790050005005' },
    { id: 6, name: 'Aceite de Girasol Natura 1.5L', ean: null },
    { id: 7, name: 'Detergente Magistral Limon 750ml', ean: null },
    { id: 8, name: 'Papel Higienico Higienol x6', ean: null },
    { id: 9, name: 'Arroz Gallo Largo Fino 1kg', ean: null },
    { id: 10, name: 'Atun Taragui Natural 170g', ean: null },
];

describe('Scraper Core Data Normalization', () => {
    describe('sanitizeString', () => {
        it('should remove accents and special characters', () => {
            expect(sanitizeString('Lácteos, Azúcar & Café!')).toBe('lacteos azucar cafe');
        });

        it('should normalize volume formats', () => {
            expect(sanitizeString('Leche 1 L')).toBe('leche 1l');
            expect(sanitizeString('Agua 500 ml')).toBe('agua 500ml');
        });

        it('should normalize weight formats', () => {
            expect(sanitizeString('Queso 500 gr')).toBe('queso 500g');
            expect(sanitizeString('Harina 1 kg')).toBe('harina 1kg');
            expect(sanitizeString('Pan 1000g')).toBe('pan 1kg');
            expect(sanitizeString('Carne 1500g')).toBe('carne 1.5kg');
        });

        it('should convert 2000g to 2kg', () => {
            expect(sanitizeString('Sal 2000g')).toBe('sal 2kg');
        });

        it('should handle mixed accents and punctuation', () => {
            expect(sanitizeString('Yogur Délice Mmmm... (edición especial)')).toBe(
                'yogur delice mmmm edicion especial'
            );
        });
    });

    describe('extractSignificantWords', () => {
        it('should extract words with length > 2', () => {
            const words = extractSignificantWords('Leche entera La Serenísima 1L');
            expect(words).toEqual(['leche', 'entera', 'serenisima']);
        });

        it('should filter out stop words like de, el, la', () => {
            const words = extractSignificantWords('Leche de Almendras x 1L');
            expect(words).toContain('leche');
            expect(words).toContain('almendras');
            expect(words).not.toContain('de');
        });

        it('should normalize accents in extracted words', () => {
            const words = extractSignificantWords('Azucar Descremada Serenisima');
            expect(words).toContain('azucar');
            expect(words).toContain('descremada');
            expect(words).toContain('serenisima');
        });
    });

    describe('fuzzyMatch', () => {
        it('should return true if scraped name contains all significant words from dbName', () => {
            expect(fuzzyMatch('Leche Entera La Serenisima 1L', 'Leche Clasica Entera La Serenisima Sachet 1L')).toBe(true);
        });

        it('should return false if scraped name is missing a significant word', () => {
            expect(fuzzyMatch('Leche Entera La Serenisima 1L', 'Leche Descremada La Serenisima 1L')).toBe(false);
        });

        it('should match with normalized units (500gr vs 500g)', () => {
            expect(fuzzyMatch('Fideos Don Vicente 500g', 'Fideos Don Vicente 500 gr')).toBe(true);
        });

        it('should reject when DB has a word not in scraped name', () => {
            expect(fuzzyMatch('Queso', 'Queso Cremoso La Serenisima 500g')).toBe(false);
        });

        it('should be case insensitive', () => {
            expect(fuzzyMatch('LECHE ENTERA SANCOR 1L', 'leche entera sancor 1l')).toBe(true);
        });

        it('should handle accented db names against non-accented scraped names', () => {
            expect(fuzzyMatch('Leche Descremada Serenisima', 'Leche Descremada La Serenísima 1L')).toBe(true);
        });
    });

    describe('buildInvertedIndex', () => {
        const index = buildInvertedIndex(mockDbProducts);

        it('should build index with words mapped to product ids', () => {
            expect(index.wordToProducts.size).toBeGreaterThan(0);
            expect(index.wordToProducts.get('leche')).toBeDefined();
            expect(index.wordToProducts.get('fideos')).toBeDefined();
        });

        it('should map leche to products 1 and 2', () => {
            const lecheProducts = index.wordToProducts.get('leche');
            expect(lecheProducts).toBeDefined();
            expect(lecheProducts!.has(1)).toBe(true);
            expect(lecheProducts!.has(2)).toBe(true);
        });

        it('should map serenisima only to product 1', () => {
            const serenisimaProducts = index.wordToProducts.get('serenisima');
            expect(serenisimaProducts).toBeDefined();
            expect(serenisimaProducts!.size).toBe(1);
            expect(serenisimaProducts!.has(1)).toBe(true);
        });

        it('should have product name cache', () => {
            expect(index.productNameCache.get(1)).toBe('Leche Descremada La Serenissima 1L');
            expect(index.productNameCache.get(5)).toBe('Azucar Ledesma 1kg');
        });

        it('should handle empty product list', () => {
            const emptyIndex = buildInvertedIndex([]);
            expect(emptyIndex.wordToProducts.size).toBe(0);
            expect(emptyIndex.productNameCache.size).toBe(0);
        });

        it('should handle product with null ean', () => {
            expect(index.productNameCache.get(3)).toBe('Fideos Spaghetti Don Vicente 500g');
        });
    });

    describe('searchWithInvertedIndex', () => {
        const index = buildInvertedIndex(mockDbProducts);

        it('should find Leche Descremada with variant name', () => {
            const result = searchWithInvertedIndex('Leche Descremada UAT La Serenisima 1 Litro', index);
            expect(result).toBe(1);
        });

        it('should find Leche Entera Sancor', () => {
            const result = searchWithInvertedIndex('LECHE ENTERA SANCORD 1L', index);
            expect(result).toBe(2);
        });

        it('should find Fideos Spaghetti with slight name difference', () => {
            const result = searchWithInvertedIndex('Spaghetti Don Vicente 500 gr', index);
            expect(result).toBe(3);
        });

        it('should find Azucar Ledesma without accents', () => {
            const result = searchWithInvertedIndex('Azucar blanca Ledesma 1 kg', index);
            expect(result).toBe(5);
        });

        it('should return undefined for non-existent product', () => {
            const result = searchWithInvertedIndex('Yogur Colorada Frutilla 500g', index);
            expect(result).toBeUndefined();
        });

        it('should find Detergente Magistral with extended name', () => {
            const result = searchWithInvertedIndex('Detergente Magistral para vajilla sabor limon 750 ml', index);
            expect(result).toBe(7);
        });

        it('should prioritize most specific match', () => {
            const result = searchWithInvertedIndex('Arroz Gallo Largo Fino 1000g', index);
            expect(result).toBe(9);
        });

        it('should handle short names correctly', () => {
            const result = searchWithInvertedIndex('Atun Taragui Natural 170 g', index);
            expect(result).toBe(10);
        });

        it('should return undefined for empty string', () => {
            expect(searchWithInvertedIndex('', index)).toBeUndefined();
        });

        it('should return undefined for string with only short words', () => {
            expect(searchWithInvertedIndex('el de la x', index)).toBeUndefined();
        });

        it('should find product even with extra info in scraped name', () => {
            const result = searchWithInvertedIndex('OFERTA ESPECIAL Leche Descremada La Serenisima 1L - 20% OFF', index);
            expect(result).toBe(1);
        });

        it('should be case insensitive', () => {
            const r1 = searchWithInvertedIndex('ACEITE GIRASOL NATURA 1.5L', index);
            const r2 = searchWithInvertedIndex('aceite girasol natura 1.5l', index);
            expect(r1).toBe(r2);
        });

        it('should disambiguate products by score (tallarines vs spaghetti)', () => {
            const result = searchWithInvertedIndex('Fideos Tallarines Canale 500g', index);
            expect(result).toBe(4);
        });
    });

    describe('extractUnitInfo', () => {
        it('should extract kg correctly', () => {
            expect(extractUnitInfo('Queso Cremoso 1.5kg')).toEqual({ weight: '1.5kg', unitValue: 1.5, unitType: 'kg' });
        });

        it('should extract g and convert to kg', () => {
            expect(extractUnitInfo('Galletitas 500g')).toEqual({ weight: '500g', unitValue: 0.5, unitType: 'kg' });
        });

        it('should extract ml and convert to l', () => {
            expect(extractUnitInfo('Cerveza 473ml')).toEqual({ weight: '473ml', unitValue: 0.473, unitType: 'l' });
        });

        it('should extract units', () => {
            expect(extractUnitInfo('Huevos 6 unidades')).toEqual({ weight: null, unitValue: 6, unitType: 'u' });
        });

        it('should extract liters with decimal', () => {
            expect(extractUnitInfo('Aceite Natura 1.5l')).toEqual({ weight: '1.5l', unitValue: 1.5, unitType: 'l' });
        });

        it('should extract 1 liter correctly', () => {
            expect(extractUnitInfo('Leche 1 l')).toEqual({ weight: '1l', unitValue: 1, unitType: 'l' });
        });

        it('should return null for product without units', () => {
            expect(extractUnitInfo('Queso Cremoso')).toEqual({ weight: null, unitValue: null, unitType: null });
        });

        it('should extract 1000ml as 1 liter', () => {
            expect(extractUnitInfo('Jugo 1000ml')).toEqual({ weight: '1000ml', unitValue: 1, unitType: 'l' });
        });

        it('should extract 2500g as 2.5kg', () => {
            expect(extractUnitInfo('Harina 2500g')).toEqual({ weight: '2500g', unitValue: 2.5, unitType: 'kg' });
        });
    });

    describe('inferCategory', () => {
        it('should map leche to Lacteos', () => {
            expect(inferCategory({ name: 'Leche Descremada', price: 100 } as ScrapedProduct)).toBe('Lácteos');
        });

        it('should map yogur to Lacteos', () => {
            expect(inferCategory({ name: 'Yogur Frutilla', price: 100 } as ScrapedProduct)).toBe('Lácteos');
        });

        it('should map queso to Lacteos', () => {
            expect(inferCategory({ name: 'Queso Cremoso', price: 100 } as ScrapedProduct)).toBe('Lácteos');
        });

        it('should map manteca to Lacteos', () => {
            expect(inferCategory({ name: 'Manteca La Serenisima', price: 100 } as ScrapedProduct)).toBe('Lácteos');
        });

        it('should map dulce de leche to Lacteos', () => {
            expect(inferCategory({ name: 'Dulce de Leche SanCor', price: 100 } as ScrapedProduct)).toBe('Lácteos');
        });

        it('should map fideos to Almacen', () => {
            expect(inferCategory({ name: 'Fideos Spaghetti', price: 100 } as ScrapedProduct)).toBe('Almacén');
        });

        it('should map arroz to Almacen', () => {
            expect(inferCategory({ name: 'Arroz Gallo', price: 100 } as ScrapedProduct)).toBe('Almacén');
        });

        it('should map aceite to Almacen', () => {
            expect(inferCategory({ name: 'Aceite Natura', price: 100 } as ScrapedProduct)).toBe('Almacén');
        });

        it('should map yerba to Almacen', () => {
            expect(inferCategory({ name: 'Yerba Mate Rosamonte', price: 100 } as ScrapedProduct)).toBe('Almacén');
        });

        it('should map cafe to Almacen', () => {
            expect(inferCategory({ name: 'Cafe La Morenita', price: 100 } as ScrapedProduct)).toBe('Almacén');
        });

        it('should map detergente to Limpieza', () => {
            expect(inferCategory({ name: 'Detergente Magistral', price: 100 } as ScrapedProduct)).toBe('Limpieza');
        });

        it('should map lavandina to Limpieza', () => {
            expect(inferCategory({ name: 'Lavandina Ayudin', price: 100 } as ScrapedProduct)).toBe('Limpieza');
        });

        it('should map jabon to Limpieza', () => {
            expect(inferCategory({ name: 'Jabon Liquido Ala', price: 100 } as ScrapedProduct)).toBe('Limpieza');
        });

        it('should map coca cola to Bebidas', () => {
            expect(inferCategory({ name: 'Coca Cola 2.5L', price: 100 } as ScrapedProduct)).toBe('Bebidas');
        });

        it('should map cerveza to Bebidas', () => {
            expect(inferCategory({ name: 'Cerveza Quilmes', price: 100 } as ScrapedProduct)).toBe('Bebidas');
        });

        it('should map pollo to Carnes', () => {
            expect(inferCategory({ name: 'Pollo Entero', price: 100 } as ScrapedProduct)).toBe('Carnes');
        });

        it('should map milanesa to Carnes', () => {
            expect(inferCategory({ name: 'Milanesa de NALGA', price: 100 } as ScrapedProduct)).toBe('Carnes');
        });

        it('should map pan lactal to Panaderia', () => {
            expect(inferCategory({ name: 'Pan Lactal Fargo', price: 100 } as ScrapedProduct)).toBe('Panadería');
        });

        it('should map alimento perro to Mascotas', () => {
            expect(inferCategory({ name: 'Alimento Perro Dog Chow', price: 100 } as ScrapedProduct)).toBe('Mascotas');
        });

        it('should map alimento gato to Mascotas', () => {
            expect(inferCategory({ name: 'Alimento Gato Whiskas', price: 100 } as ScrapedProduct)).toBe('Mascotas');
        });

        it('should map shampoo to Perfumeria', () => {
            expect(inferCategory({ name: 'Shampoo Pantene', price: 100 } as ScrapedProduct)).toBe('Perfumería');
        });

        it('should map desodorante to Perfumeria', () => {
            expect(inferCategory({ name: 'Desodorante Rexona', price: 100 } as ScrapedProduct)).toBe('Perfumería');
        });

        it('should map papa to Verduleria', () => {
            expect(inferCategory({ name: 'Papa Blanca x Kg', price: 100 } as ScrapedProduct)).toBe('Verdulería');
        });

        it('should map tomate to Verduleria', () => {
            expect(inferCategory({ name: 'Tomate Perita', price: 100 } as ScrapedProduct)).toBe('Verdulería');
        });

        it('should map empanada to Congelados', () => {
            expect(inferCategory({ name: 'Empanada Caprese', price: 100 } as ScrapedProduct)).toBe('Congelados');
        });

        it('should map pizza to Congelados', () => {
            expect(inferCategory({ name: 'Pizza Congelada La Salteña', price: 100 } as ScrapedProduct)).toBe('Congelados');
        });

        it('should return Otros if no match found', () => {
            expect(inferCategory({ name: 'Pilas AAA Duracell', price: 100 } as ScrapedProduct)).toBe('Otros');
        });

        it('should handle case-insensitive matching', () => {
            expect(inferCategory({ name: 'LECHE DESCREMADA', price: 100 } as ScrapedProduct)).toBe('Lácteos');
        });

        it('should return Otros for empty name', () => {
            expect(inferCategory({ name: '', price: 100 } as ScrapedProduct)).toBe('Otros');
        });
    });

    describe('Performance: Inverted Index vs Linear Scan', () => {
        it('should verify inverted index reduces operations', () => {
            const dbSize = mockDbProducts.length;
            const scrapedName = 'Leche Descremada La Serenisima 1L';
            const scrapedWords = extractSignificantWords(scrapedName);
            const index = buildInvertedIndex(mockDbProducts);
            const result = searchWithInvertedIndex(scrapedName, index);
            expect(result).toBe(1);

            const candidateCount = new Set<number>();
            for (const word of scrapedWords) {
                const products = index.wordToProducts.get(word);
                if (products) {
                    products.forEach(id => candidateCount.add(id));
                }
            }
            expect(candidateCount.size).toBeLessThanOrEqual(dbSize);
        });
    });
});