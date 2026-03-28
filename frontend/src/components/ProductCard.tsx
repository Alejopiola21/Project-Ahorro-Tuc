import React from 'react';
import { Award } from 'lucide-react';
import type { Product } from '../types';
import { useSupermarketStore, getCheapest } from '../store';

interface Props {
    product: Product;
    onAddToCart: (p: Product) => void;
}

export const ProductCard: React.FC<Props> = ({ product, onAddToCart }) => {
    const getSupermarket = useSupermarketStore(state => state.getSupermarket);
    const cheapest = getCheapest(product.prices);

    if (!cheapest) return null;

    const [cheapestId, cheapestPrice] = cheapest;
    const cheapestSup = getSupermarket(cheapestId);

    return (
        <div className="product-card">
            <div className="product-image-container">
                <img src={product.image} alt={`Imagen de ${product.name}`} loading="lazy" />
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
                            <div className="price-value">${cheapestPrice.toLocaleString('es-AR')}</div>
                        </div>
                    )}
                    <div className="other-prices">
                        {Object.entries(product.prices)
                            .filter(([id]) => id !== cheapestId)
                            .slice(0, 3)
                            .map(([id, price]) => {
                                const s = getSupermarket(id);
                                return (
                                    <div key={id} className="mini-price">
                                        <span style={{ color: s?.color }}>{s?.logo}:</span> ${(price as number).toLocaleString('es-AR')}
                                    </div>
                                );
                            })}
                    </div>
                </div>
                <button className="add-to-cart-btn" onClick={() => onAddToCart(product)} aria-label={`Agregar ${product.name} a la lista`}>
                    + Agregar a mi Lista
                </button>
            </div>
        </div>
    );
};
