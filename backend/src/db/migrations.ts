import db from './connection';

/**
 * Creates all tables if they don't exist yet.
 * Schema:
 *   supermarkets  → cadenas de supermercados
 *   products      → catálogo de productos
 *   prices        → precio de un producto en un supermercado
 *   price_history → historial de precios (cada vez que el scraper actualiza)
 */
export function runMigrations() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS supermarkets (
      id    TEXT PRIMARY KEY,
      name  TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT '#333',
      logo  TEXT NOT NULL DEFAULT '?'
    );

    CREATE TABLE IF NOT EXISTS products (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      name      TEXT NOT NULL,
      category  TEXT NOT NULL,
      image_url TEXT NOT NULL,
      barcode   TEXT UNIQUE,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prices (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      supermarket_id  TEXT    NOT NULL REFERENCES supermarkets(id) ON DELETE CASCADE,
      price           REAL    NOT NULL,
      updated_at      TEXT    DEFAULT (datetime('now')),
      UNIQUE(product_id, supermarket_id)
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id      INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      supermarket_id  TEXT    NOT NULL REFERENCES supermarkets(id) ON DELETE CASCADE,
      price           REAL    NOT NULL,
      recorded_at     TEXT    DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_prices_product     ON prices(product_id);
    CREATE INDEX IF NOT EXISTS idx_prices_supermarket ON prices(supermarket_id);
    CREATE INDEX IF NOT EXISTS idx_history_product    ON price_history(product_id);
    CREATE INDEX IF NOT EXISTS idx_history_date       ON price_history(recorded_at);
  `);

    console.log('[DB] ✅ Migrations applied successfully');
}
