import React from 'react';
import { ProductCard } from './ProductCard';
import { EmptyState } from './EmptyState';
import { FilterBar } from './FilterBar';
import type { Product } from '../types';
import type { SearchFilters } from '../hooks/useProductSearch';

interface Props {
    loading: boolean;
    products: Product[];
    debouncedQuery: string;
    filters: SearchFilters;
    onFilterChange: (filters: SearchFilters) => void;
    onClearCache: () => void;
    onAddToCart: (p: Product) => void;
    hasMore: boolean;
    loadMore: () => void;
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
    loading, products, debouncedQuery, filters, onFilterChange, onClearCache, onAddToCart, hasMore, loadMore
}) => {
    return (
        <main className="main-content" role="main">
            <div className="section-header">
                <h3>{debouncedQuery ? `Resultados para "${debouncedQuery}"` : 'Productos Destacados'}</h3>
                {!loading && <p>{products.length} productos encontrados</p>}
            </div>

            <FilterBar
                filters={filters}
                onFilterChange={onFilterChange}
                onClearCache={onClearCache}
            />

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="products-grid">
                        {products.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onAddToCart={onAddToCart}
                            />
                        ))}
                    </div>
                    {hasMore && (
                        <div style={{ textAlign: 'center', margin: '2rem 0' }}>
                            <button 
                                className="checkout-btn" 
                                onClick={loadMore} 
                                disabled={loading}
                                style={{ width: 'auto', padding: '1rem 3rem' }}
                            >
                                {loading ? 'Cargando...' : 'Cargar más productos'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </main>
    );
};
