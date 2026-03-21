import React from 'react';
import { X, ShoppingCart, Trash2, TrendingDown, Award, ArrowRight } from 'lucide-react';
import type { Supermarket } from '../types';
import { useCartStore } from '../store';

interface CartTotals {
    sortedTotals: [string, number][];
    maxSavings: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cartTotals: CartTotals | null;
    getSup: (id: string) => Supermarket | undefined;
}

export const CartSidebar: React.FC<Props> = ({ isOpen, onClose, cartTotals, getSup }) => {
    const cart = useCartStore(state => state.cart);
    const removeFromCart = useCartStore(state => state.removeFromCart);
    const clearCart = useCartStore(state => state.clearCart);

    return (
        <>
            {isOpen && <div className="cart-overlay" onClick={onClose}></div>}
            <aside className={`cart-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="cart-header">
                    <h3>🛒 Mi Lista Inteligente</h3>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
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
                                {cart.map((item, idx) => (
                                    <div key={`${item.id}-${idx}`} className="cart-item">
                                        <img src={item.image} alt={item.name} />
                                        <div className="cart-item-info">
                                            <span className="item-name">{item.name}</span>
                                            <span className="item-category">{item.category}</span>
                                        </div>
                                        <button className="remove-btn" onClick={() => removeFromCart(idx)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="cart-summary">
                                <h4 className="summary-title">Comparativa Total</h4>
                                <p className="summary-subtitle">{cart.length} productos en tu lista:</p>
                                {cartTotals && (
                                    <div className="totals-list">
                                        {cartTotals.sortedTotals.map(([id, total], idx) => {
                                            const s = getSup(id);
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
                        <button className="checkout-btn">Optimizar compra <ArrowRight size={20} /></button>
                        <button className="clear-cart-btn" onClick={clearCart}>Vaciar lista</button>
                    </div>
                )}
            </aside>
        </>
    );
};
