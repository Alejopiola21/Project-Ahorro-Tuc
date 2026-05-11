import { useEffect, useState } from 'react';
import { X, Award, Star, TrendingDown, Layers, FileText, ShoppingCart, Loader2 } from 'lucide-react';
import { api } from '../api';
import { useAuthStore } from '../store/authStore';

interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface AnalyticsData {
    metrics: {
        totalLists: number;
        totalItemsSaved: number;
        projectedSavings: number;
        projectedMaxCost: number;
        projectedMinCost: number;
    };
    badges: Badge[];
}

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const IconMap: Record<string, React.FC<any>> = {
    Award, Star, TrendingDown, Layers, FileText, ShoppingCart
};

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const { user, logout } = useAuthStore();
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && user) {
            setLoading(true);
            api.get('/analytics/me')
                .then(res => setData(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoading(false));
        }
    }, [isOpen, user]);

    if (!isOpen || !user) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border bg-background">
                    <h2 className="text-xl font-bold text-text">Mi Perfil</h2>
                    <button onClick={onClose} className="p-2 text-text-muted hover:bg-surface rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-8 flex-1">
                    {/* User Info */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-text-muted uppercase tracking-wider font-semibold">Sesión Actual</p>
                            <h3 className="text-2xl font-bold text-text">{user.name || 'Usuario'}</h3>
                            <p className="text-text-muted">{user.email}</p>
                        </div>
                        <button 
                            onClick={() => { logout(); onClose(); }}
                            className="px-4 py-2 bg-red-500/10 text-red-500 font-semibold rounded-xl hover:bg-red-500/20 transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        </div>
                    ) : data ? (
                        <>
                            {/* Metrics */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
                                    <div className="flex items-center gap-2 mb-2 text-primary">
                                        <TrendingDown className="w-5 h-5" />
                                        <h4 className="font-semibold text-sm">Ahorro Histórico Proyectado</h4>
                                    </div>
                                    <p className="text-3xl font-bold text-text">${data.metrics.projectedSavings.toLocaleString('es-AR')}</p>
                                    <p className="text-xs text-text-muted mt-1">Basado en la compra óptima de tus listas guardadas vs el peor escenario.</p>
                                </div>
                                
                                <div className="grid grid-rows-2 gap-4">
                                    <div className="bg-background border border-border p-4 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-text-muted">Listas Guardadas</p>
                                            <p className="text-2xl font-bold text-text">{data.metrics.totalLists}</p>
                                        </div>
                                        <Layers className="w-8 h-8 text-secondary opacity-50" />
                                    </div>
                                    <div className="bg-background border border-border p-4 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-text-muted">Productos Registrados</p>
                                            <p className="text-2xl font-bold text-text">{data.metrics.totalItemsSaved}</p>
                                        </div>
                                        <ShoppingCart className="w-8 h-8 text-secondary opacity-50" />
                                    </div>
                                </div>
                            </div>

                            {/* Gamification / Badges */}
                            <div>
                                <h4 className="text-lg font-bold text-text mb-4">Insignias Obtenidas</h4>
                                {data.badges.length === 0 ? (
                                    <div className="text-center py-8 bg-background border border-dashed border-border rounded-2xl">
                                        <p className="text-text-muted text-sm">Guarda listas para comenzar a ganar insignias.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                        {data.badges.map(badge => {
                                            const IconComponent = IconMap[badge.icon] || Award;
                                            return (
                                                <div key={badge.id} className="bg-background border border-border p-4 rounded-xl flex items-start gap-3">
                                                    <div className="bg-primary/20 p-2 rounded-lg text-primary flex-shrink-0 mt-1">
                                                        <IconComponent className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text text-sm">{badge.name}</p>
                                                        <p className="text-xs text-text-muted mt-0.5 leading-tight">{badge.description}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 text-text-muted">No se pudieron cargar los datos.</div>
                    )}
                </div>
            </div>
        </div>
    );
}
