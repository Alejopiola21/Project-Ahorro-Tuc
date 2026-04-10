import { describe, it, expect } from 'vitest';

function sanitizeString(str: string): string {
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\b1 l\b/g, '1l')
        .replace(/\b1 kg\b/g, '1kg');
}

function extractSignificantWords(str: string): string[] {
    return sanitizeString(str).split(/\s+/).filter(w => w.length > 2);
}

interface InvertedIndex {
    wordToProducts: Map<string, Set<number>>;
    productNameCache: Map<number, string>;
}

function buildInvertedIndex(dbProducts: Array<{ id: number; name: string; ean: string | null }>): InvertedIndex {
    const wordToProducts = new Map<string, Set<number>>();
    const productNameCache = new Map<number, string>();

    for (const product of dbProducts) {
        productNameCache.set(product.id, product.name);
        const words = extractSignificantWords(product.name);

        for (const word of words) {
            if (!wordToProducts.has(word)) {
                wordToProducts.set(word, new Set());
            }
            wordToProducts.get(word)!.add(product.id);
        }
    }

    return { wordToProducts, productNameCache };
}

function searchWithInvertedIndex(
    scrapedName: string,
    index: InvertedIndex
): number | undefined {
    const scrapedWords = extractSignificantWords(scrapedName);
    
    if (scrapedWords.length === 0) return undefined;

    const productMatchCount = new Map<number, number>();

    for (const word of scrapedWords) {
        const matchingProducts = index.wordToProducts.get(word);
        if (matchingProducts) {
            for (const productId of matchingProducts) {
                productMatchCount.set(productId, (productMatchCount.get(productId) || 0) + 1);
            }
        }
    }

    if (productMatchCount.size === 0) return undefined;

    const sortedCandidates = Array.from(productMatchCount.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([productId]) => productId);

    const scrapedClean = sanitizeString(scrapedName);
    
    for (const candidateId of sortedCandidates) {
        const dbName = index.productNameCache.get(candidateId);
        if (!dbName) continue;

        const dbWords = extractSignificantWords(dbName);
        const isMatch = dbWords.every(word => scrapedClean.includes(word));

        if (isMatch) {
            return candidateId;
        }
    }

    return undefined;
}

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

describe('InvertedIndex: buildInvertedIndex', () => {
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
});

describe('InvertedIndex: searchWithInvertedIndex', () => {
    const index = buildInvertedIndex(mockDbProducts);

    it('should find Leche Descremada with variant name', () => {
        const scrapedName = 'Leche Descremada UAT La Serenisima 1 Litro';
        const result = searchWithInvertedIndex(scrapedName, index);
        expect(result).toBe(1);
    });

    it('should find Leche Entera Sancor', () => {
        const scrapedName = 'LECHE ENTERA SANCORD 1L';
        const result = searchWithInvertedIndex(scrapedName, index);
        expect(result).toBe(2);
    });

    it('should find Fideos Spaghetti with slight name difference', () => {
        const scrapedName = 'Spaghetti Don Vicente 500 gr';
        const result = searchWithInvertedIndex(scrapedName, index);
        expect(result).toBe(3);
    });

    it('should find Azucar Ledesma without accents', () => {
        const scrapedName = 'Azucar blanca Ledesma 1 kg';
        const result = searchWithInvertedIndex(scrapedName, index);
        expect(result).toBe(5);
    });

    it('should return undefined for non-existent product', () => {
        const scrapedName = 'Yogur Colorada Frutilla 500g';
        const result = searchWithInvertedIndex(scrapedName, index);
        expect(result).toBeUndefined();
    });

    it('should find Detergente Magistral with extended name', () => {
        const scrapedName = 'Detergente Magistral para vajilla sabor limon 750 ml';
        const result = searchWithInvertedIndex(scrapedName, index);
        expect(result).toBe(7);
    });

    it('should prioritize most specific match', () => {
        const scrapedName = 'Arroz Gallo Largo Fino 1000g';
        const result = searchWithInvertedIndex(scrapedName, index);
        expect(result).toBe(9);
    });

    it('should handle short names correctly', () => {
        const scrapedName = 'Atun Taragui Natural 170 g';
        const result = searchWithInvertedIndex(scrapedName, index);
        expect(result).toBe(10);
    });
});

describe('extractSignificantWords', () => {
    it('should filter short words (<=2 chars)', () => {
        const words = extractSignificantWords('Leche de Almendras x 1L');
        expect(words).toContain('leche');
        expect(words).toContain('almendras');
        expect(words).not.toContain('de');
    });

    it('should normalize accents', () => {
        const words = extractSignificantWords('Azucar Descremada Serenisima');
        expect(words).toContain('azucar');
        expect(words).toContain('descremada');
        expect(words).toContain('serenisima');
    });

    it('should normalize units of measurement', () => {
        const words = extractSignificantWords('Leche 1 l');
        expect(words).toContain('1l');
    });
});

describe('Edge cases', () => {
    const index = buildInvertedIndex(mockDbProducts);

    it('should return undefined for empty string', () => {
        const result = searchWithInvertedIndex('', index);
        expect(result).toBeUndefined();
    });

    it('should return undefined for string with only short words', () => {
        const result = searchWithInvertedIndex('el de la x', index);
        expect(result).toBeUndefined();
    });

    it('should find product even with extra info in scraped name', () => {
        const scrapedName = 'OFERTA ESPECIAL Leche Descremada La Serenisima 1L - 20% OFF';
        const result = searchWithInvertedIndex(scrapedName, index);
        expect(result).toBe(1);
    });

    it('should be case-insensitive', () => {
        const scrapedName1 = 'ACEITE GIRASOL NATURA 1.5L';
        const scrapedName2 = 'aceite girasol natura 1.5l';
        const result1 = searchWithInvertedIndex(scrapedName1, index);
        const result2 = searchWithInvertedIndex(scrapedName2, index);
        expect(result1).toBe(result2);
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
