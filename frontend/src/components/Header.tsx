import React, { useState, lazy, Suspense } from 'react';
import { TrendingDown, MapPin, ShoppingCart, Sun, Moon, LogIn, LogOut, UserCircle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { useAuthStore } from '../store/authStore';
import { toast } from 'sonner';

const AuthModal = lazy(() => import('./AuthModal').then(m => ({ default: m.AuthModal })));

interface Props {
    cartCount: number;
    onOpenCart: () => void;
}

export const Header: React.FC<Props> = ({ cartCount, onOpenCart }) => {
    const { isDark, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuthStore();
    const [authModalOpen, setAuthModalOpen] = useState(false);

    const handleLogout = () => {
        logout();
        toast.info('Sesión cerrada correctamente');
    };

    return (
        <>
            <header className="navbar" role="navigation" aria-label="Navegación principal">
                <div className="navbar-container">
                    <div className="logo-section">
                        <div className="logo-icon"><TrendingDown size={28} /></div>
                        <h1 className="logo-text">Ahorro <span className="accent-text">Tuc</span></h1>
                    </div>
                    <div className="header-actions">
                        <button className="theme-toggle-btn" onClick={toggleTheme} aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}>
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button className="location-btn" aria-label="Ubicación actual: San Miguel de Tucumán">
                            <MapPin size={18} />
                            <span>San Miguel de Tucumán</span>
                        </button>

                        {isAuthenticated && user ? (
                            <div className="auth-user-menu">
                                <span className="user-greeting" aria-label={`Sesión activa como ${user.email}`}>
                                    <UserCircle size={18} />
                                    <span className="user-name">{user.name || user.email}</span>
                                </span>
                                <button className="logout-btn" onClick={handleLogout} aria-label="Cerrar sesión">
                                    <LogOut size={18} />
                                </button>
                            </div>
                        ) : (
                            <button className="login-btn" onClick={() => setAuthModalOpen(true)} aria-label="Iniciar sesión">
                                <LogIn size={18} />
                                <span>Ingresar</span>
                            </button>
                        )}

                        <button className="cart-btn" onClick={onOpenCart} aria-label={`Abrir carrito (${cartCount} productos)`}>
                            <ShoppingCart size={22} />
                            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                        </button>
                    </div>
                </div>
            </header>

            <Suspense fallback={null}>
                <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
            </Suspense>
        </>
    );
};
