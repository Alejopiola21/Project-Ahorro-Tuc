import { prisma } from '../db/client';
import { ProductRepository, buildProductWithPrices } from '../repositories';

export interface SubstitutionSuggestion {
    originalProductId: number;
    originalName: string;
    originalQuantity: number;
    suggestedProduct: any; // Retorna el formato unificado del producto
    suggestedQuantity: number;
    savings: number;
    savingsBySupermarket: Record<string, number>;
}

export class SubstitutionService {
    static async getSuggestions(cartItems: { productId: number; quantity: number }[]): Promise<SubstitutionSuggestion[]> {
        if (cartItems.length === 0) return [];

        const productIds = cartItems.map(item => item.productId);
        const products = await ProductRepository.findByIds(productIds);

        const suggestions: SubstitutionSuggestion[] = [];

        for (const product of products) {
            // Se requieren campos volumétricos y marca para calcular equivalencias
            if (!product.brand || !product.unitValue || !product.unitType) continue;

            const cartItem = cartItems.find(c => c.productId === product.id);
            const quantity = cartItem ? cartItem.quantity : 1;
            const totalVolume = product.unitValue * quantity;

            // Buscar candidatos de la misma marca y categoría con menor volumen individual
            const dbCandidates = await prisma.product.findMany({
                where: {
                    brand: { equals: product.brand, mode: 'insensitive' },
                    category: { equals: product.category, mode: 'insensitive' },
                    unitType: product.unitType,
                    unitValue: { lt: product.unitValue },
                    id: { not: product.id }
                },
                include: {
                    currentPrices: {
                        select: {
                            supermarketId: true,
                            price: true,
                            unitPrice: true,
                        }
                    }
                }
            });

            for (const candidate of dbCandidates) {
                if (!candidate.unitValue) continue;

                // Cantidad requerida del formato más pequeño para igualar o superar el volumen original
                const suggestedQty = Math.ceil(totalVolume / candidate.unitValue);

                const savingsBySupermarket: Record<string, number> = {};
                let hasSavings = false;
                let maxSavings = 0;

                // Comparar precios en cada supermercado
                for (const supermarketId of Object.keys(product.prices)) {
                    const priceOriginal = product.prices[supermarketId];
                    const originalCost = priceOriginal * quantity;

                    const priceCandidateObj = candidate.currentPrices.find(p => p.supermarketId === supermarketId);
                    if (!priceCandidateObj || priceCandidateObj.price <= 0) continue;

                    const priceCandidate = priceCandidateObj.price;
                    const suggestedCost = priceCandidate * suggestedQty;

                    if (suggestedCost < originalCost) {
                        const savings = originalCost - suggestedCost;
                        savingsBySupermarket[supermarketId] = parseFloat(savings.toFixed(2));
                        if (savings > maxSavings) {
                            maxSavings = savings;
                        }
                        hasSavings = true;
                    }
                }

                if (hasSavings) {
                    // Mapear el candidato usando buildProductWithPrices
                    const suggestedProduct = buildProductWithPrices(candidate as any);

                    suggestions.push({
                        originalProductId: product.id,
                        originalName: product.name,
                        originalQuantity: quantity,
                        suggestedProduct,
                        suggestedQuantity: suggestedQty,
                        savings: parseFloat(maxSavings.toFixed(2)),
                        savingsBySupermarket
                    });
                }
            }
        }

        // Ordenar por el ahorro máximo estimado
        return suggestions.sort((a, b) => b.savings - a.savings);
    }
}
