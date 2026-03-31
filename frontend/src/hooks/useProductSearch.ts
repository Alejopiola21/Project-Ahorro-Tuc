import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Product } from '../types';

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
    setLoading(true);
    const params: Record<string, string> = {};
    if (debouncedQuery) params.q = debouncedQuery;
    if (activeCategory !== 'Todas') params.category = activeCategory;

    api.get<Product[]>('/products', { params })
      .then(r => setProducts(r.data))
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
