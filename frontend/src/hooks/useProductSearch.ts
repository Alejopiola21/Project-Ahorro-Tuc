import { useState, useEffect } from 'react';
import { api } from '../api';
import type { Product } from '../types';

export function useProductSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
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
    const params = debouncedQuery ? { q: debouncedQuery } : {};

    api.get<Product[]>('/products', { params })
      .then(r => setProducts(r.data))
      .catch((err) => console.error("Error fetching products:", err))
      .finally(() => setLoading(false));
  }, [debouncedQuery]);

  return { query, setQuery, debouncedQuery, products, loading };
}
