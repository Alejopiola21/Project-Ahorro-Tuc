import React from 'react';
import { useSupermarketStore } from '../store';

export const SupermarketsBar: React.FC = () => {
    const supermarkets = useSupermarketStore(state => state.supermarkets);

    if (supermarkets.length === 0) return null;

    return (
        <div className="supermarkets-bar" role="navigation" aria-label="Supermercados disponibles">
            {supermarkets.map(s => (
                <div key={s.id} className="supermarket-chip" style={{ borderColor: s.color }} aria-label={s.name}>
                    <span className="chip-logo" style={{ backgroundColor: s.color }}>{s.logo}</span>
                    <span className="chip-name">{s.name}</span>
                </div>
            ))}
        </div>
    );
};
