import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client';

const JWT_SECRET = process.env.JWT_SECRET || 'ahorrotuc-dev-secret-change-in-production';
const JWT_EXPIRES_IN = '24h';
const BCRYPT_SALT_ROUNDS = 10;

export interface RegisterInput {
    email: string;
    password: string;
    name?: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface AuthResponse {
    user: {
        id: string;
        email: string;
        name: string | null;
    };
    token: string;
}

export class AuthService {
    static async register(input: RegisterInput): Promise<AuthResponse> {
        const existing = await prisma.user.findUnique({
            where: { email: input.email.toLowerCase() }
        });

        if (existing) {
            const error = new Error('El email ya está registrado');
            (error as any).statusCode = 409;
            throw error;
        }

        const hashedPassword = await bcrypt.hash(input.password, BCRYPT_SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                email: input.email.toLowerCase(),
                password: hashedPassword,
                name: input.name || null,
            }
        });

        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        };
    }

    static async login(input: LoginInput): Promise<AuthResponse> {
        const user = await prisma.user.findUnique({
            where: { email: input.email.toLowerCase() }
        });

        if (!user) {
            const error = new Error('Credenciales inválidas');
            (error as any).statusCode = 401;
            throw error;
        }

        const isValid = await bcrypt.compare(input.password, user.password);

        if (!isValid) {
            const error = new Error('Credenciales inválidas');
            (error as any).statusCode = 401;
            throw error;
        }

        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
            },
            token,
        };
    }

    static async getUserById(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            }
        });

        if (!user) {
            const error = new Error('Usuario no encontrado');
            (error as any).statusCode = 404;
            throw error;
        }

        return user;
    }

    private static generateToken(userId: string, email: string): string {
        return jwt.sign(
            { sub: userId, email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }

    static verifyToken(token: string): { sub: string; email: string } {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; email: string };
            return decoded;
        } catch {
            const error = new Error('Token inválido o expirado');
            (error as any).statusCode = 401;
            throw error;
        }
    }
}
