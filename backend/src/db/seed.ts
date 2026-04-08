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
    // Lácteos
    { name: 'Leche Descremada La Serenísima 1L', category: 'Lácteos', brand: 'La Serenísima', ean: '7790742302801', prices: { coto: 1100, carrefour: 1050, disco: 1150 } },
    { name: 'Leche Entera Ilolay 1L', category: 'Lácteos', brand: 'Ilolay', ean: '7790320150315', prices: { gomez_pardo: 980, changomas: 950, libertad: 1000 } },
    { name: 'Leche Chocolatada Sancor 1L', category: 'Lácteos', brand: 'SanCor', ean: '7790080045610', prices: { vea: 1400, jumbo: 1450, carrefour: 1380 } },

    // Almacén - Fideos
    { name: 'Fideos Matarazzo Mostachol 500g', category: 'Almacén', brand: 'Matarazzo', ean: '7790070415309', prices: { dia: 750, coto: 820, comodin: 790 } },
    { name: 'Fideos Lucchetti Tallarin 500g', category: 'Almacén', brand: 'Lucchetti', ean: '7790070507301', prices: { carrefour: 800, libertad: 850, changomas: 780 } },
    { name: 'Fideos Knorr Tirabuzon 500g', category: 'Almacén', brand: 'Knorr', ean: '7790070507355', prices: { gomez_pardo: 820, disco: 890, coto: 860 } },

    // Almacén - Azúcar
    { name: 'Azúcar Ledesma Claásica 1Kg', category: 'Almacén', brand: 'Ledesma', ean: '7790080040608', prices: { coto: 1350, dia: 1250, changomas: 1280 } },
    { name: 'Azúcar Chango Premium 1Kg', category: 'Almacén', brand: 'Chango', ean: '7790080040653', prices: { carrefour: 1450, jumbo: 1550, libertad: 1400 } },
    { name: 'Azúcar Fronterita 1Kg', category: 'Almacén', brand: 'Fronterita', ean: '7790080040700', prices: { gomez_pardo: 1100, comodin: 1150, vea: 1200 } },

    // Limpieza
    { name: 'Papel Higiénico Higienol Max 4u', category: 'Limpieza', brand: 'Higienol', ean: '7790130000450', prices: { jumbo: 2900, carrefour: 2750, disco: 2850 } },
    { name: 'Papel Higiénico Elite Doble Hoja 4u', category: 'Limpieza', brand: 'Elite', ean: '7790130000460', prices: { coto: 3100, changomas: 2900, libertad: 3200 } },
    { name: 'Papel Higiénico Sussex 4u', category: 'Limpieza', brand: 'Sussex', ean: '7790130000470', prices: { dia: 2200, gomez_pardo: 2150, comodin: 2300 } },

    // Bebidas
    { name: 'Coca Cola Sabor Original 2.25L', category: 'Bebidas', brand: 'Coca Cola', ean: '7790895000994', prices: { coto: 1800, changomas: 1750, gomez_pardo: 1700 } },
    { name: 'Coca Cola Sin Azúcar 2.25L', category: 'Bebidas', brand: 'Coca Cola', ean: '7790895001004', prices: { carrefour: 1850, dia: 1780, libertad: 1950 } },
    { name: 'Cerveza Quilmes Clásica Lata 473ml', category: 'Bebidas', brand: 'Quilmes', ean: '7792798007421', prices: { comodin: 820, changomas: 850, jumbo: 980 } },
    { name: 'Cerveza Stella Artois Lata 473ml', category: 'Bebidas', brand: 'Stella Artois', ean: '7792798007455', prices: { disco: 1100, coto: 1050, carrefour: 1000 } },
    { name: 'Cerveza Brahma Lata 473ml', category: 'Bebidas', brand: 'Brahma', ean: '7792798007466', prices: { dia: 750, gomez_pardo: 720, vea: 780 } },

    // Mascotas
    { name: 'Alimento Perro Pedigree Adulto 3Kg', category: 'Mascotas', brand: 'Pedigree', ean: '7790895008035', prices: { coto: 8400, jumbo: 9500, carrefour: 8900 } },
    { name: 'Alimento Perro Dogui Carne 3Kg', category: 'Mascotas', brand: 'Dogui', ean: '7790895008060', prices: { changomas: 7500, comodin: 7200, dia: 7600 } },
    { name: 'Alimento Perro Raza Adulto Carne 3Kg', category: 'Mascotas', brand: 'Raza', ean: '7790895008099', prices: { gomez_pardo: 6800, libertad: 7200, vea: 7100 } },

    // Congelados
    { name: 'Hamburguesas Swift Clásicas 4u', category: 'Congelados', brand: 'Swift', ean: '7790250000210', prices: { carrefour: 2900, coto: 2800, jumbo: 3100 } },
    { name: 'Hamburguesas Paty Clásicas 4u', category: 'Congelados', brand: 'Paty', ean: '7790250000350', prices: { changomas: 3200, disco: 3500, gomez_pardo: 3100 } },
    { name: 'Hamburguesas Paladini 4u', category: 'Congelados', brand: 'Paladini', ean: '7790250000450', prices: { libertad: 3400, dia: 3000, comodin: 3150 } },

    // Carnes
    { name: 'Carne Picada Común x Kg', category: 'Carnes', brand: 'Genérico', ean: '1000000000001', prices: { coto: 4500, carrefour: 4800, jumbo: 5200, vea: 4700, gomez_pardo: 4300 } },
    { name: 'Asado de Novillo x Kg', category: 'Carnes', brand: 'Genérico', ean: '1000000000002', prices: { libertad: 6500, comodin: 6800, dia: 6200, changomas: 6400 } },
    { name: 'Pechuga de Pollo x Kg', category: 'Carnes', brand: 'Granja', ean: '1000000000003', prices: { coto: 3500, disco: 3800, vea: 3600, carrefour: 3400 } },

    // Perfumería
    { name: 'Shampoo Pantene Clásico 400ml', category: 'Perfumería', brand: 'Pantene', ean: '7500435123456', prices: { jumbo: 4200, coto: 3900, dia: 4100, gomez_pardo: 3800 } },
    { name: 'Desodorante Dove Original Aerosol 150ml', category: 'Perfumería', brand: 'Dove', ean: '7791293023847', prices: { carrefour: 2500, changomas: 2350, libertad: 2600, comodin: 2400 } },
    { name: 'Crema Dental Colgate Total 12 90g', category: 'Perfumería', brand: 'Colgate', ean: '7501004123567', prices: { vea: 1800, disco: 1950, dia: 1750, coto: 1850 } },

    // Panadería
    { name: 'Pan Lactal Blanco Bimbo 400g', category: 'Panadería', brand: 'Bimbo', ean: '7790070444552', prices: { coto: 2100, carrefour: 2200, changomas: 1950, jumbo: 2300 } },
    { name: 'Pan para Hamburguesas Fargo 4u', category: 'Panadería', brand: 'Fargo', ean: '7790070555661', prices: { vea: 1500, disco: 1600, libertad: 1450, gomez_pardo: 1400 } },
    
    // Frutas y Verduras
    { name: 'Papa Negra x Kg', category: 'Verdulería', brand: 'Genérico', ean: '1000000000004', prices: { coto: 600, dia: 550, changomas: 580, carrefour: 650 } },
    { name: 'Banana Cavendish x Kg', category: 'Verdulería', brand: 'Genérico', ean: '1000000000005', prices: { jumbo: 1400, disco: 1500, vea: 1350, gomez_pardo: 1200 } }
];

