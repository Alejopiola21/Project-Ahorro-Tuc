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
import { useSupermarketStore } from '../store';
import { API_URL } from '../api';

interface PriceHistoryEntry {
    price: number;
    date: string;
    supermarketId: string;
}

interface ChartDataPoint {
    date: string;
    [supermarketId: string]: any; // dynamic keys for prices
}

interface ProductHistoryChartProps {
    productId: number;
}

export function ProductHistoryChart({ productId }: ProductHistoryChartProps) {
    const [data, setData] = useState<ChartDataPoint[]>([]);
    const [supermarketsInChart, setSupermarketsInChart] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { getSupermarket } = useSupermarketStore();

    useEffect(() => {
        let mounted = true;

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_URL}/products/${productId}/history`);
                if (!res.ok) throw new Error('Error al cargar historial');
                const rawData: PriceHistoryEntry[] = await res.json();

                if (!mounted) return;

                // Pivot data by Date
                const groupedByDate: Record<string, ChartDataPoint> = {};
                const foundSupers = new Set<string>();

                for (const entry of rawData) {
                    const dateObj = new Date(entry.date);
                    const formattedDate = `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
                    const supId = entry.supermarketId;

                    foundSupers.add(supId);

                    if (!groupedByDate[formattedDate]) {
                        groupedByDate[formattedDate] = { date: formattedDate };
                    }
                    groupedByDate[formattedDate][supId] = entry.price;
                }

                // Array sorted implicitly if backend is ASC chronological
                setData(Object.values(groupedByDate));
                setSupermarketsInChart(Array.from(foundSupers));
            } catch (err: any) {
                if (mounted) setError(err.message);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchHistory();
        return () => { mounted = false; };
    }, [productId]);

    if (loading) return <div className="p-8 text-center text-secondary/60 animate-pulse">Analizando fluctuación de mercado...</div>;
    if (error) return <div className="p-8 text-center text-[var(--accent-red)]">❌ {error}</div>;
    if (data.length === 0) return <div className="p-8 text-center text-secondary">Aún no hay suficientes registros históricos para este producto.</div>;

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
                        formatter={(value: any) => [`$${value}`, '']}
                    />
                    <Legend />
                    {supermarketsInChart.map(supId => {
                        const sup = getSupermarket(supId);
                        const color = sup?.color || '#8884d8';
                        const name = sup?.name || supId.toUpperCase();
                        
                        return (
                            <Line 
                                key={supId} 
                                type="monotone" 
                                dataKey={supId} 
                                name={name}
                                stroke={color} 
                                strokeWidth={2}
                                dot={{ fill: color, r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        );
                    })}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
