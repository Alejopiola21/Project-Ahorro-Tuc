import React from 'react';
import type { Supermarket } from '../types';

interface Props {
    supermarkets: Supermarket[];
}

export const SupermarketsBar: React.FC<Props> = ({ supermarkets }) => {
    if (supermarkets.length === 0) return null;

    return (
        <div className="supermarkets-bar">
            {supermarkets.map(s => (
                <div key={s.id} className="supermarket-chip" style={{ borderColor: s.color }}>
                    <span className="chip-logo" style={{ backgroundColor: s.color }}>{s.logo}</span>
                    <span className="chip-name">{s.name}</span>
                </div>
            ))}
        </div>
    );
};
