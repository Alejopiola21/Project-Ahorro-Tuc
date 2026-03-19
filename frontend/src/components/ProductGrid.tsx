import React from 'react';
import { Loader2 } from 'lucide-react';
import { ProductCard } from './ProductCard';
import type { Product, Supermarket } from '../types';

interface Props {
    loading: boolean;
    products: Product[];
    debouncedQuery: string;
    getSup: (id: string) => Supermarket | undefined;
    getCheapest: (prices: Record<string, number>) => [string, number];
    onAddToCart: (p: Product) => void;
}

export const ProductGrid: React.FC<Props> = ({
    loading, products, debouncedQuery, getSup, getCheapest, onAddToCart
}) => {
    return (
        <main className="main-content">
            <div className="section-header">
                <h3>{debouncedQuery ? `Resultados para "${debouncedQuery}"` : 'Productos Destacados'}</h3>
                {!loading && <p>{products.length} productos encontrados</p>}
            </div>

            {loading ? (
                <div className="loader-container">
                    <Loader2 size={48} className="spinner" />
                    <p>Buscando los mejores precios...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="empty-state">
                    <p>No encontramos productos para <strong>"{debouncedQuery}"</strong>.</p>
                    <span>Probá con otro nombre o categoría.</span>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            getSup={getSup}
                            getCheapest={getCheapest}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </div>
            )}
        </main>
    );
};
