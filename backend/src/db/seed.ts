import db from './connection';

const SUPERMARKETS = [
    { id: 'coto', name: 'Coto', color: '#e63946', logo: 'C' },
    { id: 'carrefour', name: 'Carrefour', color: '#1d3557', logo: 'Ca' },
    { id: 'jumbo', name: 'Jumbo', color: '#2a9d8f', logo: 'J' },
    { id: 'vea', name: 'Vea', color: '#e76f51', logo: 'V' },
    { id: 'disco', name: 'Disco', color: '#f4a261', logo: 'Di' },
    { id: 'dia', name: 'Día', color: '#d90429', logo: '%' },
];

const PRODUCTS = [
    {
        name: 'Leche Descremada La Serenísima 1L',
        category: 'Lácteos',
        image_url: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1100, carrefour: 1050, jumbo: 1200, vea: 1150, disco: 1150, dia: 990 },
    },
    {
        name: 'Yerba Mate Playadito 1Kg',
        category: 'Almacén',
        image_url: 'https://images.unsplash.com/photo-1594910243171-4171887e1f13?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 3400, carrefour: 3600, jumbo: 3750, vea: 3500, disco: 3500, dia: 3200 },
    },
    {
        name: 'Papel Higiénico Higienol 4u',
        category: 'Limpieza',
        image_url: 'https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 2800, carrefour: 2750, jumbo: 2900, vea: 2850, disco: 2850, dia: 2600 },
    },
    {
        name: 'Café Dolca Suave Premium 170g',
        category: 'Almacén',
        image_url: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 4600, carrefour: 4800, jumbo: 5100, vea: 4700, disco: 4700, dia: 4500 },
    },
    {
        name: 'Aceite de Girasol Natura 1.5L',
        category: 'Almacén',
        image_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 2950, carrefour: 3100, jumbo: 3250, vea: 3000, disco: 3000, dia: 2800 },
    },
    {
        name: 'Azúcar Ledesma 1Kg',
        category: 'Almacén',
        image_url: 'https://images.unsplash.com/photo-1550411294-2f6b4fe5a1e8?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1400, carrefour: 1350, jumbo: 1500, vea: 1420, disco: 1420, dia: 1280 },
    },
    {
        name: 'Fideos Matarazzo Spaghetti 500g',
        category: 'Almacén',
        image_url: 'https://images.unsplash.com/photo-1551462147-37885acc36f1?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 850, carrefour: 820, jumbo: 950, vea: 880, disco: 880, dia: 790 },
    },
    {
        name: 'Detergente Magistral 750ml',
        category: 'Limpieza',
        image_url: 'https://images.unsplash.com/photo-1585237017125-24baf8d7406f?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1650, carrefour: 1600, jumbo: 1750, vea: 1680, disco: 1680, dia: 1520 },
    },
    {
        name: 'Pan Lactal Bimbo Blanco 450g',
        category: 'Panadería',
        image_url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1200, carrefour: 1180, jumbo: 1300, vea: 1220, disco: 1220, dia: 1100 },
    },
    {
        name: 'Arroz SOS Largo Fino 1Kg',
        category: 'Almacén',
        image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400',
        prices: { coto: 1100, carrefour: 1050, jumbo: 1200, vea: 1120, disco: 1120, dia: 980 },
    },
];

export function seedDatabase() {
    // Only seed if DB is empty
    const supCount = db.prepare('SELECT COUNT(*) as n FROM supermarkets').get() as { n: number };
    if (supCount.n > 0) {
        console.log('[DB] ⏩ Seed already applied — skipping');
        return;
    }

    const insertSup = db.prepare(
        'INSERT OR IGNORE INTO supermarkets (id, name, color, logo) VALUES (?, ?, ?, ?)'
    );

    const insertProduct = db.prepare(
        'INSERT OR IGNORE INTO products (name, category, image_url) VALUES (?, ?, ?)'
    );

    const insertPrice = db.prepare(`
    INSERT OR REPLACE INTO prices (product_id, supermarket_id, price, updated_at)
    VALUES (?, ?, ?, datetime('now'))
  `);

    const insertHistory = db.prepare(`
    INSERT INTO price_history (product_id, supermarket_id, price)
    VALUES (?, ?, ?)
  `);

    // Run everything as a single atomic transaction
    const seedAll = db.transaction(() => {
        // Insert supermarkets
        for (const s of SUPERMARKETS) {
            insertSup.run(s.id, s.name, s.color, s.logo);
        }

        // Insert products and prices
        for (const p of PRODUCTS) {
            const result = insertProduct.run(p.name, p.category, p.image_url);
            const productId = result.lastInsertRowid;

            for (const [supId, price] of Object.entries(p.prices)) {
                insertPrice.run(productId, supId, price);
                insertHistory.run(productId, supId, price);
            }
        }
    });

    seedAll();
    console.log(`[DB] 🌱 Seeded ${PRODUCTS.length} products across ${SUPERMARKETS.length} supermarkets`);
}
