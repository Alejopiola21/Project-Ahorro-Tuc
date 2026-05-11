import { useState, useEffect } from 'react';
import { Save, Trash2, DownloadCloud, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../api';
import type { UserList } from '../types';
import { useCartStore } from '../store';
import { useAuthStore } from '../store/authStore';

interface SavedListsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SavedListsModal({ isOpen, onClose }: SavedListsModalProps) {
    const [lists, setLists] = useState<UserList[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newListName, setNewListName] = useState('');
    
    const { user } = useAuthStore();
    const cart = useCartStore(state => state.cart);
    const mergeWithCart = useCartStore(state => state.mergeWithCart);

    useEffect(() => {
        if (isOpen && user) {
            fetchLists();
        }
    }, [isOpen, user]);

    const fetchLists = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/lists');
            setLists(res.data);
        } catch (error: any) {
            toast.error('Error al cargar listas guardadas');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveCurrentCart = async () => {
        if (cart.length === 0) {
            toast.error('El carrito está vacío');
            return;
        }
        if (!newListName.trim()) {
            toast.error('Ingresa un nombre para la lista');
            return;
        }
        if (lists.length >= 3) {
            toast.error('Límite de 3 listas alcanzado. Elimina una para guardar otra.');
            return;
        }

        setIsSaving(true);
        try {
            const payload = {
                name: newListName.trim(),
                items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity
                }))
            };
            await api.post('/lists', payload);
            toast.success('Lista guardada en la nube');
            setNewListName('');
            fetchLists();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Error al guardar lista');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteList = async (id: number) => {
        try {
            await api.delete(`/lists/${id}`);
            toast.success('Lista eliminada');
            setLists(lists.filter(l => l.id !== id));
        } catch (error: any) {
            toast.error('Error al eliminar lista');
        }
    };

    const handleLoadList = (list: UserList) => {
        const items = list.items.map(item => ({
            product: item.product,
            quantity: item.quantity
        }));
        mergeWithCart(items);
        toast.success(`Lista "${list.name}" agregada al carrito`);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface border border-border w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-xl font-bold flex items-center gap-2 text-text">
                        <DownloadCloud className="w-5 h-5 text-primary" />
                        Mis Listas (Nube)
                    </h2>
                    <button onClick={onClose} className="p-2 text-text-muted hover:bg-background rounded-full transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-6">
                    {/* Guardar nueva lista */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-text uppercase tracking-wider">Guardar Carrito Actual</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Ej: Compras del mes"
                                value={newListName}
                                onChange={(e) => setNewListName(e.target.value)}
                                className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-primary text-text"
                            />
                            <button
                                onClick={handleSaveCurrentCart}
                                disabled={isSaving || cart.length === 0 || lists.length >= 3}
                                className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? '...' : 'Guardar'}
                            </button>
                        </div>
                        {lists.length >= 3 && (
                            <p className="text-xs text-red-500">Límite de 3 listas alcanzado.</p>
                        )}
                        {cart.length === 0 && (
                            <p className="text-xs text-text-muted">Agrega productos al carrito para guardar.</p>
                        )}
                    </div>

                    {/* Listas guardadas */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-text uppercase tracking-wider">Listas Guardadas ({lists.length}/3)</h3>
                        {isLoading ? (
                            <div className="text-center py-4 text-text-muted text-sm">Cargando...</div>
                        ) : lists.length === 0 ? (
                            <div className="text-center py-8 bg-background rounded-xl border border-border border-dashed">
                                <DownloadCloud className="w-8 h-8 text-text-muted mx-auto mb-2 opacity-50" />
                                <p className="text-sm text-text-muted">No tienes listas guardadas.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {lists.map((list) => (
                                    <div key={list.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-background border border-border rounded-xl gap-3">
                                        <div>
                                            <p className="font-medium text-text text-sm">{list.name}</p>
                                            <p className="text-xs text-text-muted">{list.items.length} productos • {new Date(list.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button
                                                onClick={() => handleLoadList(list)}
                                                className="text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Cargar (Merge)
                                            </button>
                                            <button
                                                onClick={() => handleDeleteList(list.id)}
                                                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Eliminar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
