import { useState, useEffect, useRef } from 'react';
import { api } from '../api';

interface CategoryResult {
    name: string;
    count: number;
}

interface Props {
    activeCategory: string;
    onSelect: (cat: string) => void;
}

export function CategoryNav({ activeCategory, onSelect }: Props) {
    const [categories, setCategories] = useState<CategoryResult[]>([]);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // Cargar categorías vivas del backend (1 cache-hit hour)
    useEffect(() => {
        api.get<CategoryResult[]>('/categories')
            .then(res => setCategories(res.data))
            .catch(e => console.error("Error cargando categorías:", e));
    }, []);

    if (categories.length === 0) return null;

    // SCSS Helper integrado con React Styles para no romper index.css global si no hace falta
    return (
        <div 
            style={{
                width: '100%',
                overflowX: 'auto',
                padding: '0.8rem 1rem',
                borderBottom: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-card)',
                whiteSpace: 'nowrap',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'none',   // Firefox
            }}
        >
            <div 
                ref={scrollContainerRef}
                style={{
                    display: 'flex',
                    gap: '0.6rem',
                    alignItems: 'center',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}
            >
                <button
                    onClick={() => onSelect('Todas')}
                    style={{
                        padding: '0.4rem 1rem',
                        borderRadius: '20px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: activeCategory === 'Todas' ? 'var(--primary-color)' : 'transparent',
                        color: activeCategory === 'Todas' ? 'white' : 'var(--text-primary)',
                        cursor: 'pointer',
                        fontWeight: '500',
                        transition: 'all 0.2s ease',
                    }}
                >
                    Todas
                </button>

                {categories.map(c => (
                    <button
                        key={c.name}
                        onClick={() => onSelect(c.name)}
                        style={{
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            border: '1px solid var(--border-color)',
                            backgroundColor: activeCategory === c.name ? 'var(--primary-color)' : 'transparent',
                            color: activeCategory === c.name ? 'white' : 'var(--text-primary)',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s ease',
                        }}
                        title={`${c.count} ítems`}
                    >
                        {c.name}
                    </button>
                ))}
            </div>
            
            <style>{`
                .category-nav-wrapper::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}
