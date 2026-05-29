/**
 * Coordenadas geográficas de sucursales de supermercados en San Miguel de Tucumán.
 * Fuentes: Nominatim/OSM, maptons.com, hiperlibertad.com.ar, maxiconsumo.com, tiendeo.com.ar
 * Última verificación: Mayo 2026.
 *
 * Cadenas SIN sucursales físicas en Tucumán capital:
 *   - Coto (no opera en Tucumán)
 *   - Jumbo (no opera en Tucumán)
 *   - Disco (no opera en Tucumán)
 *   - Día (no opera en Tucumán)
 */

export interface Branch {
    /** ID de la cadena, coincide con el campo `id` del modelo Supermarket */
    supermarketId: string;
    /** Nombre descriptivo de la sucursal */
    name: string;
    /** Dirección postal */
    address: string;
    /** Latitud WGS-84 */
    lat: number;
    /** Longitud WGS-84 */
    lng: number;
}

export const BRANCHES: Branch[] = [
    // ── Carrefour ──────────────────────────────────────────────────────────────
    {
        supermarketId: 'carrefour',
        name: 'Carrefour Catamarca',
        address: 'Av. Catamarca 1116, San Miguel de Tucumán',
        lat: -26.8143,
        lng: -65.2085,
    },

    // ── Vea ────────────────────────────────────────────────────────────────────
    {
        supermarketId: 'vea',
        name: 'Vea Sarmiento',
        address: 'Av. Sarmiento 750, San Miguel de Tucumán',
        lat: -26.8200,
        lng: -65.2200,
    },
    {
        supermarketId: 'vea',
        name: 'Vea Alem',
        address: 'Av. Leandro N. Alem 240, San Miguel de Tucumán',
        lat: -26.8060,
        lng: -65.2050,
    },
    {
        supermarketId: 'vea',
        name: 'Vea Mate de Luna',
        address: 'Av. Mate de Luna 2852, San Miguel de Tucumán',
        lat: -26.8155,
        lng: -65.2420,
    },

    // ── Gómez Pardo ───────────────────────────────────────────────────────────
    {
        supermarketId: 'gomez_pardo',
        name: 'Gómez Pardo Brígido Terán',
        address: 'Av. Brígido Terán 700, San Miguel de Tucumán',
        lat: -26.8436,
        lng: -65.1959,
    },
    {
        supermarketId: 'gomez_pardo',
        name: 'Gómez Pardo Chacabuco',
        address: 'Batalla de Chacabuco 1122, San Miguel de Tucumán',
        lat: -26.8160,
        lng: -65.2100,
    },

    // ── ChangoMás ─────────────────────────────────────────────────────────────
    {
        supermarketId: 'changomas',
        name: 'ChangoMás Camino del Perú',
        address: 'Av. Camino del Perú 950, San Miguel de Tucumán',
        lat: -26.8048,
        lng: -65.2604,
    },
    {
        supermarketId: 'changomas',
        name: 'ChangoMás Ejército del Norte',
        address: 'Av. Ejército del Norte 2324, San Miguel de Tucumán',
        lat: -26.7840,
        lng: -65.2440,
    },
    {
        supermarketId: 'changomas',
        name: 'ChangoMás Jujuy',
        address: 'Av. Jujuy (entre Democracia y P. Fernández), San Miguel de Tucumán',
        lat: -26.8210,
        lng: -65.2080,
    },

    // ── Libertad ──────────────────────────────────────────────────────────────
    {
        supermarketId: 'libertad',
        name: 'Hipermercado Libertad Roca',
        address: 'Av. Gral. Roca 3440, San Miguel de Tucumán',
        lat: -26.8350,
        lng: -65.2550,
    },
    {
        supermarketId: 'libertad',
        name: 'Hipermercado Libertad Castelar',
        address: 'Emilio Castelar y Batalla de Suipacha, San Miguel de Tucumán',
        lat: -26.8076,
        lng: -65.2412,
    },

    // ── Comodín ───────────────────────────────────────────────────────────────
    {
        supermarketId: 'comodin',
        name: 'Comodín Juan B. Justo',
        address: 'Av. Juan B. Justo 1100, San Miguel de Tucumán',
        lat: -26.8380,
        lng: -65.2180,
    },
    {
        supermarketId: 'comodin',
        name: 'Comodín Av. Roca',
        address: 'Av. Roca 3057, San Miguel de Tucumán',
        lat: -26.8500,
        lng: -65.2480,
    },
    {
        supermarketId: 'comodin',
        name: 'Comodín Alem',
        address: 'Av. Leandro N. Alem 1796, San Miguel de Tucumán',
        lat: -26.8525,
        lng: -65.2242,
    },

    // ── Maxiconsumo ───────────────────────────────────────────────────────────
    {
        supermarketId: 'maxiconsumo',
        name: 'Maxiconsumo Lavalle',
        address: 'Lavalle 3253, San Miguel de Tucumán',
        lat: -26.8309,
        lng: -65.2487,
    },

    // ── La Anónima ────────────────────────────────────────────────────────────
    {
        supermarketId: 'laanonima',
        name: 'La Anónima Tucumán I',
        address: 'Av. Gral. Roca 3440, San Miguel de Tucumán',
        lat: -26.8352,
        lng: -65.2548,
    },
    {
        supermarketId: 'laanonima',
        name: 'La Anónima Tucumán II',
        address: 'Emilio Castelar y Batalla de Suipacha, San Miguel de Tucumán',
        lat: -26.8078,
        lng: -65.2414,
    },

    // ── Makro ─────────────────────────────────────────────────────────────────
    {
        supermarketId: 'makro',
        name: 'Makro Poviña',
        address: 'Av. H. Poviña 1200, San Miguel de Tucumán',
        lat: -26.7940,
        lng: -65.2700,
    },

    // ── Cadenas SIN sucursales físicas en Tucumán ────────────────────────────
    // coto     → no opera en Tucumán
    // jumbo    → no opera en Tucumán
    // disco    → no opera en Tucumán
    // dia      → no opera en Tucumán
];

/**
 * Devuelve todas las sucursales de una cadena dada.
 */
export function getBranchesByChain(supermarketId: string): Branch[] {
    return BRANCHES.filter(b => b.supermarketId === supermarketId);
}

/**
 * Conjunto de IDs de cadenas que NO tienen sucursales físicas en Tucumán capital.
 * Estas cadenas participan en el sistema de precios mediante datos de e-commerce
 * pero el usuario no puede ir físicamente a comprar a ellas en Tucumán.
 */
export const CHAINS_WITHOUT_BRANCHES = new Set<string>([
    'coto',
    'jumbo',
    'disco',
    'dia',
]);
