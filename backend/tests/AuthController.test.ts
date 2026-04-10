import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response } from 'express';
import { AuthController } from '../src/controllers/AuthController';
import { AuthService } from '../src/services/AuthService';

vi.mock('../src/services/AuthService', () => ({
    AuthService: {
        register: vi.fn(),
        login: vi.fn(),
        getUserById: vi.fn(),
    }
}));

function mockReqRes(body: unknown, headers?: Record<string, string>) {
    const req = {
        body,
        headers: headers ? { authorization: headers.Authorization } : {},
    } as unknown as Request;
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();
    return { req, res, next };
}

function mockReqResWithAuth(userId: string, headers?: Record<string, string>) {
    const req = {
        body: {},
        headers: headers ? { authorization: headers.Authorization } : {},
        userId,
        userEmail: 'test@example.com',
    } as unknown as Request;
    const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
    } as unknown as Response;
    const next = vi.fn();
    return { req, res, next };
}

describe('AuthController', () => {
    beforeEach(() => vi.clearAllMocks());

    // ── Register Tests ──

    describe('register', () => {
        it('retorna 400 con body vacío', async () => {
            const { req, res, next } = mockReqRes({});
            await AuthController.register(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
        });

        it('retorna 400 si email es inválido', async () => {
            const { req, res, next } = mockReqRes({ email: 'not-an-email', password: 'validPass123' });
            await AuthController.register(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('retorna 400 si password tiene menos de 6 caracteres', async () => {
            const { req, res, next } = mockReqRes({ email: 'test@example.com', password: '12345' });
            await AuthController.register(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('retorna 409 si el email ya está registrado', async () => {
            const duplicateError = new Error('El email ya está registrado');
            (duplicateError as any).statusCode = 409;
            vi.mocked(AuthService.register).mockRejectedValue(duplicateError);

            const { req, res, next } = mockReqRes({
                email: 'existing@example.com',
                password: 'validPass123',
            });
            await AuthController.register(req, res, next);

            expect(AuthService.register).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith({ error: 'El email ya está registrado' });
        });

        it('retorna 201 con usuario y token en path feliz', async () => {
            const mockResult = {
                user: { id: 'uuid-1', email: 'new@example.com', name: 'Nuevo' },
                token: 'jwt-token-here',
            };
            vi.mocked(AuthService.register).mockResolvedValue(mockResult);

            const { req, res, next } = mockReqRes({
                email: 'new@example.com',
                password: 'validPass123',
                name: 'Nuevo',
            });
            await AuthController.register(req, res, next);

            expect(AuthService.register).toHaveBeenCalledWith({
                email: 'new@example.com',
                password: 'validPass123',
                name: 'Nuevo',
            });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });
    });

    // ── Login Tests ──

    describe('login', () => {
        it('retorna 400 con body vacío', async () => {
            const { req, res, next } = mockReqRes({});
            await AuthController.login(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('retorna 400 si falta password', async () => {
            const { req, res, next } = mockReqRes({ email: 'test@example.com' });
            await AuthController.login(req, res, next);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('retorna 401 con credenciales inválidas', async () => {
            const authError = new Error('Credenciales inválidas');
            (authError as any).statusCode = 401;
            vi.mocked(AuthService.login).mockRejectedValue(authError);

            const { req, res, next } = mockReqRes({
                email: 'test@example.com',
                password: 'wrongPassword',
            });
            await AuthController.login(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Credenciales inválidas' });
        });

        it('retorna 200 con usuario y token en path feliz', async () => {
            const mockResult = {
                user: { id: 'uuid-1', email: 'test@example.com', name: 'Test User' },
                token: 'jwt-token-here',
            };
            vi.mocked(AuthService.login).mockResolvedValue(mockResult);

            const { req, res, next } = mockReqRes({
                email: 'test@example.com',
                password: 'correctPassword',
            });
            await AuthController.login(req, res, next);

            expect(AuthService.login).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'correctPassword',
            });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });
    });

    // ── getMe Tests ──

    describe('getMe', () => {
        it('retorna 401 si no hay userId en el request', async () => {
            const req = {
                body: {},
                headers: {},
            } as unknown as Request;
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn().mockReturnThis(),
            } as unknown as Response;
            const next = vi.fn();

            await AuthController.getMe(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Token inválido' });
        });

        it('retorna 404 si el usuario no existe', async () => {
            const notFoundError = new Error('Usuario no encontrado');
            (notFoundError as any).statusCode = 404;
            vi.mocked(AuthService.getUserById).mockRejectedValue(notFoundError);

            const { req, res, next } = mockReqResWithAuth('non-existent-uuid');
            await AuthController.getMe(req, res, next);

            expect(res.status).toHaveBeenCalledWith(404);
        });

        it('retorna 200 con datos del usuario en path feliz', async () => {
            const mockUser = {
                id: 'uuid-1',
                email: 'test@example.com',
                name: 'Test User',
                createdAt: new Date(),
            };
            vi.mocked(AuthService.getUserById).mockResolvedValue(mockUser);

            const { req, res, next } = mockReqResWithAuth('uuid-1');
            await AuthController.getMe(req, res, next);

            expect(AuthService.getUserById).toHaveBeenCalledWith('uuid-1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ user: mockUser });
        });
    });
});
