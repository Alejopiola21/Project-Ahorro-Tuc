import React from 'react';
import { TrendingDown, MapPin, ShoppingCart, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

interface Props {
    cartCount: number;
    onOpenCart: () => void;
}

export const Header: React.FC<Props> = ({ cartCount, onOpenCart }) => {
    const { isDark, toggleTheme } = useTheme();

    return (
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
                    <button className="cart-btn" onClick={onOpenCart} aria-label={`Abrir carrito (${cartCount} productos)`}>
                        <ShoppingCart size={22} />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </button>
                </div>
            </div>
        </header>
    );
};
