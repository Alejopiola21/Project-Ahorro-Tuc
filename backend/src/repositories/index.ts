import db from '../db/connection';

// ── Types ────────────────────────────────────────────────────────────────────
interface SupermarketRow { id: string; name: string; color: string; logo: string; }
interface PriceRow { supermarket_id: string; price: number; }

interface ProductRow {
    id: number;
    name: string;
    category: string;
    image_url: string;
}

// ── Queries ──────────────────────────────────────────────────────────────────
const QUERIES = {
    allSupermarkets: db.prepare<[], SupermarketRow>(
        'SELECT id, name, color, logo FROM supermarkets ORDER BY name'
    ),

    allProducts: db.prepare<[], ProductRow>(
        'SELECT id, name, category, image_url FROM products ORDER BY category, name'
    ),

    searchProducts: db.prepare<[string], ProductRow>(
        "SELECT id, name, category, image_url FROM products WHERE name LIKE ? OR category LIKE ? ORDER BY name"
    ),

    pricesByProduct: db.prepare<[number], PriceRow>(
        'SELECT supermarket_id, price FROM prices WHERE product_id = ?'
    ),

    priceHistory: db.prepare<[number, string], { price: number; recorded_at: string }>(
        `SELECT price, recorded_at
     FROM price_history
     WHERE product_id = ? AND supermarket_id = ?
     ORDER BY recorded_at DESC
     LIMIT 30`
    ),
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function buildProductWithPrices(row: ProductRow) {
    const priceRows = QUERIES.pricesByProduct.all(row.id);
    const prices: Record<string, number> = {};
    for (const p of priceRows) prices[p.supermarket_id] = p.price;
    return { id: row.id, name: row.name, category: row.category, image: row.image_url, prices };
}

// ── Repository ────────────────────────────────────────────────────────────────
export const SupermarketRepository = {
    findAll() {
        return QUERIES.allSupermarkets.all();
    },
};

export const ProductRepository = {
    findAll() {
        return QUERIES.allProducts.all().map(buildProductWithPrices);
    },

    search(query: string) {
        const pattern = `%${query}%`;
        return QUERIES.searchProducts.all(pattern, pattern).map(buildProductWithPrices);
    },

    getPriceHistory(productId: number, supermarketId: string) {
        return QUERIES.priceHistory.all(productId, supermarketId);
    },
};
