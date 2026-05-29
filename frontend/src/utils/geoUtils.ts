import type { Branch } from '../data/supermarketBranches';
import { getBranchesByChain, CHAINS_WITHOUT_BRANCHES } from '../data/supermarketBranches';

/**
 * Calcula la distancia en kilómetros entre dos puntos GPS
 * usando la fórmula de Haversine (distancia aérea).
 */
export function haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) *
            Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) *
            Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}

export interface NearestBranchResult {
    branch: Branch;
    distanceKm: number;
}

/**
 * Devuelve la sucursal más cercana al usuario para una cadena dada.
 * Retorna null si la cadena no tiene sucursales en Tucumán capital.
 */
export function getNearestBranch(
    userLat: number,
    userLng: number,
    supermarketId: string,
): NearestBranchResult | null {
    if (CHAINS_WITHOUT_BRANCHES.has(supermarketId)) return null;

    const branches = getBranchesByChain(supermarketId);
    if (branches.length === 0) return null;

    let nearest: Branch = branches[0];
    let minDist = haversineDistance(userLat, userLng, branches[0].lat, branches[0].lng);

    for (let i = 1; i < branches.length; i++) {
        const dist = haversineDistance(userLat, userLng, branches[i].lat, branches[i].lng);
        if (dist < minDist) {
            minDist = dist;
            nearest = branches[i];
        }
    }

    return { branch: nearest, distanceKm: minDist };
}

export interface GeoAdjustedTotal {
    supermarketId: string;
    cartTotal: number;
    nearestBranch: Branch | null;
    distanceKm: number | null;
    /** true si la cadena no tiene sucursal física en Tucumán */
    noPhysicalStore: boolean;
}

/**
 * Enriquece el listado de totales del carrito con la distancia
 * a la sucursal más cercana de cada cadena.
 * Ordena: primero las cadenas con sucursal (por precio), luego las que no tienen.
 */
export function buildGeoAdjustedTotals(
    sortedTotals: [string, number][],
    userLat: number,
    userLng: number,
): GeoAdjustedTotal[] {
    const withGeo: GeoAdjustedTotal[] = sortedTotals.map(([id, total]) => {
        if (CHAINS_WITHOUT_BRANCHES.has(id)) {
            return {
                supermarketId: id,
                cartTotal: total,
                nearestBranch: null,
                distanceKm: null,
                noPhysicalStore: true,
            };
        }

        const result = getNearestBranch(userLat, userLng, id);
        return {
            supermarketId: id,
            cartTotal: total,
            nearestBranch: result?.branch ?? null,
            distanceKm: result ? parseFloat(result.distanceKm.toFixed(1)) : null,
            noPhysicalStore: false,
        };
    });

    // Primero las que tienen sucursal (ordenadas por precio, que ya vienen así),
    // luego las que no tienen presencia física.
    const withStore = withGeo.filter(g => !g.noPhysicalStore);
    const withoutStore = withGeo.filter(g => g.noPhysicalStore);
    return [...withStore, ...withoutStore];
}

/** Formatea km con 1 decimal y la unidad apropiada */
export function formatDistance(km: number): string {
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
}
