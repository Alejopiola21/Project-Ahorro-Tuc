import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Product } from '../types';

// Caché in-memory a nivel de módulo para búsquedas instantáneas
const localSearchCache = new Map<string, Product[]>();

interface PaginatedResponse {
    products: Product[];
    nextCursor: number | null;
}

export function useProductSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);

  // Meticulous debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch logic abstracted from component
  useEffect(() => {
    const cacheKey = `${activeCategory}_${debouncedQuery}`;

    // Si existe en caché local, servir instantáneo (Sin layout stutters)
    if (localSearchCache.has(cacheKey)) {
        setProducts(localSearchCache.get(cacheKey)!);
        setNextCursor(null);
        setHasMore(false);
        setLoading(false);
        return;
    }

    setLoading(true);
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (activeCategory !== 'Todas') params.category = activeCategory;

    // Si hay búsqueda de texto, no paginamos (el backend ya limita a 50)
    // Si es listado por categoría, usamos paginación por cursor
    if (!debouncedQuery) {
        params.limit = '50';
    }

    api.get<PaginatedResponse>('/products', { params })
      .then(r => {
          const data = r.data;
          setProducts(data.products);
          setNextCursor(data.nextCursor);
          setHasMore(data.nextCursor !== null);
          localSearchCache.set(cacheKey, data.products);
      })
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, [debouncedQuery, activeCategory]);

  // Función para cargar la siguiente página
  const loadMore = async () => {
    if (!hasMore || nextCursor === null) return;

    const params: Record<string, string> = {
        cursor: String(nextCursor),
        limit: '50',
    };
    if (activeCategory !== 'Todas') params.category = activeCategory;

    try {
        const r = await api.get<PaginatedResponse>('/products', { params });
        const data = r.data;
        setProducts(prev => [...prev, ...data.products]);
        setNextCursor(data.nextCursor);
        setHasMore(data.nextCursor !== null);
    } catch (err) {
        console.error("Error loading more products:", err);
    }
  };

  return {
    query,
    setQuery,
    debouncedQuery,
    activeCategory,
    setActiveCategory,
    products,
    loading,
    hasMore,
    loadMore,
  };
}
