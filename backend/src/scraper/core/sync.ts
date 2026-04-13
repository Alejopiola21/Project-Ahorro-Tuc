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
    let createdCount = 0;
    const batchUpdates: ScraperPriceUpdate[] = [];
    const newProducts: Array<{ scraped: ScrapedProduct; inferredCategory: string }> = [];

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

        // 4. NUEVO: Si no se encontró match, crear producto nuevo
        if (!dbProductId) {
            // Intentar inferir categoría del nombre o usar 'Otros'
            const inferredCategory = inferCategory(scraped);

            newProducts.push({ scraped, inferredCategory });
            ignoredCount++; // Lo contamos como "ignorado" del matching existente
            continue;
        }

        // Producto match exitoso: Apuntar para batch transaction. Evitamos N queries upsert!
        const product = dbProducts.find(p => p.id === dbProductId);
        const unitPrice = (product && product.unitValue && product.unitValue > 0)
            ? parseFloat((scraped.price / product.unitValue).toFixed(2))
            : null;

        batchUpdates.push({
            productId: dbProductId,
            price: scraped.price,
            unitPrice,
            sourceUrl: scraped.sourceUrl
        });
    }

    // Guardar precios existentes en la base de datos de manera atómica transaccional y masiva
    await ScraperRepository.batchUpdatePrices(supermarketId, batchUpdates);

    // CREAR productos nuevos que no existían en la DB
    if (newProducts.length > 0) {
        console.log(`\n[Sync] 🆕 Creando ${newProducts.length} productos nuevos en la base de datos...`);

        for (const { scraped, inferredCategory } of newProducts) {
            // Calcular unitValue si hay peso/volumen en el nombre
            const unitInfo = extractUnitInfo(scraped.name);

            const createdProduct = await ScraperRepository.createProduct({
                name: scraped.name,
                category: inferredCategory,
                imageUrl: scraped.imageUrl || null,
                brand: scraped.brand || null,
                ean: scraped.ean || null,
                weight: unitInfo.weight,
                unitValue: unitInfo.unitValue,
                unitType: unitInfo.unitType,
            });

            // Ahora agregar el precio para este supermercado
            const unitPrice = unitInfo.unitValue && unitInfo.unitValue > 0
                ? parseFloat((scraped.price / unitInfo.unitValue).toFixed(2))
                : null;

            await ScraperRepository.createPrice({
                productId: createdProduct.id,
                supermarketId,
                price: scraped.price,
                unitPrice,
                sourceUrl: scraped.sourceUrl,
            });

            createdCount++;

            // Agregar al índice en memoria para que próximos scrapers en la misma corrida puedan matchear
            dbProducts.push({
                id: createdProduct.id,
                name: createdProduct.name,
                ean: createdProduct.ean,
                unitValue: createdProduct.unitValue,
                unitType: createdProduct.unitType,
                category: createdProduct.category,
                brand: createdProduct.brand,
            });
            if (createdProduct.ean) {
                eanMap.set(createdProduct.ean, createdProduct.id);
            }
        }

        console.log(`[Sync] ✅ ${createdCount} productos nuevos creados exitosamente`);
    }

    console.log(`\n[Sync:${supermarketId}] ✔ Sincronización finalizada.`);
    console.log(`[Sync:${supermarketId}] 🔹 Matcheados / Actualizados: ${batchUpdates.length}`);
    console.log(`[Sync:${supermarketId}] 🆕 Productos nuevos creados: ${createdCount}`);
    console.log(`[Sync:${supermarketId}] 🔸 Ignorados (Sin match posible): ${ignoredCount - createdCount}`);
}

/**
 * Intenta inferir la categoría de un producto basado en su nombre
 */
