import { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { API_URL } from '../api';
import type { Product } from '../types';

interface PriceHistoryEntry {
    price: number;
    date: string;
    supermarketId: string;
}

interface MultiProductHistoryChartProps {
    products: Product[];
}

export function MultiProductHistoryChart({ products }: MultiProductHistoryChartProps) {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Array de colores predefinidos para los productos en la comparativa
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

    useEffect(() => {
        let mounted = true;

        const fetchAllHistories = async () => {
            setLoading(true);
            try {
                const groupedByDate: Record<string, any> = {};

                // Fetch concurrentemente el historial de todos los productos
                const requests = products.map(p => fetch(`${API_URL}/products/${p.id}/history`).then(r => {
                    if (!r.ok) throw new Error(`Error en producto ${p.id}`);
                    return r.json();
                }));

                const results: PriceHistoryEntry[][] = await Promise.all(requests);

                if (!mounted) return;

                // Para cada producto, encontramos su mejor precio por día
                products.forEach((product, idx) => {
                    const history = results[idx];
                    
                    // Agrupar por día para este producto específico
                    const minPricePerDay: Record<string, number> = {};
                    
                    for (const entry of history) {
                        const dateObj = new Date(entry.date);
                        const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
                        
                        if (!minPricePerDay[formattedDate] || entry.price < minPricePerDay[formattedDate]) {
                            minPricePerDay[formattedDate] = entry.price;
                        }
                    }

                    // Volcar al agrupador global
                    for (const [date, minPrice] of Object.entries(minPricePerDay)) {
                        if (!groupedByDate[date]) {
                            groupedByDate[date] = { date };
                        }
                        // Usamos un identificador único para la línea (ID del producto)
                        groupedByDate[date][`p_${product.id}`] = minPrice;
                    }
                });

                // Convertir a array (el backend suele enviar ordenado o las fechas se insertan cronológicamente)
                // Idealmente deberíamos ordenar por fecha real, pero Recharts puede manejar strings en XAxis.
                setData(Object.values(groupedByDate));

            } catch (err: any) {
                if (mounted) setError(err.message);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        if (products.length > 0) {
            fetchAllHistories();
        } else {
            setData([]);
            setLoading(false);
        }

        return () => { mounted = false; };
    }, [products]);

    if (loading) return <div className="p-8 text-center text-secondary/60 animate-pulse">Analizando comparativa de mercado...</div>;
    if (error) return <div className="p-8 text-center text-[var(--accent-red)]">❌ {error}</div>;
    if (data.length === 0) return <div className="p-8 text-center text-secondary">No hay suficientes registros históricos.</div>;

    return (
        <div className="w-full h-[300px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" opacity={0.5} />
                    <XAxis 
                        dataKey="date" 
                        stroke="var(--text-secondary)" 
                        tick={{ fill: 'var(--text-secondary)' }}
                    />
                    <YAxis 
                        stroke="var(--text-secondary)" 
                        tick={{ fill: 'var(--text-secondary)' }}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip 
                        contentStyle={{ 
                            backgroundColor: 'var(--paper-bg)', 
                            borderColor: 'var(--border-color)',
                            borderRadius: '8px',
                            color: 'var(--text-primary)'
                        }}
                        itemStyle={{ fontWeight: 'bold' }}
                        formatter={(value: any, name: any) => {
                            // Encontrar el nombre real del producto en base a la key `p_ID`
                            const pid = parseInt(String(name).replace('p_', ''));
                            const pName = products.find(p => p.id === pid)?.name || name;
                            return [`$${value}`, pName];
                        }}
                    />
                    <Legend 
                        formatter={(value) => {
                            const pid = parseInt(value.replace('p_', ''));
                            return products.find(p => p.id === pid)?.name || value;
                        }}
                    />
                    {products.map((product, idx) => (
                        <Line 
                            key={`p_${product.id}`} 
                            type="monotone" 
                            dataKey={`p_${product.id}`} 
                            name={`p_${product.id}`} // Se formatea en Legend y Tooltip
                            stroke={colors[idx % colors.length]} 
                            strokeWidth={2}
                            dot={{ fill: colors[idx % colors.length], r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
