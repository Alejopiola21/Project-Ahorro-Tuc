import { PrismaClient } from '@prisma/client';

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
    // Ej: "leche", "descremada", "serenisima", "1l" están dento de "leche uat serenisima descremada 1l sachet"
    return dbWords.every(word => scrapedClean.includes(word));
}

export async function syncSupermarketData(
    prisma: PrismaClient,
    supermarketId: string,
    scrapedProducts: ScrapedProduct[]
) {
    console.log(`\n[Sync] 🚀 Procesando sincronización para [${supermarketId.toUpperCase()}]`);
    console.log(`[Sync] Productos recolectados: ${scrapedProducts.length}`);
    
    // Optimizacion: precargar todos los productos una sola vez para la búsqueda fuzzy en memoria
    const allDbProducts = await prisma.product.findMany({ select: { id: true, name: true }});
    
    let matchedCount = 0;
    let ignoredCount = 0;

    for (const scraped of scrapedProducts) {
        let dbProductId: number | null = null;

        // 1. Matcheo exacto por EAN (Código de barras) (La forma más segura)
        if (scraped.ean) {
            const byEan = await prisma.product.findUnique({
                where: { ean: scraped.ean },
                select: { id: true }
            });
            if (byEan) dbProductId = byEan.id;
        }

        // 2. Revisar la tabla de Alias (Nombres mapeados manualmente por el usuario o aprendidos)
        if (!dbProductId) {
            const alias = await prisma.productAlias.findUnique({
                where: { 
                    supermarketId_originalName: { 
                        supermarketId, 
                        originalName: scraped.name 
                    } 
                },
                select: { productId: true }
            });
            if (alias) dbProductId = alias.productId;
        }

        // 3. Fallback: Búsqueda Insensible (Fuzzy Avanzado) por Palabras Clave
        if (!dbProductId) {
            for (const dbP of allDbProducts) {
                if (fuzzyMatch(dbP.name, scraped.name)) {
                    dbProductId = dbP.id;
                    break;
                }
            }
        }

        // Si después de 3 intentos no hallamos el producto, lo ignoramos para no ensuciar el catálogo
        if (!dbProductId) {
            ignoredCount++;
            continue;
        }

        // >>> Producto Encontrado - ¡Actualizamos los precios! <<<
        
        // Upsert en la tabla 'Price' (Precio actual)
        await prisma.price.upsert({
            where: {
                productId_supermarketId: {
                    productId: dbProductId,
                    supermarketId: supermarketId
                }
            },
            update: {
                price: scraped.price,
                updatedAt: new Date()
            },
            create: {
                productId: dbProductId,
                supermarketId: supermarketId,
                price: scraped.price
            }
        });

        // Insertar en el historial de precios para las gráficas
        await prisma.priceHistory.create({
            data: {
                productId: dbProductId,
                supermarketId: supermarketId,
                price: scraped.price,
                sourceUrl: scraped.sourceUrl,
                date: new Date()
            }
        });

        matchedCount++;
    }

    console.log(`[Sync:${supermarketId}] ✔ Sincronización finalizada.`);
    console.log(`[Sync:${supermarketId}] 🔹 Actualizados / Matcheados: ${matchedCount}`);
    console.log(`[Sync:${supermarketId}] 🔸 Ignorados (No en catálogo): ${ignoredCount}`);
}