function inferCategory(scraped: ScrapedProduct): string {
    const name = scraped.name.toLowerCase();

    // Mapeo de palabras clave a categorías
    const categoryKeywords: Array<[string, string]> = [
        ['leche', 'Lácteos'],
        ['yogur', 'Lácteos'],
        ['queso', 'Lácteos'],
        ['manteca', 'Lácteos'],
        ['dulce de leche', 'Lácteos'],
        ['fideo', 'Almacén'],
        ['arroz', 'Almacén'],
        ['aceite', 'Almacén'],
        ['azucar', 'Almacén'],
        ['harina', 'Almacén'],
        ['yerba', 'Almacén'],
        ['cafe', 'Almacén'],
        ['galletita', 'Almacén'],
        ['atun', 'Almacén'],
        ['salsa', 'Almacén'],
        ['detergente', 'Limpieza'],
        ['lavandina', 'Limpieza'],
        ['papel higienico', 'Limpieza'],
        ['jabon', 'Limpieza'],
        ['suavizante', 'Limpieza'],
        ['coca cola', 'Bebidas'],
        ['cerveza', 'Bebidas'],
        ['jugo', 'Bebidas'],
        ['vino', 'Bebidas'],
        ['gaseosa', 'Bebidas'],
        ['agua mineral', 'Bebidas'],
        ['pollo', 'Carnes'],
        ['carne', 'Carnes'],
        ['milanesa', 'Carnes'],
        ['pan lactal', 'Panadería'],
        ['factura', 'Panadería'],
        ['pan dulce', 'Panadería'],
        ['alimento perro', 'Mascotas'],
        ['alimento gato', 'Mascotas'],
        ['shampoo', 'Perfumería'],
        ['desodorante', 'Perfumería'],
        ['crema dental', 'Perfumería'],
        ['papa', 'Verdulería'],
        ['tomate', 'Verdulería'],
        ['cebolla', 'Verdulería'],
        ['banana', 'Verdulería'],
        ['limon', 'Verdulería'],
        ['empanada', 'Congelados'],
        ['hamburguesa', 'Congelados'],
        ['pizza', 'Congelados'],
    ];

    for (const [keyword, category] of categoryKeywords) {
        if (name.includes(keyword)) {
            return category;
        }
    }

    return 'Otros';
}

/**
 * Extrae información de peso/volumen del nombre del producto
 */
function extractUnitInfo(name: string): { weight: string | null; unitValue: number | null; unitType: string | null } {
    const cleanName = name.toLowerCase();

    // Patrones de peso/volumen: "500g", "1kg", "500ml", "1l", "1.5l"
    const weightPatterns = [
        { regex: /(\d+\.?\d*)\s*(ml)/i, unitType: 'ml' },
        { regex: /(\d+\.?\d*)\s*(l)(?![tr])/, unitType: 'l' }, // "l" pero no si es parte de "ltr"
        { regex: /(\d+\.?\d*)\s*(kg)/i, unitType: 'kg' },
        { regex: /(\d+\.?\d*)\s*(g)(?![r])/i, unitType: 'g' }, // "g" pero no si es "gr"
        { regex: /(\d+\.?\d*)\s*unidades?/i, unitType: 'u' },
        { regex: /(\d+)\s*x\s*(\d+)\s*(unidades?|u)/i, unitType: 'u' }, // "6 x 100un"
    ];

    for (const pattern of weightPatterns) {
        const match = cleanName.match(pattern.regex);
        if (match) {
            let value = parseFloat(match[1]);

            // Convertir a unidad base
            if (pattern.unitType === 'kg') {
                return { weight: `${value}kg`, unitValue: value, unitType: 'kg' };
            } else if (pattern.unitType === 'l') {
                return { weight: `${value}l`, unitValue: value, unitType: 'l' };
            } else if (pattern.unitType === 'ml') {
                const liters = value / 1000;
                return { weight: `${value}ml`, unitValue: liters, unitType: 'l' };
            } else if (pattern.unitType === 'g') {
                const kg = value / 1000;
                return { weight: `${value}g`, unitValue: kg, unitType: 'kg' };
            } else if (pattern.unitType === 'u') {
                return { weight: null, unitValue: value, unitType: 'u' };
            }
        }
    }

    return { weight: null, unitValue: null, unitType: null };
}
