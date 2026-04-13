import React, { useEffect, useRef, useState } from 'react';
import { X, ShoppingCart, Trash2, TrendingDown, Award, ArrowRight, Plus, Minus, AlertTriangle, Split, Loader2, Share2, MessageCircle, Copy, Check, FileText } from 'lucide-react';
import { formatCartShareMessage, shareToWhatsApp, copyToClipboard } from '../utils/shareUtils';
import { generateCartPDF } from '../utils/pdfGenerator';
import type { CartTotals } from '../types';
import { useCartStore, useSupermarketStore } from '../store';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    cartTotals: CartTotals | null;
    isOptimizing: boolean;
}

export const CartSidebar: React.FC<Props> = ({ isOpen, onClose, cartTotals, isOptimizing }) => {
    const cart = useCartStore(state => state.cart);
    const removeFromCart = useCartStore(state => state.removeFromCart);
    const updateQuantity = useCartStore(state => state.updateQuantity);
    const clearCart = useCartStore(state => state.clearCart);
    const getSupermarket = useSupermarketStore(state => state.getSupermarket);

    const sidebarRef = useRef<HTMLElement>(null);
    const [optMode, setOptMode] = useState<'single' | 'hybrid'>('single');
    const [copied, setCopied] = useState(false);
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
        const winnerEl = sidebarRef.current?.querySelector('.total-row.winner, .hybrid-box');
        if (winnerEl) {
            winnerEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            winnerEl.classList.add('winner-highlight');
            setTimeout(() => winnerEl.classList.remove('winner-highlight'), 2000);
        }
    };

    const handleShareWhatsApp = () => {
        const message = formatCartShareMessage(cart, cartTotals, optMode);
        shareToWhatsApp(message);
    };

    const handleCopy = async () => {
        const message = formatCartShareMessage(cart, cartTotals, optMode);
        const success = await copyToClipboard(message);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleDownloadPDF = () => {
        const supermarkets = useSupermarketStore.getState().supermarkets;
        generateCartPDF({
            cart,
            cartTotals,
            optMode,
            supermarkets,
        }).catch(err => {
            console.error('Error generating PDF:', err);
            alert('No se pudo generar el PDF. Verificá que el navegador permita pop-ups.');
        });
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

                                {cartTotals && cartTotals.hybridOptimization && (
                                    <div className="flex gap-2 mb-4 bg-[var(--paper-bg)] p-1 rounded-lg">
                                        <button
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${optMode === 'single' ? 'bg-[var(--accent-color)] text-white' : 'text-secondary hover:bg-[var(--bg-color)]'}`}
                                            onClick={() => setOptMode('single')}
                                        >
                                            Un solo Súper
                                        </button>
                                        <button
                                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-all flex items-center justify-center gap-2 ${optMode === 'hybrid' ? 'bg-[#9b59b6] text-white' : 'text-secondary hover:bg-[var(--bg-color)]'}`}
                                            onClick={() => setOptMode('hybrid')}
                                        >
                                            <Split size={16} /> Carrito Híbrido
                                        </button>
                                    </div>
                                )}

                                {isOptimizing ? (
                                    <div className="totals-list">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="total-row skeleton" style={{ height: '58px', border: 'none', marginBottom: '8px' }}></div>
                                        ))}
                                    </div>
                                ) : (
                                    cartTotals && (
                                        <>
                                            {optMode === 'single' ? (
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
                                            ) : (
                                                cartTotals.hybridOptimization && (
                                                    <div className="hybrid-box border-2 border-[#9b59b6] rounded-[16px] p-4 bg-[rgba(155,89,182,0.05)]">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <span className="font-bold text-[#9b59b6] flex items-center gap-2"><Award size={18} /> Compra Dividida</span>
                                                            <span className="text-[20px] font-bold text-[var(--text-primary)]">
                                                                ${cartTotals.hybridOptimization.totalPrice.toLocaleString('es-AR')}
                                                            </span>
                                                        </div>
                                                        <div className="hybrid-share-compact">
                                                            <button
                                                                className="share-btn share-btn-whatsapp"
                                                                onClick={handleShareWhatsApp}
                                                            >
                                                                <MessageCircle size={14} /> WhatsApp
                                                            </button>
                                                            <button
                                                                className="share-btn share-btn-secondary"
                                                                onClick={handleCopy}
                                                            >
                                                                {copied ? <Check size={14} /> : <Copy size={14} />}
                                                                {copied ? 'Copiado' : 'Copiar'}
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col gap-3">
                                                            {cartTotals.hybridOptimization.supermarkets.map((supId) => {
                                                                const s = getSupermarket(supId);
                                                                const items = cartTotals.hybridOptimization!.splits[supId];
                                                                const partialTotal = items.reduce((acc, curr) => acc + curr.totalPrice, 0);
                                                                return (
                                                                    <div key={supId} className="bg-[var(--paper-bg)] p-3 rounded-lg border border-[var(--border-color)]">
                                                                        <div className="flex justify-between items-center mb-2">
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: s?.color }}></span>
                                                                                <span className="font-bold text-[var(--text-primary)]">{s?.name}</span>
                                                                            </div>
                                                                            <span className="font-bold text-secondary">${partialTotal.toLocaleString('es-AR')}</span>
                                                                        </div>
                                                                        <p className="text-[12px] text-secondary">
                                                                            Llevás {items.reduce((a, b) => a + b.quantity, 0)} productos acá (ej: {items.slice(0, 2).map(i => i.name.split(' ')[0]).join(', ')})
                                                                        </p>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )
                                            )}

                                            {cartTotals.incompleteSupermarkets && cartTotals.incompleteSupermarkets.length > 0 && optMode === 'single' && (
                                                <div className="incomplete-alert">
                                                    <AlertTriangle size={16} />
                                                    <span>
                                                        {cartTotals.incompleteSupermarkets.map(s => s.name).join(', ')} no
                                                        tiene{cartTotals.incompleteSupermarkets.length === 1 ? '' : 'n'} todos los productos.
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )
                                )}

                                {!isOptimizing && cartTotals && cartTotals.maxSavings > 0 && optMode === 'single' && (
                                    <div className="savings-alert">
                                        <TrendingDown size={20} />
                                        <span>¡Ahorrás <strong>${cartTotals.maxSavings.toLocaleString('es-AR')}</strong> comprando en el lugar ganador!</span>
                                    </div>
                                )}

                                {!isOptimizing && optMode === 'hybrid' && cartTotals?.hybridOptimization && (
                                    <div className="savings-alert !bg-purple-100 !text-purple-800 !border-purple-300 dark:!bg-[rgba(155,89,182,0.2)] dark:!text-purple-300">
                                        <TrendingDown size={20} />
                                        <span>¡Ahorro extremo! Retenés <strong>${cartTotals.hybridOptimization.savingsFromSingle.toLocaleString('es-AR')}</strong> extra separando la compra.</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="cart-footer">
                        <div className="share-actions">
                            <button
                                className="share-btn share-btn-whatsapp"
                                onClick={handleShareWhatsApp}
                            >
                                <MessageCircle size={18} /> WhatsApp
                            </button>
                            <button
                                className="share-btn share-btn-pdf"
                                onClick={handleDownloadPDF}
                                title="Descargar PDF"
                            >
                                <FileText size={18} /> PDF
                            </button>
                            <button
                                className="share-btn share-btn-secondary"
                                onClick={handleCopy}
                            >
                                {copied ? <Check size={18} /> : <Share2 size={18} />}
                                {copied ? 'Copiado' : 'Compartir'}
                            </button>
                        </div>
                        <button
                            className="checkout-btn"
                            onClick={handleOptimize}
                            disabled={isOptimizing}
                            style={isOptimizing ? { opacity: 0.8, cursor: 'not-allowed' } : {}}
                        >
                            {isOptimizing ? (
                                <>Calculando ahorros... <Loader2 size={20} className="spinner" /></>
                            ) : (
                                <>Optimizar compra <ArrowRight size={20} /></>
                            )}
                        </button>
                        <button className="clear-cart-btn" onClick={clearCart}>Vaciar lista</button>
                    </div>
                )}
            </aside>
        </>
    );
};
