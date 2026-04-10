import React from 'react';
import { SearchX, Sparkles, Filter } from 'lucide-react';

interface Props {
    query: string;
    category?: string;
}

export const EmptyState: React.FC<Props> = ({ query, category }) => {
    return (
        <div className="empty-state" role="status" aria-live="polite">
            <div className="empty-state-icon">
                <SearchX size={48} />
            </div>
            <h3 className="empty-state-title">
                No encontramos productos {query && <span>para "<strong>{query}</strong>"</span>}
            </h3>
            <p className="empty-state-description">
                {query
                    ? 'No hubo resultados con ese término de búsqueda.'
                    : 'No hay productos disponibles en esta categoría.'}
            </p>
            <div className="empty-state-suggestions">
                <div className="suggestion-item">
                    <Sparkles size={16} />
                    <span>Verificá la ortografía del producto</span>
                </div>
                <div className="suggestion-item">
                    <Filter size={16} />
                    {category && category !== 'Todas' ? (
                        <span>Probá cambiando la categoría "<strong>{category}</strong>"</span>
                    ) : (
                        <span>Explorá otra categoría de productos</span>
                    )}
                </div>
            </div>
        </div>
    );
};
