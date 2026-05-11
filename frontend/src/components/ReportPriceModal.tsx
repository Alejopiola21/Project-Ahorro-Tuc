import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import type { Product, Supermarket } from '../types';
import { useSupermarketStore } from '../store';

interface ReportPriceModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: Product | null;
}

export function ReportPriceModal({ isOpen, onClose, product }: ReportPriceModalProps) {
    const { getSupermarket } = useSupermarketStore();
    const [selectedSupermarketId, setSelectedSupermarketId] = useState<string>('');
    const [reportedPrice, setReportedPrice] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !product) return null;

    // Obtener los supermercados donde este producto tiene precio
    const availableSupermarkets = Object.keys(product.prices).map(id => getSupermarket(id)).filter(Boolean) as Supermarket[];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!selectedSupermarketId) {
            toast.error('Seleccioná un supermercado');
            return;
        }

        const priceNum = parseFloat(reportedPrice.replace(',', '.'));
        if (isNaN(priceNum) || priceNum <= 0) {
            toast.error('Ingresá un precio válido mayor a 0');
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post('/reports', {
                productId: product.id,
                supermarketId: selectedSupermarketId,
                reportedPrice: priceNum
            });
            toast.success('Reporte enviado correctamente. ¡Gracias por tu ayuda!');
            
            // Reset state
            setSelectedSupermarketId('');
            setReportedPrice('');
            onClose();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al enviar reporte');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-text">
                        <AlertTriangle className="w-5 h-5 text-orange-500" />
                        Reportar Precio
                    </h2>
                    <button onClick={onClose} className="p-2 text-text-muted hover:bg-background rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-background border border-border rounded-xl">
                        <img src={product.image} alt={product.name} className="w-12 h-12 object-contain" />
                        <div>
                            <p className="font-medium text-text text-sm line-clamp-2">{product.name}</p>
                            <p className="text-xs text-text-muted">{product.brand || product.category}</p>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-text">Supermercado donde viste el error</label>
                        <select 
                            className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                            value={selectedSupermarketId}
                            onChange={(e) => setSelectedSupermarketId(e.target.value)}
                        >
                            <option value="" disabled>Seleccioná una sucursal</option>
                            {availableSupermarkets.map(s => (
                                <option key={s.id} value={s.id}>{s.name} (Actual: ${product.prices[s.id].toLocaleString('es-AR')})</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold text-text">Precio real en góndola ($)</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="Ej: 1500.50"
                            value={reportedPrice}
                            onChange={(e) => setReportedPrice(e.target.value)}
                            className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm text-text focus:border-primary focus:outline-none"
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl mt-2 hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
                    </button>
                </form>
            </div>
        </div>
    );
}
