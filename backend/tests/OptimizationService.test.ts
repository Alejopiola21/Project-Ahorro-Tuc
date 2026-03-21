import { describe, it, expect, vi } from 'vitest';
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

describe('OptimizationService', () => {
    it('should calculate the cheapest supermarket and max savings correctly', () => {
        // Arrange
        const mockSupermarkets = [
            { id: 'coto', name: 'Coto' },
            { id: 'carrefour', name: 'Carrefour' }
        ];

        const mockProducts = [
            {
                id: 1,
                prices: { coto: 100, carrefour: 150 }
            },
            {
                id: 2,
                prices: { coto: 200, carrefour: 180 }
            }
        ];

        vi.mocked(SupermarketRepository.findAll).mockReturnValue(mockSupermarkets);
        vi.mocked(ProductRepository.findByIds).mockReturnValue(mockProducts as any);

        // Act
        const result = OptimizationService.optimizeCart([1, 2]);

        // Assert
        // Coto total: 100 + 200 = 300
        // Carrefour total: 150 + 180 = 330

        expect(result.sortedTotals).toEqual([
            ['coto', 300],
            ['carrefour', 330]
        ]);
        expect(result.maxSavings).toBe(30); // 330 - 300
    });
});
