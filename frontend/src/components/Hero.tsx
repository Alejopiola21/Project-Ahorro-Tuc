import React from 'react';
import { Search, X } from 'lucide-react';

interface Props {
    query: string;
    setQuery: (q: string) => void;
}

export const Hero: React.FC<Props> = ({ query, setQuery }) => (
    <section className="hero">
        <div className="hero-bg-shapes"></div>
        <div className="hero-content">
            <h2 className="hero-title">Encontrá el mejor precio en <span>Tucumán</span></h2>
            <p className="hero-subtitle">Comparamos Coto, Carrefour, Jumbo, Vea, Disco y Día al instante.</p>
            <div className="search-box">
                <Search className="search-icon" size={24} />
                <input
                    type="text"
                    placeholder="Buscá un producto… Yerba, Leche, Café..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                />
                {query && <button className="clear-btn" onClick={() => setQuery('')}><X size={20} /></button>}
            </div>
        </div>
    </section>
);
