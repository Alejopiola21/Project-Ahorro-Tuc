import { prisma } from './client';

const SUPERMARKETS = [
    { id: 'coto', name: 'Coto', color: '#e63946', logo: 'C' },
    { id: 'carrefour', name: 'Carrefour', color: '#1d3557', logo: 'Ca' },
    { id: 'jumbo', name: 'Jumbo', color: '#2a9d8f', logo: 'J' },
    { id: 'vea', name: 'Vea', color: '#e76f51', logo: 'V' },
    { id: 'disco', name: 'Disco', color: '#f4a261', logo: 'Di' },
    { id: 'dia', name: 'Día', color: '#d90429', logo: '%' },
    { id: 'gomez_pardo', name: 'Gómez Pardo', color: '#ff6b6b', logo: 'GP' },
    { id: 'changomas', name: 'ChangoMás', color: '#0047AB', logo: 'CM' },
    { id: 'libertad', name: 'Libertad', color: '#ffcc00', logo: 'L' },
    { id: 'comodin', name: 'Comodín', color: '#32cd32', logo: 'Co' },
];

const PRODUCTS = [
    {
        name: 'Leche Descremada La Serenísima 1L',
        category: 'Lácteos',
        imageUrl: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1100, carrefour: 1050, jumbo: 1200, vea: 1150, disco: 1150, dia: 990, gomez_pardo: 1010, changomas: 1020, libertad: 1180, comodin: 1000 },
    },
    {
        name: 'Yerba Mate Playadito 1Kg',
        category: 'Almacén',
        imageUrl: 'https://images.unsplash.com/photo-1594910243171-4171887e1f13?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 3400, carrefour: 3600, jumbo: 3750, vea: 3500, disco: 3500, dia: 3200, gomez_pardo: 3100, changomas: 3150, libertad: 3600, comodin: 3250 },
    },
    {
        name: 'Papel Higiénico Higienol 4u',
        category: 'Limpieza',
        imageUrl: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 2800, carrefour: 2750, jumbo: 2900, vea: 2850, disco: 2850, dia: 2600, gomez_pardo: 2550, changomas: 2650, libertad: 2950, comodin: 2600 },
    },
    {
        name: 'Café Dolca Suave Premium 170g',
        category: 'Almacén',
        imageUrl: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 4600, carrefour: 4800, jumbo: 5100, vea: 4700, disco: 4700, dia: 4500, gomez_pardo: 4400, changomas: 4450, libertad: 5000, comodin: 4600 },
    },
    {
        name: 'Aceite de Girasol Natura 1.5L',
        category: 'Almacén',
        imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 2950, carrefour: 3100, jumbo: 3250, vea: 3000, disco: 3000, dia: 2800, gomez_pardo: 2750, changomas: 2850, libertad: 3200, comodin: 2800 },
    },
    {
        name: 'Azúcar Ledesma 1Kg',
        category: 'Almacén',
        imageUrl: 'https://images.unsplash.com/photo-1550411294-2f6b4fe5a1e8?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1400, carrefour: 1350, jumbo: 1500, vea: 1420, disco: 1420, dia: 1280, gomez_pardo: 1250, changomas: 1300, libertad: 1450, comodin: 1250 },
    },
    {
        name: 'Fideos Matarazzo Spaghetti 500g',
        category: 'Almacén',
        imageUrl: 'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 850, carrefour: 820, jumbo: 950, vea: 880, disco: 880, dia: 790, gomez_pardo: 750, changomas: 800, libertad: 900, comodin: 780 },
    },
    {
        name: 'Detergente Magistral 750ml',
        category: 'Limpieza',
        imageUrl: 'https://images.unsplash.com/photo-1585237017125-24baf8d7406f?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1650, carrefour: 1600, jumbo: 1750, vea: 1680, disco: 1680, dia: 1520, gomez_pardo: 1500, changomas: 1550, libertad: 1700, comodin: 1550 },
    },
    {
        name: 'Pan Lactal Bimbo Blanco 450g',
        category: 'Panadería',
        imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1200, carrefour: 1180, jumbo: 1300, vea: 1220, disco: 1220, dia: 1100, gomez_pardo: 1050, changomas: 1100, libertad: 1250, comodin: 1080 },
    },
    {
        name: 'Arroz SOS Largo Fino 1Kg',
        category: 'Almacén',
        imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1100, carrefour: 1050, jumbo: 1200, vea: 1120, disco: 1120, dia: 980, gomez_pardo: 950, changomas: 1000, libertad: 1150, comodin: 990 },
    },
];

export async function seedDatabase() {
    // Verificar si ya hay datos
    const supCount = await prisma.supermarket.count();
    if (supCount > 0) {
        console.log('[DB] ⏩ Seed already applied — skipping');
        return;
    }

    console.log('[DB] 🌱 Seeding database...');

    // Insertar supermercados con upsert (idempotente)
    for (const s of SUPERMARKETS) {
        await prisma.supermarket.upsert({
            where: { id: s.id },
            update: {},
            create: s,
        });
    }

    // Insertar productos y sus precios
    for (const p of PRODUCTS) {
        const product = await prisma.product.create({
            data: {
                name: p.name,
                category: p.category,
                imageUrl: p.imageUrl,
            },
        });

        // Crear precios actuales e historial en lote
        const priceData = Object.entries(p.prices).map(([supId, price]) => ({
            productId: product.id,
            supermarketId: supId,
            price,
        }));

        await prisma.price.createMany({ data: priceData });

        const historyData = Object.entries(p.prices).map(([supId, price]) => ({
            productId: product.id,
            supermarketId: supId,
            price,
        }));

        await prisma.priceHistory.createMany({ data: historyData });
    }

    console.log(`[DB] 🌱 Seeded ${PRODUCTS.length} products across ${SUPERMARKETS.length} supermarkets`);
}

// Ejecutar la función si es el script principal
if (require.main === module) {
    seedDatabase()
        .catch((e) => {
            console.error(e);
            process.exit(1);
        })
        .finally(async () => {
            await prisma.$disconnect();
        });
}