export async function seedDatabase() {
    console.log('🌱 Iniciando DB Seed...');

    const count = await prisma.supermarket.count();
    if (count > 0 && process.env.SKIP_SEED === 'true') {
        console.log('✅ Base de datos ya contiene datos. Saltando seed masivo.');
        return;
    }

    // 1. Supermercados
    for (const sup of SUPERMARKETS) {
        await prisma.supermarket.upsert({
            where: { id: sup.id },
            update: { name: sup.name, color: sup.color, logo: sup.logo },
            create: sup
        });
    }

    // 2. Base Products & Prices
    for (const prodData of PRODUCTS) {
        // Encontrar por nombre para evitar duplicados en seed-re-runs
        let product = await prisma.product.findFirst({
            where: { name: prodData.name }
        });

        if (!product) {
            product = await prisma.product.create({
                data: {
                    name: prodData.name,
                    category: prodData.category,
                    brand: prodData.brand,
                    ean: prodData.ean,
                    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
                }
            });
        }

        // Upsert Prices
        for (const [supId, price] of Object.entries(prodData.prices)) {
            await prisma.price.upsert({
                where: {
                    productId_supermarketId: {
                        productId: product.id,
                        supermarketId: supId
                    }
                },
                update: { price },
                create: {
                    productId: product.id,
                    supermarketId: supId,
                    price
                }
            });

            // Registrar Historial solo una vez por día en seed
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);

            const existingHistory = await prisma.priceHistory.findFirst({
                where: {
                    productId: product.id,
                    supermarketId: supId,
                    date: { gte: startOfDay }
                }
            });

            if (!existingHistory) {
                await prisma.priceHistory.create({
                    data: {
                        productId: product.id,
                        supermarketId: supId,
                        price,
                        date: new Date()
                    }
                });
            }
        }
    }

    console.log(`✅ Seed Finalizado: ${SUPERMARKETS.length} supermercados, ${PRODUCTS.length} productos base.`);
}

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
