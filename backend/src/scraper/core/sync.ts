import { ScraperRepository, ScraperPriceUpdate } from '../../repositories/ScraperRepository';

export interface ScrapedProduct {
    name: string;
    price: number;
    sourceUrl?: string;
    ean?: string;
    brand?: string;
    weight?: string;
    category?: string;
    imageUrl?: string;
}

// Helper de sanitización
function sanitizeString(str: string): string {
    let result = str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/[^a-z0-9\s]/g, '') // Quitar puntuación
        // Normalizar variantes de unidades: "500 gr" -> "500g", "750 ml" -> "750ml"
        .replace(/\b(\d+)\s*(gr|g)\b/g, '$1g')
        .replace(/\b(\d+)\s*ml\b/g, '$1ml')
        .replace(/\b(\d+)\s*l\b/g, '$1l') // "1 l" -> "1l" (después de ml para no pisarlo)
        .replace(/\b(\d+)\s*(kg)\b/g, '$1kg');
    
    // Convertir 1000g a 1kg, 500ml a 0.5l (normalización adicional)
    result = result.replace(/\b(\d{4,})g\b/g, (match, num) => {
        const kg = parseInt(num) / 1000;
        return kg % 1 === 0 ? `${kg}kg` : `${kg.toFixed(1).replace('.0', '')}kg`;
    });
    
    return result;
}

/**
 * Extrae palabras significativas de un string (longitud > 2)
 */
function extractSignificantWords(str: string): string[] {
    return sanitizeString(str).split(/\s+/).filter(w => w.length > 2);
}

/**
 * Índice invertido: mapea cada palabra significativa → set de productIds
 * Construcción: O(N_db × W) donde W = palabras por producto
 * Lookup: O(1) por palabra en lugar de O(N_db) linear scan
 */
interface InvertedIndex {
    wordToProducts: Map<string, Set<number>>;
    productNameCache: Map<number, string>; // Para fuzzy verification posterior
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

/**
 * Busca candidatos usando el índice invertido + verificación fuzzy
 * 
 * Algoritmo Optimizado:
 * 1. Extraer palabras significativas del scraped name
 * 2. Para cada palabra scraped, buscar en el índice invertido los productos DB que la tienen
 * 3. Contar coincidencias por producto (voting/scoring)
 * 4. Ordenar por score y verificar fuzzy match solo en top candidatos
 * 
 * Complejidad: O(W_scraped × avg_products_per_word) 
 * Típicamente mucho menor que O(N_db) porque:
 *   - W_scraped << N_db (3-5 palabras vs miles de productos)
 *   - avg_products_per_word << N_db (pocos productos comparten misma palabra)
 */
function searchWithInvertedIndex(
    scrapedName: string,
    index: InvertedIndex
): number | undefined {
    const scrapedClean = sanitizeString(scrapedName);
    const scrapedWords = extractSignificantWords(scrapedName);
    
    if (scrapedWords.length === 0) return undefined;

    // Para cada palabra del scraped name, votar por productos del DB que la contienen
    const productScores = new Map<number, number>();

    for (const scrapedWord of scrapedWords) {
        // Búsqueda directa en el índice: ¿qué productos tienen esta palabra exacta?
        const matchingProductIds = index.wordToProducts.get(scrapedWord);
        if (matchingProductIds) {
            for (const productId of matchingProductIds) {
                productScores.set(productId, (productScores.get(productId) || 0) + 1);
            }
        }
    }

    if (productScores.size === 0) return undefined;

    // Ordenar candidatos por score descendente
    const sortedCandidates = Array.from(productScores.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([productId]) => productId);

    // Verificar fuzzy match solo en los mejores candidatos
    // Esto evita falsos positivos del índice (parcial matches)
    for (const candidateId of sortedCandidates) {
        const dbName = index.productNameCache.get(candidateId);
        if (!dbName) continue;

        if (fuzzyMatch(dbName, scrapedName)) {
            return candidateId;
        }
    }

    return undefined;
}

function fuzzyMatch(dbName: string, scrapedName: string): boolean {
    const dbClean = sanitizeString(dbName);
    const scrapedClean = sanitizeString(scrapedName);

    // Extraer palabras significativas (mayor a 2 letras, ignorando 'de', 'el')
    const dbWords = dbClean.split(/\s+/).filter(w => w.length > 2);

    // Si la cadena de la web incluye TODAS las palabras fuertes del dbName, lo damos por válido
    return dbWords.every(word => scrapedClean.includes(word));
}

export async function syncSupermarketData(
    _deprecated: undefined,
    supermarketId: string,
    scrapedProducts: ScrapedProduct[]
) {
    console.log(`\n[Sync] 🚀 Procesando sincronización para [${supermarketId.toUpperCase()}]`);
    console.log(`[Sync] Productos recolectados: ${scrapedProducts.length}`);

    // Cargar diccionarios O(1) en memoria (Reemplaza cientos de queries `findUnique` contra la DB de Neon)
    console.log(`[Sync] Cacheando catálogo completo en memoria...`);

    const dbProducts = await ScraperRepository.getAllProductsForMatching();
    const dbAliases = await ScraperRepository.getAllAliases(supermarketId);

    // Mapear EAN y Alias para búsqueda O(1)
    const eanMap = new Map<string, number>();
    for (const p of dbProducts) {
        if (p.ean) eanMap.set(p.ean, p.id);
    }

    const aliasMap = new Map<string, number>();
    for (const a of dbAliases) {
        aliasMap.set(a.originalName, a.productId);
    }

    // Construir índice invertido para fuzzy matching optimizado
    // Esto reemplaza el loop lineal O(N_db) por búsqueda O(1) por palabra
    const invertedIndex = buildInvertedIndex(dbProducts);
    console.log(`[Sync] Índice invertido construido: ${invertedIndex.wordToProducts.size} palabras únicas indexadas`);

    let ignoredCount = 0;
    const batchUpdates: ScraperPriceUpdate[] = [];

    console.log(`[Sync] Matcheando con EAN O(1), Alias O(1) e Índice Invertido O(W)...`);

    for (const scraped of scrapedProducts) {
        let dbProductId: number | undefined = undefined;

        // 1. O(1) - EAN Exact Match
        if (scraped.ean) {
            dbProductId = eanMap.get(scraped.ean);
        }

        // 2. O(1) - Alias Match
        if (!dbProductId) {
            dbProductId = aliasMap.get(scraped.name);
        }

        // 3. O(W) - Fuzzy Matching con Índice Invertido (reemplaza O(N_db) linear scan)
        if (!dbProductId) {
            dbProductId = searchWithInvertedIndex(scraped.name, invertedIndex);
        }

        // Ignorados
        if (!dbProductId) {
            ignoredCount++;
            continue;
        }

        // Producto match exitoso: Apuntar para batch transaction. Evitamos N queries upsert!
        batchUpdates.push({
            productId: dbProductId,
            price: scraped.price,
            sourceUrl: scraped.sourceUrl
        });
    }

    // Guardar en la base de datos de manera atómica transaccional y masiva (Latencia 100x menor)
    await ScraperRepository.batchUpdatePrices(supermarketId, batchUpdates);

    console.log(`[Sync:${supermarketId}] ✔ Sincronización finalizada.`);
    console.log(`[Sync:${supermarketId}] 🔹 Matcheados / Actualizados: ${batchUpdates.length}`);
    console.log(`[Sync:${supermarketId}] 🔸 Ignorados (No en catálogo): ${ignoredCount}`);
}
