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
    return str.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Quitar tildes
        .replace(/[^a-z0-9\s]/g, '') // Quitar puntuación
        .replace(/\b1 l\b/g, '1l')
        .replace(/\b1 kg\b/g, '1kg');
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
    
    let ignoredCount = 0;
    const batchUpdates: ScraperPriceUpdate[] = [];

    console.log(`[Sync] Matcheando de forma rápida O(1) y Fuzzy O(N)...`);

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

        // 3. O(N) - Fuzzy Matching O(N * M) Array Loop
        if (!dbProductId) {
            for (const dbP of dbProducts) {
                if (fuzzyMatch(dbP.name, scraped.name)) {
                    dbProductId = dbP.id;
                    break;
                }
            }
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
