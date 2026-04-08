import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { OptimizationController } from '../src/controllers/OptimizationController';
import { OptimizationService } from '../src/services/OptimizationService';

vi.mock('../src/services/OptimizationService', () => ({
    OptimizationService: {
        optimizeCart: vi.fn()
    }
}));

// Helper para crear mocks de req/res de Express
function mockReqRes(body: unknown) {
    const req = { body } as Request;
    const res = {
        status: vi.fn().mockReturnThis(),
        json:   vi.fn().mockReturnThis()
    } as unknown as Response;
    const next = vi.fn();
    return { req, res, next };
}

describe('OptimizationController', () => {
    beforeEach(() => vi.clearAllMocks());

    it('retorna 400 con payload vacío', async () => {
        const { req, res, next } = mockReqRes({});
        await OptimizationController.optimizeCart(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
    });

    it('retorna 400 si cartItems no es array', async () => {
        const { req, res, next } = mockReqRes({ cartItems: 'invalid' });
        await OptimizationController.optimizeCart(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 si quantity es 0 o negativo', async () => {
        const { req, res, next } = mockReqRes({ cartItems: [{ productId: 1, quantity: 0 }] });
        await OptimizationController.optimizeCart(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('retorna 400 si productId es negativo', async () => {
        const { req, res, next } = mockReqRes({ cartItems: [{ productId: -1, quantity: 1 }] });
        await OptimizationController.optimizeCart(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    it('llama a OptimizationService con payload válido y retorna 200', async () => {
        const mockResult = { sortedTotals: [['coto', 300]], maxSavings: 0, incompleteSupermarkets: [] };
        vi.mocked(OptimizationService.optimizeCart).mockResolvedValue(mockResult as any);

        const { req, res, next } = mockReqRes({ cartItems: [{ productId: 1, quantity: 2 }] });
        await OptimizationController.optimizeCart(req, res, next);

        expect(OptimizationService.optimizeCart).toHaveBeenCalledWith([{ productId: 1, quantity: 2 }]);
        expect(res.json).toHaveBeenCalledWith(mockResult);
    });
});
