import React, { useState } from 'react';
import { X, Scale, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useComparisonStore } from '../store';
import { MultiProductHistoryChart } from './MultiProductHistoryChart';

export function ComparisonDrawer() {
    const { comparedProducts, toggleCompare, clearComparison } = useComparisonStore();
    const [isExpanded, setIsExpanded] = useState(false);

    if (comparedProducts.length === 0) {
        if (isExpanded) setIsExpanded(false);
        return null;
    }

    return (
        <div className={`fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-transform duration-300 ${isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-60px)]'}`}>
            {/* Header (Siempre visible si hay productos) */}
            <div 
                className="h-[60px] flex items-center justify-between px-4 sm:px-6 cursor-pointer hover:bg-background transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-primary/20 p-2 rounded-full">
                        <Scale className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text text-sm sm:text-base">Comparativa Activa</h3>
                        <p className="text-xs text-text-muted">{comparedProducts.length} producto{comparedProducts.length > 1 ? 's' : ''} seleccionado{comparedProducts.length > 1 ? 's' : ''} (Máx. 4)</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            clearComparison();
                        }}
                        className="text-xs text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors hidden sm:block"
                    >
                        Limpiar Todo
                    </button>
                    {isExpanded ? <ChevronDown className="w-6 h-6 text-text-muted" /> : <ChevronUp className="w-6 h-6 text-text-muted" />}
                </div>
            </div>

            {/* Contenido (Expandido) */}
            <div className="p-4 sm:px-6 pb-6 bg-surface max-h-[60vh] overflow-y-auto">
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Lista de productos */}
                    <div className="w-full lg:w-1/3 flex flex-col gap-2">
                        <h4 className="text-sm font-semibold text-text uppercase tracking-wider mb-2">Productos ({comparedProducts.length}/4)</h4>
                        {comparedProducts.map(p => (
                            <div key={p.id} className="flex items-center justify-between bg-background border border-border p-2 rounded-xl">
                                <div className="flex items-center gap-3 truncate">
                                    <img src={p.image} alt={p.name} className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                                    <div className="truncate">
                                        <p className="text-sm font-medium text-text truncate">{p.name}</p>
                                        <p className="text-xs text-text-muted truncate">{p.brand || p.category}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => toggleCompare(p)}
                                    className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors ml-2 flex-shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        <button 
                            onClick={() => clearComparison()}
                            className="mt-2 text-xs text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg transition-colors sm:hidden"
                        >
                            <Trash2 className="w-4 h-4 inline mr-1" /> Limpiar Todo
                        </button>
                    </div>

                    {/* Gráfico */}
                    <div className="w-full lg:w-2/3 border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                        <h4 className="text-sm font-semibold text-text uppercase tracking-wider mb-2">Evolución (Mejor Precio Diario)</h4>
                        {comparedProducts.length < 2 ? (
                            <div className="h-[300px] flex items-center justify-center border border-dashed border-border rounded-xl bg-background">
                                <p className="text-sm text-text-muted">Añade al menos otro producto para comparar.</p>
                            </div>
                        ) : (
                            <MultiProductHistoryChart products={comparedProducts} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
