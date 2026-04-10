import React from 'react';
import { ProductCard } from './ProductCard';
import { EmptyState } from './EmptyState';
import type { Product } from '../types';

interface Props {
    loading: boolean;
    products: Product[];
    debouncedQuery: string;
    onAddToCart: (p: Product) => void;
}

const ProductSkeleton = () => (
    <div className="skeleton-card">
        <div className="skeleton img-skeleton skeleton-img"></div>
        <div className="skeleton-content">
            <div className="skeleton skeleton-text-sm"></div>
            <div className="skeleton skeleton-text-md"></div>
            <div className="skeleton skeleton-box"></div>
            <div className="skeleton skeleton-btn"></div>
        </div>
    </div>
);

export const ProductGrid: React.FC<Props> = ({
    loading, products, debouncedQuery, onAddToCart
}) => {
    return (
        <main className="main-content" role="main">
            <div className="section-header">
                <h3>{debouncedQuery ? `Resultados para "${debouncedQuery}"` : 'Productos Destacados'}</h3>
                {!loading && <p>{products.length} productos encontrados</p>}
            </div>

            {loading ? (
                <div className="products-grid" aria-busy="true">
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                        <ProductSkeleton key={n} />
                    ))}
                </div>
            ) : products.length === 0 && debouncedQuery ? (
                <EmptyState query={debouncedQuery} />
            ) : products.length === 0 ? (
                <div className="empty-state" role="status" aria-live="polite">
                    <p>No hay productos disponibles.</p>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={onAddToCart}
                        />
                    ))}
                </div>
            )}
        </main>
    );
};
