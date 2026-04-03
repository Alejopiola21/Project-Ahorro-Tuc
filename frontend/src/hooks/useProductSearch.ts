import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Product } from '../types';

// Caché in-memory a nivel de módulo para búsquedas instantáneas
const localSearchCache = new Map<string, Product[]>();

export function useProductSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
        setLoading(false);
        return;
    }

    setLoading(true);
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (activeCategory !== 'Todas') params.category = activeCategory;

    api.get<Product[]>('/products', { params })
      .then(r => {
          setProducts(r.data);
          localSearchCache.set(cacheKey, r.data);
      })
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, [debouncedQuery, activeCategory]);

  return { 
    query, 
    setQuery, 
    debouncedQuery, 
    activeCategory, 
    setActiveCategory, 
    products, 
    loading 
  };
}
