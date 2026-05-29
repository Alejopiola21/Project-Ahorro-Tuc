import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export const AuthModal: React.FC<Props> = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState<'login' | 'register' | 'magic'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const login = useAuthStore(state => state.login);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (mode === 'magic') {
                const response = await api.post('/auth/magic-request', { email });
                toast.success('¡Enlace de acceso enviado! Revisá tu consola del backend.');
                
                if (response.data.link) {
                    console.log('Magic Link Dev Bypass:', response.data.link);
                }

                resetForm();
                onClose();
                return;
            }

            const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
            const body: Record<string, string> = { email, password };
            if (mode === 'register' && name) body.name = name;

            const response = await api.post<AuthResponse>(endpoint, body);
            const { user, token } = response.data;

            login(user, token);
            toast.success(mode === 'login' ? `¡Bienvenido de vuelta, ${user.name || user.email}!` : `¡Cuenta creada exitosamente! Bienvenido, ${user.name || user.email}`);
            resetForm();
            onClose();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'Error de conexión. Intenta de nuevo.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setPassword('');
        setName('');
    };

    const handleClose = () => {
        resetForm();
        setMode('login');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay" onClick={handleClose} role="dialog" aria-modal="true" aria-label={mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : 'Ingresar sin contraseña'}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-modal-close" onClick={handleClose} aria-label="Cerrar">
                    <X size={24} />
                </button>

                <div className="auth-modal-header">
                    <h2>{mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Crear Cuenta' : 'Enlace de Acceso'}</h2>
                    <p>{mode === 'login'
                        ? 'Accedé para guardar tus listas y comparar precios'
                        : mode === 'register'
                        ? 'Registrate gratis para guardar tus carritos'
                        : 'Ingresá tu email para recibir un enlace de acceso rápido'
                    }</p>
                </div>

                <form className="auth-modal-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="auth-input-group">
                            <User size={18} className="auth-input-icon" />
                            <input
                                type="text"
                                placeholder="Nombre (opcional)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                maxLength={100}
                            />
                        </div>
                    )}

                    <div className="auth-input-group">
                        <Mail size={18} className="auth-input-icon" />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    {mode !== 'magic' && (
                        <div className="auth-input-group">
                            <Lock size={18} className="auth-input-icon" />
                            <input
                                type="password"
                                placeholder="Contraseña"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                maxLength={128}
                                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                            />
                        </div>
                    )}

                    <button type="submit" className="auth-submit-btn" disabled={loading}>
                        {loading ? (
                            <span className="auth-loading">
                                <span className="spinner-dot" /> Procesando...
                            </span>
                        ) : (
                            mode === 'login' ? 'Iniciar Sesión' : mode === 'register' ? 'Crear Cuenta' : 'Enviar Enlace Mágico'
                        )}
                    </button>
                </form>

                <div className="auth-modal-footer">
                    {mode === 'login' ? (
                        <>
                            <p>¿No tenés cuenta? <button onClick={() => setMode('register')}>Registrate</button></p>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                <button onClick={() => setMode('magic')}>Ingresar sin contraseña (Magic Link)</button>
                            </p>
                        </>
                    ) : mode === 'register' ? (
                        <>
                            <p>¿Ya tenés cuenta? <button onClick={() => setMode('login')}>Iniciá sesión</button></p>
                            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem' }}>
                                <button onClick={() => setMode('magic')}>Ingresar sin contraseña (Magic Link)</button>
                            </p>
                        </>
                    ) : (
                        <p>Volver a <button onClick={() => setMode('login')}>Iniciar Sesión</button></p>
                    )}
                </div>
            </div>
        </div>
    );
};
