import type { CartItem, CartTotals } from '../types';

/**
 * Genera un mensaje formateado para compartir la lista de compras por WhatsApp o Portapapeles.
 */
export function formatCartShareMessage(
    cart: CartItem[],
    cartTotals: CartTotals | null,
    optMode: 'single' | 'hybrid'
): string {
    const divider = '------------------------------------------';
    let message = `🛒 *AHORRO TUC - MI LISTA DE COMPRAS*\n${divider}\n\n`;

    if (!cartTotals) {
        // Fallback si no hay optimización calculada aún
        message += `📦 *PRODUCTOS (${cart.length}):*\n`;
        cart.forEach(item => {
            message += `- ${item.product.name} x${item.quantity}\n`;
        });
    } else if (optMode === 'single') {
        const [bestSupId, bestTotal] = cartTotals.sortedTotals[0];
        message += `🏆 *GANADOR: ${bestSupId.toUpperCase()}*\n`;
        message += `💰 *TOTAL: $${bestTotal.toLocaleString('es-AR')}*\n`;
        message += `🔥 *AHORRO: $${cartTotals.maxSavings.toLocaleString('es-AR')}*\n\n`;
        
        message += `📦 *DETALLE DE LA LISTA:*\n`;
        cart.forEach(item => {
            const price = item.product.prices[bestSupId];
            const itemTotal = price ? price * item.quantity : 0;
            message += `- ${item.product.name} x${item.quantity}${itemTotal > 0 ? ` ($${itemTotal.toLocaleString('es-AR')})` : ''}\n`;
        });
    } else if (optMode === 'hybrid' && cartTotals.hybridOptimization) {
        const hybrid = cartTotals.hybridOptimization;
        message += `🔀 *COMPRA DIVIDIDA (HÍBRIDA)*\n`;
        message += `💰 *TOTAL MEJORADO: $${hybrid.totalPrice.toLocaleString('es-AR')}*\n`;
        message += `🚀 *AHORRO EXTRA: $${hybrid.savingsFromSingle.toLocaleString('es-AR')}*\n\n`;

        hybrid.supermarkets.forEach(supId => {
            const items = hybrid.splits[supId];
            const partialTotal = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
            message += `📍 *EN ${supId.toUpperCase()}* ($${partialTotal.toLocaleString('es-AR')}):\n`;
            items.forEach(item => {
                message += `  - ${item.name} x${item.quantity}\n`;
            });
            message += `\n`;
        });
    }

    message += `\n${divider}\n`;
    message += `👉 *Optimizá tu compra en:* https://ahorro-tuc.com.ar`;

    return message;
}

/**
 * Abre WhatsApp con el mensaje pre-cargado.
 */
export function shareToWhatsApp(text: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
}

/**
 * Copia el texto al portapapeles.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Error al copiar al portapapeles:', err);
        return false;
    }
}
