import { useState, lazy, Suspense, memo } from 'react';
import { Award, TrendingUp } from 'lucide-react';
import type { Product } from '../types';
import { useSupermarketStore, getCheapest } from '../store';

const ProductHistoryChart = lazy(() => import('./ProductHistoryChart').then(m => ({ default: m.ProductHistoryChart })));

interface Props {
    product: Product;
    onAddToCart: (p: Product) => void;
}

export const ProductCard = memo<Props>(({ product, onAddToCart }) => {
    const getSupermarket = useSupermarketStore(state => state.getSupermarket);
    const [showHistory, setShowHistory] = useState(false);
    const cheapest = getCheapest(product.prices);

    if (!cheapest) return null;

    const [cheapestId, cheapestPrice] = cheapest;
    const cheapestSup = getSupermarket(cheapestId);

    return (
        <div className="product-card">
            <div className="product-image-container">
                <img 
                    src={product.image} 
                    alt={`Imagen de ${product.name}`} 
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Sin+Imagen';
                    }}
                />
                <div className="badge-best-price"><Award size={14} /> Mejor Precio</div>
            </div>
            <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h4 className="product-name">{product.name}</h4>
                {product.brand && <span className="product-brand">{product.brand} {product.weight || ''}</span>}
                <div className="price-comparison">
                    {cheapestSup && (
                        <div className="best-price-box" style={{ borderColor: cheapestSup.color }}>
                            <div className="supermarket-tag" style={{ backgroundColor: cheapestSup.color }}>
                                {cheapestSup.name}
                            </div>
                            <div className="price-value">
                                ${cheapestPrice.toLocaleString('es-AR')}
                                {product.unitPrices[cheapestId] && (
                                    <span className="unit-price-tag">
                                        (${product.unitPrices[cheapestId]?.toLocaleString('es-AR')}/{product.unitType})
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="other-prices">
                        {Object.entries(product.prices)
                            .filter(([id]) => id !== cheapestId)
                            .slice(0, 3)
                            .map(([id, price]) => {
                                const s = getSupermarket(id);
                                const up = product.unitPrices[id];
                                return (
                                    <div key={id} className="mini-price">
                                        <div className="flex justify-between w-full">
                                            <span style={{ color: s?.color }}>{s?.logo}: ${(price as number).toLocaleString('es-AR')}</span>
                                            {up && <span className="text-[10px] opacity-60 ml-1">(${up.toLocaleString('es-AR')}/{product.unitType})</span>}
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>
                
                <div className="flex gap-2">
                    <button 
                        className="flex-1 py-3 bg-[var(--paper-bg)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-[12px] font-semibold text-[14px] flex items-center justify-center gap-2 hover:bg-[var(--bg-color)] transition-colors"
                        onClick={() => setShowHistory(!showHistory)}
                        aria-label={`Ver historial de ${product.name}`}
                    >
                        <TrendingUp size={16} /> Historial
                    </button>
                    <button 
                        className="flex-[2] add-to-cart-btn m-0" 
                        onClick={() => onAddToCart(product)} 
                        aria-label={`Agregar ${product.name} a la lista`}
                    >
                        + Agregar
                    </button>
                </div>
            </div>
            
            {showHistory && (
                <div className="w-full border-t border-[var(--border-color)] bg-[var(--bg-color)] p-4 rounded-b-[16px]">
                    <h5 className="text-[14px] font-bold text-[var(--text-primary)] mb-2">Evolución de precios (Última semana)</h5>
                    <Suspense fallback={<div className="p-8 text-center text-secondary/60 animate-pulse">Cargando gráfico...</div>}>
                        <ProductHistoryChart productId={product.id} />
                    </Suspense>
                </div>
            )}
        </div>
    );
});
