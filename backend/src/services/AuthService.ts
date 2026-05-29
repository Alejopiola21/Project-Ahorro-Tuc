import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client';
import { ApiError } from '../utils/ApiError';

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
            throw new ApiError('El email ya está registrado', 409);
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
            throw new ApiError('Credenciales inválidas', 401);
        }

        const isValid = await bcrypt.compare(input.password, user.password);

        if (!isValid) {
            throw new ApiError('Credenciales inválidas', 401);
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
            throw new ApiError('Usuario no encontrado', 404);
        }

        return user;
    }

    static async requestMagicLink(email: string): Promise<string> {
        const cleanEmail = email.toLowerCase();
        let user = await prisma.user.findUnique({
            where: { email: cleanEmail }
        });

        // Registrar usuario con contraseña aleatoria si no existe
        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-10);
            const hashedPassword = await bcrypt.hash(randomPassword, BCRYPT_SALT_ROUNDS);
            user = await prisma.user.create({
                data: {
                    email: cleanEmail,
                    password: hashedPassword,
                    name: null
                }
            });
        }

        const tempToken = jwt.sign(
            { email: cleanEmail, type: 'magic-link' },
            JWT_SECRET,
            { expiresIn: '15m' }
        );

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const magicLink = `${frontendUrl}/?magicToken=${tempToken}`;

        // Simulación de envío de correo por consola
        console.log('\n======================================================================');
        console.log(`✉️ [EMAIL SIMULATION] Para: ${cleanEmail}`);
        console.log(`🔗 Haz clic en el siguiente enlace para iniciar sesión:`);
        console.log(`👉 ${magicLink}`);
        console.log('======================================================================\n');

        return magicLink;
    }

    static async loginWithMagicLink(token: string): Promise<AuthResponse> {
        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { email: string; type: string };
            if (decoded.type !== 'magic-link') {
                throw new ApiError('Token de enlace mágico inválido', 400);
            }

            const user = await prisma.user.findUnique({
                where: { email: decoded.email }
            });

            if (!user) {
                throw new ApiError('El usuario asociado a este enlace no existe', 404);
            }

            const authToken = this.generateToken(user.id, user.email);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                },
                token: authToken,
            };
        } catch (error: any) {
            if (error instanceof ApiError) throw error;
            throw new ApiError('El enlace es inválido o ha expirado', 401);
        }
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
            throw new ApiError('Token inválido o expirado', 401);
        }
    }
}
