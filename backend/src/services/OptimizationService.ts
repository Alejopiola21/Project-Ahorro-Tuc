import { ProductRepository, SupermarketRepository } from '../repositories';

export class OptimizationService {
    static async optimizeCart(cartItems: { productId: number, quantity: number }[]) {
        const productIds = cartItems.map(item => item.productId);
        const [products, supermarkets] = await Promise.all([
            ProductRepository.findByIds(productIds),
            SupermarketRepository.findAll(),
        ]);

        const totals: Record<string, number> = {};
        // Track cuántos productos tiene cada super para detectar catálogos incompletos
        const productCount: Record<string, number> = {};

        supermarkets.forEach(s => {
            totals[s.id] = 0;
            productCount[s.id] = 0;
        });

        products.forEach(item => {
            const cartItem = cartItems.find(c => c.productId === item.id);
            const quantity = cartItem ? cartItem.quantity : 1;

            Object.entries(item.prices).forEach(([sup, price]) => {
                if (totals[sup] !== undefined) {
                    totals[sup] += (price as number) * quantity;
                    productCount[sup] = (productCount[sup] || 0) + 1;
                }
            });
        });

        // Filtrar supermercados que no tienen TODOS los productos del carrito
        // para evitar comparaciones injustas
        const totalProducts = products.length;
        const completeSupermarkets = supermarkets
            .filter(s => productCount[s.id] === totalProducts)
            .map(s => s.id);

        const incompleteSupermarkets = supermarkets
            .filter(s => productCount[s.id] > 0 && productCount[s.id] < totalProducts)
            .map(s => ({
                id: s.id,
                name: s.name,
                missingProducts: totalProducts - productCount[s.id],
            }));

        // Solo incluir supermercados completos en el ranking principal
        const sortedTotals = Object.entries(totals)
            .filter(([id]) => completeSupermarkets.includes(id))
            .sort((a, b) => a[1] - b[1]);

        const maxSavings = sortedTotals.length > 1
            ? sortedTotals[sortedTotals.length - 1][1] - sortedTotals[0][1]
            : 0;

        return {
            sortedTotals,
            maxSavings,
            incompleteSupermarkets, // Informar al frontend cuáles tienen catálogo parcial
        };
    }
}
