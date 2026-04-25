import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useSupermarketStore } from '../store';

export const SupermarketsBar: React.FC = () => {
    const supermarkets = useSupermarketStore(state => state.supermarkets);
    const [isOpen, setIsOpen] = useState(false);

    if (supermarkets.length === 0) return null;

    return (
        <div className="supermarkets-wrapper">
            <button 
                className="supermarkets-toggle" 
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span>Ver Ofertas de {supermarkets.length} Supermercados</span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            <div className={`supermarkets-bar ${isOpen ? 'open' : ''}`} role="navigation" aria-label="Supermercados disponibles">
                {supermarkets.map(s => (
                    <div key={s.id} className="supermarket-chip" style={{ borderColor: s.color }} aria-label={s.name}>
                        <span className="chip-logo" style={{ backgroundColor: s.color }}>{s.logo}</span>
                        <span className="chip-name">{s.name}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
