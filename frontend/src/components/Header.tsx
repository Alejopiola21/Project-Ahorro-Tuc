import React from 'react';
import { TrendingDown, MapPin, ShoppingCart } from 'lucide-react';

interface Props {
    cartCount: number;
    onOpenCart: () => void;
}

export const Header: React.FC<Props> = ({ cartCount, onOpenCart }) => (
    <header className="navbar">
        <div className="navbar-container">
            <div className="logo-section">
                <div className="logo-icon"><TrendingDown size={28} /></div>
                <h1 className="logo-text">Ahorro <span className="accent-text">Tuc</span></h1>
            </div>
            <div className="header-actions">
                <button className="location-btn">
                    <MapPin size={18} />
                    <span>San Miguel de Tucumán</span>
                </button>
                <button className="cart-btn" onClick={onOpenCart}>
                    <ShoppingCart size={22} />
                    {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                </button>
            </div>
        </div>
    </header>
);
