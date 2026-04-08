import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OptimizationService } from '../src/services/OptimizationService';
import { ProductRepository, SupermarketRepository } from '../src/repositories';

// Mock the repositories
vi.mock('../src/repositories', () => ({
    ProductRepository: {
        findByIds: vi.fn()
    },
    SupermarketRepository: {
        findAll: vi.fn()
    }
}));

const mockSupermarkets = [
    { id: 'coto', name: 'Coto', color: '#e63946', logo: 'C' },
    { id: 'carrefour', name: 'Carrefour', color: '#1d3557', logo: 'Ca' }
];

describe('OptimizationService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calcula el supermercado más barato y el ahorro máximo correctamente', async () => {
        const mockProducts = [
            { id: 1, name: 'Leche', category: 'Lácteos', image: '', brand: null, weight: null, ean: null, prices: { coto: 100, carrefour: 150 } },
            { id: 2, name: 'Pan',   category: 'Panadería', image: '', brand: null, weight: null, ean: null, prices: { coto: 200, carrefour: 180 } }
        ];

        vi.mocked(SupermarketRepository.findAll).mockResolvedValue(mockSupermarkets as any);
        vi.mocked(ProductRepository.findByIds).mockResolvedValue(mockProducts as any);

        const result = await OptimizationService.optimizeCart([
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 1 }
        ]);

        // Coto: 100 + 200 = 300 | Carrefour: 150 + 180 = 330
        expect(result.sortedTotals).toEqual([['coto', 300], ['carrefour', 330]]);
        expect(result.maxSavings).toBe(30);
    });

    it('multiplica correctamente por quantity > 1', async () => {
        const mockProducts = [
            { id: 1, name: 'Leche', category: 'Lácteos', image: '', brand: null, weight: null, ean: null, prices: { coto: 1000, carrefour: 900 } }
        ];

        vi.mocked(SupermarketRepository.findAll).mockResolvedValue(mockSupermarkets as any);
        vi.mocked(ProductRepository.findByIds).mockResolvedValue(mockProducts as any);

        const result = await OptimizationService.optimizeCart([
            { productId: 1, quantity: 3 }
        ]);

        // 1000 * 3 = 3000 | 900 * 3 = 2700
        expect(result.sortedTotals[0]).toEqual(['carrefour', 2700]);
        expect(result.sortedTotals[1]).toEqual(['coto', 3000]);
        expect(result.maxSavings).toBe(300);
    });

    it('devuelve carrito vacío y maxSavings 0 si no hay productos', async () => {
        vi.mocked(SupermarketRepository.findAll).mockResolvedValue(mockSupermarkets as any);
        vi.mocked(ProductRepository.findByIds).mockResolvedValue([]);

        const result = await OptimizationService.optimizeCart([]);

        expect(result.sortedTotals).toHaveLength(0);
        expect(result.maxSavings).toBe(0);
    });

    it('excluye supermercados con catálogo incompleto del ranking principal', async () => {
        // carrefour NO tiene el producto 2
        const mockProducts = [
            { id: 1, name: 'Leche', category: 'Lácteos', image: '', brand: null, weight: null, ean: null, prices: { coto: 100, carrefour: 90 } },
            { id: 2, name: 'Pan',   category: 'Panadería', image: '', brand: null, weight: null, ean: null, prices: { coto: 200 } }   // sin carrefour
        ];

        vi.mocked(SupermarketRepository.findAll).mockResolvedValue(mockSupermarkets as any);
        vi.mocked(ProductRepository.findByIds).mockResolvedValue(mockProducts as any);

        const result = await OptimizationService.optimizeCart([
            { productId: 1, quantity: 1 },
            { productId: 2, quantity: 1 }
        ]);

        // Solo coto tiene todos los productos → aparece en sortedTotals
        expect(result.sortedTotals.map(([id]) => id)).toContain('coto');
        expect(result.sortedTotals.map(([id]) => id)).not.toContain('carrefour');
        // carrefour debería estar en incompleteSupermarkets
        expect(result.incompleteSupermarkets.some(s => s.id === 'carrefour')).toBe(true);
    });
});
