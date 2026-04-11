/**
 * Utilidad para extraer y normalizar pesos y volúmenes de productos.
 * Permite calcular el precio por kilo, litro o unidad.
 */
export function parseWeight(str: string): { unitValue: number, unitType: string } | null {
    if (!str) return null;
    
    // Regex mejorada para capturar valor y unidad
    // Soporta: 500g, 1kg, 1.5L, 750ml, 4u, pack x6, 2.25 l, etc.
    const regex = /(\d+(?:[.,]\d+)?)\s*(kg|g|gr|l|ml|cc|u|uni|unidades|un|pack)/i;
    const match = str.match(regex);
    
    if (!match) return null;
    
    let value = parseFloat(match[1].replace(',', '.'));
    let unit = match[2].toLowerCase();
    
    // Normalización a unidades base (kg, L, u)
    if (unit === 'g' || unit === 'gr') {
        value = value / 1000;
        unit = 'kg';
    } else if (unit === 'ml' || unit === 'cc') {
        value = value / 1000;
        unit = 'L';
    } else if (unit === 'kg') {
        unit = 'kg';
    } else if (unit === 'l') {
        unit = 'L';
    } else if (unit === 'pack' || unit === 'u' || unit === 'un' || unit === 'uni' || unit === 'unidades') {
        unit = 'u';
    } else {
        return null; // Unidad no soportada para normalización
    }

    // Limpieza de decimales flotantes (ej: 0.10000000000000001)
    value = parseFloat(value.toFixed(4));

    return { unitValue: value, unitType: unit };
}

/**
 * Intenta encontrar el peso tanto en el nombre como en un string de peso dedicado.
 */
export function extractWeightInfo(name: string, weight?: string | null): { unitValue: number, unitType: string } | null {
    // 1. Intentar con el campo weight dedicado
    if (weight) {
        const result = parseWeight(weight);
        if (result) return result;
    }
    
    // 2. Intentar extrayendo del nombre
    return parseWeight(name);
}
