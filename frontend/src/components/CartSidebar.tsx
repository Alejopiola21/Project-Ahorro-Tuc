import React, { useEffect, useRef } from 'react';
import { X, ShoppingCart, Trash2, TrendingDown, Award, ArrowRight, Plus, Minus, AlertTriangle } from 'lucide-react';
import type { CartTotals } from '../types';
import { useCartStore, useSupermarketStore } from '../store';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cartTotals: CartTotals | null;
}

export const CartSidebar: React.FC<Props> = ({ isOpen, onClose, cartTotals }) => {
    const cart = useCartStore(state => state.cart);
    const removeFromCart = useCartStore(state => state.removeFromCart);
    const updateQuantity = useCartStore(state => state.updateQuantity);
    const clearCart = useCartStore(state => state.clearCart);
    const getSupermarket = useSupermarketStore(state => state.getSupermarket);

    const sidebarRef = useRef<HTMLElement>(null);
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Cerrar con Escape (a11y)
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) onClose();
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    // Focus trap: al abrir, enfocar el sidebar
    useEffect(() => {
        if (isOpen && sidebarRef.current) {
            sidebarRef.current.focus();
        }
    }, [isOpen]);

    // Scroll al ganador al presionar "Optimizar compra"
    const handleOptimize = () => {
        const winnerEl = sidebarRef.current?.querySelector('.total-row.winner');
        if (winnerEl) {
            winnerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            winnerEl.classList.add('winner-highlight');
            setTimeout(() => winnerEl.classList.remove('winner-highlight'), 2000);
        }
    };

    return (
        <>
            {isOpen && <div className="cart-overlay" onClick={onClose}></div>}
            <aside
                ref={sidebarRef}
                className={`cart-sidebar ${isOpen ? 'open' : ''}`}
                role="complementary"
                aria-label="Carrito de compras"
                tabIndex={-1}
            >
                <div className="cart-header">
                    <h3>🛒 Mi Lista Inteligente</h3>
                    <button className="close-btn" onClick={onClose} aria-label="Cerrar carrito"><X size={24} /></button>
                </div>

                <div className="cart-body">
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <ShoppingCart size={48} className="empty-icon" />
                            <p>Tu lista está vacía</p>
                            <span>Agregá productos para ver dónde te conviene comprar toda la lista.</span>
                        </div>
                    ) : (
                        <>
                            <div className="cart-items">
                                {cart.map((item) => (
                                    <div key={item.product.id} className="cart-item">
                                        <img src={item.product.image} alt={item.product.name} />
                                        <div className="cart-item-info">
                                            <span className="item-name">{item.product.name}</span>
                                            <span className="item-category">{item.product.category}</span>
                                            <div className="quantity-controls">
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                    aria-label="Reducir cantidad"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="qty-value">{item.quantity}</span>
                                                <button
                                                    className="qty-btn"
                                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                    aria-label="Aumentar cantidad"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        <button className="remove-btn" onClick={() => removeFromCart(item.product.id)} aria-label={`Eliminar ${item.product.name}`}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-summary">
                                <h4 className="summary-title">Comparativa Total</h4>
                                <p className="summary-subtitle">{totalItems} producto{totalItems !== 1 ? 's' : ''} en tu lista:</p>
                                {cartTotals && (
                                    <>
                                        <div className="totals-list">
                                            {cartTotals.sortedTotals.map(([id, total], idx) => {
                                                const s = getSupermarket(id);
                                                const isCheapest = idx === 0;
                                                return (
                                                    <div key={id} className={`total-row ${isCheapest ? 'winner' : ''}`} style={isCheapest ? { borderColor: s?.color } : {}}>
                                                        <div className="supermarket-info">
                                                            <span className="dot" style={{ backgroundColor: s?.color }}></span>
                                                            <span className="sup-name">{s?.name}</span>
                                                            {isCheapest && <span className="winner-badge"><Award size={12} /> Ganador</span>}
                                                        </div>
                                                        <div className="total-price">${total.toLocaleString('es-AR')}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {cartTotals.incompleteSupermarkets && cartTotals.incompleteSupermarkets.length > 0 && (
                                            <div className="incomplete-alert">
                                                <AlertTriangle size={16} />
                                                <span>
                                                    {cartTotals.incompleteSupermarkets.map(s => s.name).join(', ')} no
                                                    tiene{cartTotals.incompleteSupermarkets.length === 1 ? '' : 'n'} todos los productos.
                                                </span>
                                            </div>
                                        )}
                                    </>
                                )}
                                {cartTotals && cartTotals.maxSavings > 0 && (
                                    <div className="savings-alert">
                                        <TrendingDown size={20} />
                                        <span>¡Ahorrás <strong>${cartTotals.maxSavings.toLocaleString('es-AR')}</strong> comprando en el lugar ganador!</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-footer">
                        <button className="checkout-btn" onClick={handleOptimize}>
                            Optimizar compra <ArrowRight size={20} />
                        </button>
                        <button className="clear-cart-btn" onClick={clearCart}>Vaciar lista</button>
                    </div>
                )}
            </aside>
        </>
    );
};
