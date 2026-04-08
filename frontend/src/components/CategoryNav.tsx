import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Beef, Milk, CupSoda, Package, ShoppingBag, Carrot, SprayCan } from 'lucide-react';
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
    const [showLeftArrow, setShowLeftArrow] = useState(false);
    const [showRightArrow, setShowRightArrow] = useState(true);

    useEffect(() => {
        api.get<CategoryResult[]>('/categories')
            .then(res => setCategories(res.data))
            .catch(e => console.error("Error cargando categorías:", e));
    }, []);

    // Monitoreo del scroll para ocultar o mostrar las flechas de los extremos
    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        setShowLeftArrow(scrollLeft > 0);
        // Margen de 10px para evitar bugs de subpíxeles
        setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            handleScroll();
            container.addEventListener('scroll', handleScroll);
            window.addEventListener('resize', handleScroll);
            return () => {
                container.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleScroll);
            };
        }
    }, [categories]); // Re-calcular al cargar categorias

    const scrollByAmount = (amount: number) => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: amount, behavior: 'smooth' });
        }
    };

    // Helper para Mapear Iconos basado en nombres empíricos
    const getCategoryIcon = (categoryName: string) => {
        const name = categoryName.toLowerCase();
        if (name.includes('carne') || name.includes('pollo')) return <Beef size={16} />;
        if (name.includes('lácteos') || name.includes('queso')) return <Milk size={16} />;
        if (name.includes('bebida') || name.includes('gaseosa')) return <CupSoda size={16} />;
        if (name.includes('limpieza')) return <SprayCan size={16} />;
        if (name.includes('verdura') || name.includes('fruta')) return <Carrot size={16} />;
        if (name.includes('almacén') || name.includes('despensa')) return <Package size={16} />;
        return <ShoppingBag size={16} />; // Fallback Genérico
    };

    if (categories.length === 0) return null;

    return (
        <div className="category-nav-wrapper">
            {showLeftArrow && (
                <button 
                    className="category-arrow-btn left"
                    onClick={() => scrollByAmount(-200)}
                    aria-label="Desplazar a la izquierda"
                >
                    <ChevronLeft size={20} />
                </button>
            )}

            <div className="category-scroll-container" ref={scrollContainerRef}>
                <button
                    onClick={() => onSelect('Todas')}
                    className={`category-btn ${activeCategory === 'Todas' ? 'active' : ''}`}
                >
                    <LayoutGrid size={16} /> Todas
                </button>

                {categories.map(c => (
                    <button
                        key={c.name}
                        onClick={() => onSelect(c.name)}
                        className={`category-btn ${activeCategory === c.name ? 'active' : ''}`}
                        title={`${c.count} ítem(s)`}
                    >
                        {getCategoryIcon(c.name)} {c.name}
                    </button>
                ))}
            </div>

            {showRightArrow && categories.length > 4 && (
                <button 
                    className="category-arrow-btn right"
                    onClick={() => scrollByAmount(200)}
                    aria-label="Desplazar a la derecha"
                >
                    <ChevronRight size={20} />
                </button>
            )}
        </div>
    );
}
