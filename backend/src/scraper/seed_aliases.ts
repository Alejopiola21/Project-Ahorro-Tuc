import 'dotenv/config';
import { prisma } from '../db/client';

async function seedAliases() {
    console.log('--- 🌱 Forzando Mapeo de Aliases de Frontend ---');
    try {
        // En un caso real, esto se manejaría desde un panel de admin.
        // Simularemos algunos cruces que sabemos que fallarán con el Fuzzy (ej por abreviaciones).

        // Ejemplo: Buscar la leche en DB local
        const lecheDb = await prisma.product.findFirst({
            where: { name: { contains: 'Leche Descremada La Serenísima' } }
        });

        if (lecheDb) {
            // Mapeamos a Vea/Jumbo/Disco
            await prisma.productAlias.upsert({
                where: { supermarketId_originalName: { supermarketId: 'vea', originalName: 'Leche Uat La Serenisima Descremada 1 L' } },
                update: {},
                create: { supermarketId: 'vea', originalName: 'Leche Uat La Serenisima Descremada 1 L', productId: lecheDb.id }
            });
            await prisma.productAlias.upsert({
                where: { supermarketId_originalName: { supermarketId: 'jumbo', originalName: 'Leche Uat La Serenisima Descremada 1 L' } },
                update: {},
                create: { supermarketId: 'jumbo', originalName: 'Leche Uat La Serenisima Descremada 1 L', productId: lecheDb.id }
            });
        }

        // Fideos
        const fideosDb = await prisma.product.findFirst({
            where: { name: { contains: 'Fideos Matarazzo' } }
        });

        if (fideosDb) {
            await prisma.productAlias.upsert({
                where: { supermarketId_originalName: { supermarketId: 'vea', originalName: 'Fideos Matarazzo Spaghetti 500 G' } },
                update: {},
                create: { supermarketId: 'vea', originalName: 'Fideos Matarazzo Spaghetti 500 G', productId: fideosDb.id }
            });
        }

        console.log('✅ Aliases de prueba inyectados correctamente.');
    } catch (e) {
        console.error('❌ Error sembrando aliases:', e);
    } finally {
        await prisma.$disconnect();
    }
}

if (require.main === module) {
    seedAliases();
}
