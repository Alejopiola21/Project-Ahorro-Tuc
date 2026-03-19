import React from 'react';
import { Award } from 'lucide-react';
import type { Product, Supermarket } from '../types';

interface Props {
    product: Product;
    getSup: (id: string) => Supermarket | undefined;
    getCheapest: (prices: Record<string, number>) => [string, number];
    onAddToCart: (p: Product) => void;
}

export const ProductCard: React.FC<Props> = ({ product, getSup, getCheapest, onAddToCart }) => {
    const [cheapestId, cheapestPrice] = getCheapest(product.prices);
    const cheapestSup = getSup(cheapestId);

    return (
        <div className="product-card">
            <div className="product-image-container">
                <img src={product.image} alt={product.name} loading="lazy" />
                <div className="badge-best-price"><Award size={14} /> Mejor Precio</div>
            </div>
            <div className="product-info">
                <span className="product-category">{product.category}</span>
                <h4 className="product-name">{product.name}</h4>
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
                                const s = getSup(id);
                                return (
                                    <div key={id} className="mini-price">
                                        <span style={{ color: s?.color }}>{s?.logo}:</span> ${(price as number).toLocaleString('es-AR')}
                                    </div>
                                );
                            })}
                    </div>
                </div>
                <button className="add-to-cart-btn" onClick={() => onAddToCart(product)}>
                    + Agregar a mi Lista
                </button>
            </div>
        </div>
    );
};
