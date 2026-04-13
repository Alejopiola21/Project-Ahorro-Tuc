import React, { useState, useEffect } from 'react';
import { api } from '../api';
import type { SearchFilters } from '../hooks/useProductSearch';

interface FilterBarProps {
    filters: SearchFilters;
    onFilterChange: (filters: SearchFilters) => void;
    onClearCache: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onClearCache }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [brands, setBrands] = useState<string[]>([]);
    const [loadingBrands, setLoadingBrands] = useState(false);

    // Cargar marcas al montar
    useEffect(() => {
        const fetchBrands = async () => {
            setLoadingBrands(true);
            try {
                const res = await api.get<string[]>('/brands');
                setBrands(res.data);
            } catch (err) {
                console.error('Error fetching brands:', err);
            } finally {
                setLoadingBrands(false);
            }
        };
        fetchBrands();
    }, []);

    const handleBrandToggle = (brand: string) => {
        const currentBrands = filters.brands || [];
        const newBrands = currentBrands.includes(brand)
            ? currentBrands.filter(b => b !== brand)
            : [...currentBrands, brand];
        
        onClearCache();
        onFilterChange({
            ...filters,
            brands: newBrands.length > 0 ? newBrands : undefined,
        });
    };

    const handlePriceRangeChange = (type: 'min' | 'max', value: string) => {
        const numValue = value ? parseFloat(value) : undefined;
        onClearCache();
        onFilterChange({
            ...filters,
            [type === 'min' ? 'minPrice' : 'maxPrice']: numValue,
        });
    };

    const handleInStockChange = (checked: boolean) => {
        onClearCache();
        onFilterChange({
            ...filters,
            inStock: checked || undefined,
        });
    };

    const handleSortChange = (sortBy: SearchFilters['sortBy']) => {
        onClearCache();
        onFilterChange({
            ...filters,
            sortBy: sortBy,
        });
    };

    const clearAllFilters = () => {
        onClearCache();
        onFilterChange({});
    };

    const hasActiveFilters = (filters.brands && filters.brands.length > 0) || 
                            filters.minPrice || 
                            filters.maxPrice || 
                            filters.inStock || 
                            filters.sortBy;

    return (
        <div className="filter-bar">
            <button 
                className="filter-toggle-btn"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-label="Filtros de búsqueda"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filtros
                {hasActiveFilters && <span className="filter-badge" />}
            </button>

            {isOpen && (
                <div className="filter-panel" role="dialog" aria-label="Panel de filtros">
                    <div className="filter-section">
                        <h4>Ordenar por</h4>
                        <div className="filter-options">
                            <button 
                                className={`filter-option ${!filters.sortBy ? 'active' : ''}`}
                                onClick={() => handleSortChange(undefined)}
                            >
                                Relevancia
                            </button>
                            <button 
                                className={`filter-option ${filters.sortBy === 'price_asc' ? 'active' : ''}`}
                                onClick={() => handleSortChange('price_asc')}
                            >
                                Menor precio
                            </button>
                            <button 
                                className={`filter-option ${filters.sortBy === 'price_desc' ? 'active' : ''}`}
                                onClick={() => handleSortChange('price_desc')}
                            >
                                Mayor precio
                            </button>
                            <button 
                                className={`filter-option ${filters.sortBy === 'name_asc' ? 'active' : ''}`}
                                onClick={() => handleSortChange('name_asc')}
                            >
                                A-Z
                            </button>
                            <button 
                                className={`filter-option ${filters.sortBy === 'brand_asc' ? 'active' : ''}`}
                                onClick={() => handleSortChange('brand_asc')}
                            >
                                Marca A-Z
                            </button>
                        </div>
                    </div>

                    <div className="filter-section">
                        <h4>Rango de precio</h4>
                        <div className="price-range">
                            <input
                                type="number"
                                placeholder="Mín"
                                value={filters.minPrice || ''}
                                onChange={(e) => handlePriceRangeChange('min', e.target.value)}
                                min="0"
                                aria-label="Precio mínimo"
                            />
                            <span>—</span>
                            <input
                                type="number"
                                placeholder="Máx"
                                value={filters.maxPrice || ''}
                                onChange={(e) => handlePriceRangeChange('max', e.target.value)}
                                min="0"
                                aria-label="Precio máximo"
                            />
                        </div>
                    </div>

                    <div className="filter-section">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={filters.inStock || false}
                                onChange={(e) => handleInStockChange(e.target.checked)}
                            />
                            Solo con stock
                        </label>
                    </div>

                    <div className="filter-section">
                        <h4>Marcas</h4>
                        {loadingBrands ? (
                            <div className="skeleton skeleton-text-sm" style={{ width: '100%', height: '20px' }} />
                        ) : (
                            <div className="brand-grid">
                                {brands.map(brand => (
                                    <label key={brand} className="checkbox-label">
                                        <input
                                            type="checkbox"
                                            checked={(filters.brands || []).includes(brand)}
                                            onChange={() => handleBrandToggle(brand)}
                                        />
                                        {brand}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <button className="clear-filters-btn" onClick={clearAllFilters}>
                            Limpiar filtros
                        </button>
                    )}
                </div>
            )}

            <style>{`
                .filter-bar {
                    position: relative;
                    margin: 1rem 0;
                }

                .filter-toggle-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.6rem 1rem;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 8px;
                    color: var(--text);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }

                .filter-toggle-btn:hover {
                    background: var(--surface-hover);
                    border-color: var(--accent);
                }

                .filter-badge {
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 8px;
                    height: 8px;
                    background: var(--accent);
                    border-radius: 50%;
                }

                .filter-panel {
                    position: absolute;
                    top: calc(100% + 0.5rem);
                    left: 0;
                    z-index: 100;
                    background: var(--surface);
                    border: 1px solid var(--border);
                    border-radius: 12px;
                    padding: 1.5rem;
                    min-width: 300px;
                    max-width: 400px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
                    max-height: 70vh;
                    overflow-y: auto;
                }

                .filter-section {
                    margin-bottom: 1.5rem;
                }

                .filter-section:last-child {
                    margin-bottom: 0;
                }

                .filter-section h4 {
                    margin: 0 0 0.75rem;
                    font-size: 0.85rem;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: var(--text-secondary);
                }

                .filter-options {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }

                .filter-option {
                    padding: 0.4rem 0.8rem;
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    color: var(--text);
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .filter-option:hover {
                    border-color: var(--accent);
                }

                .filter-option.active {
                    background: var(--accent);
                    color: white;
                    border-color: var(--accent);
                }

                .price-range {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .price-range input {
                    flex: 1;
                    padding: 0.5rem;
                    background: var(--surface-secondary);
                    border: 1px solid var(--border);
                    border-radius: 6px;
                    color: var(--text);
                    font-size: 0.9rem;
                }

                .price-range input:focus {
                    outline: none;
                    border-color: var(--accent);
                }

                .price-range span {
                    color: var(--text-secondary);
                }

                .checkbox-label {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.9rem;
                    cursor: pointer;
                    color: var(--text);
                }

                .checkbox-label input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    cursor: pointer;
                    accent-color: var(--accent);
                }

                .brand-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.5rem;
                    max-height: 200px;
                    overflow-y: auto;
                }

                .clear-filters-btn {
                    width: 100%;
                    padding: 0.7rem;
                    background: transparent;
                    border: 1px dashed var(--border);
                    border-radius: 6px;
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .clear-filters-btn:hover {
                    border-color: var(--accent);
                    color: var(--accent);
                }

                @media (max-width: 768px) {
                    .filter-panel {
                        position: fixed;
                        top: auto;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        max-width: 100%;
                        border-radius: 16px 16px 0 0;
                        max-height: 80vh;
                    }
                }
            `}</style>
        </div>
    );
};
