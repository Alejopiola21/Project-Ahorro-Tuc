import { ProductRepository, SupermarketRepository } from '../repositories';

interface HybridSplitItem {
    productId: number;
    name: string;
    price: number;
    quantity: number;
    totalPrice: number;
}

interface HybridResult {
    supermarkets: [string, string];
    total: number;
    splits: Record<string, HybridSplitItem[]>;
}

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

        const singleWinnerPrice = sortedTotals.length > 0 ? sortedTotals[0][1] : Infinity;

        // ── 🧪 Cálculo de Híbrido (Mejor combinación de 2 supermercados) ──
        let bestHybrid: HybridResult | null = null;

        for (let i = 0; i < supermarkets.length; i++) {
            for (let j = i + 1; j < supermarkets.length; j++) {
                const s1 = supermarkets[i].id;
                const s2 = supermarkets[j].id;

                let pairTotal = 0;
                let isComplete = true;
                const currentSplits: Record<string, HybridSplitItem[]>  = { [s1]: [], [s2]: [] };

                for (const item of products) {
                    const cartItem = cartItems.find(c => c.productId === item.id);
                    const qty = cartItem ? cartItem.quantity : 1;

                    const p1 = item.prices[s1] as number | undefined;
                    const p2 = item.prices[s2] as number | undefined;

                    if (p1 === undefined && p2 === undefined) {
                        isComplete = false;
                        break; // Ninguno de los 2 lo tiene
                    }

                    let chosenSup = s1;
                    let chosenPrice = 0;

                    if (p1 !== undefined && p2 !== undefined) {
                        if (p1 <= p2) { chosenSup = s1; chosenPrice = p1; }
                        else { chosenSup = s2; chosenPrice = p2; }
                    } else if (p1 !== undefined) {
                        chosenSup = s1; chosenPrice = p1;
                    } else {
                        chosenSup = s2; chosenPrice = p2 as number;
                    }

                    pairTotal += chosenPrice * qty;
                    currentSplits[chosenSup].push({
                        productId: item.id,
                        name: item.name,
                        price: chosenPrice,
                        quantity: qty,
                        totalPrice: chosenPrice * qty
                    });
                }

                if (isComplete) {
                    if (!bestHybrid || pairTotal < bestHybrid.total) {
                        bestHybrid = {
                            supermarkets: [s1, s2],
                            total: pairTotal,
                            splits: currentSplits
                        };
                    }
                }
            }
        }

        let hybridOptimization = null;
        // Solo retornamos híbrido si realmene vale la pena (dividir la compra) y ambos tienen ítems
        if (bestHybrid && bestHybrid.total < singleWinnerPrice) {
            const hasItemsS1 = bestHybrid.splits[bestHybrid.supermarkets[0]].length > 0;
            const hasItemsS2 = bestHybrid.splits[bestHybrid.supermarkets[1]].length > 0;
            
            if (hasItemsS1 && hasItemsS2) {
                 hybridOptimization = {
                     supermarkets: bestHybrid.supermarkets,
                     totalPrice: bestHybrid.total,
                     savingsFromSingle: singleWinnerPrice - bestHybrid.total,
                     splits: bestHybrid.splits
                 };
            }
        }

        return {
            sortedTotals,
            maxSavings,
            incompleteSupermarkets,
            hybridOptimization
        };
    }
}
