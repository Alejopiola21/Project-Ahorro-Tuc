import { ProductRepository, SupermarketRepository } from '../repositories';

export class OptimizationService {
    static optimizeCart(productIds: number[]) {
        const products = ProductRepository.findByIds(productIds);
        const supermarkets = SupermarketRepository.findAll();

        const totals: Record<string, number> = {};
        supermarkets.forEach(s => totals[s.id] = 0);

        products.forEach(item => {
            Object.entries(item.prices).forEach(([sup, price]) => {
                if (totals[sup] !== undefined) totals[sup] += price as number;
            });
        });

        const sortedTotals = Object.entries(totals).sort((a, b) => a[1] - b[1]);
        const maxSavings = sortedTotals.length > 0 ? sortedTotals[sortedTotals.length - 1][1] - sortedTotals[0][1] : 0;

        return { sortedTotals, maxSavings };
    }
}
