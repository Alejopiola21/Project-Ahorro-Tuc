import React, { useState, useMemo, useEffect } from 'react';
import { Search, ShoppingCart, TrendingDown, MapPin, X, Award, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import './index.css';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// --- TYPES ---
interface Supermarket { id: string; name: string; color: string; logo: string; }
interface Product { id: number; name: string; category: string; image: string; prices: Record<string, number>; }

export default function App() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [supermarkets, setSupermarkets] = useState<Supermarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Debounce query
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch supermarkets once
  useEffect(() => {
    fetch(`${API}/api/supermarkets`)
      .then(r => r.json())
      .then(setSupermarkets)
      .catch(console.error);
  }, []);

  // Fetch products when debounced query changes
  useEffect(() => {
    setLoading(true);
    const url = debouncedQuery
      ? `${API}/api/products?q=${encodeURIComponent(debouncedQuery)}`
      : `${API}/api/products`;

    fetch(url)
      .then(r => r.json())
      .then(data => { setProducts(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [debouncedQuery]);

  // Cart totals
  const cartTotals = useMemo(() => {
    if (cart.length === 0 || supermarkets.length === 0) return null;
    const totals: Record<string, number> = {};
    supermarkets.forEach(s => totals[s.id] = 0);
    cart.forEach(item => {
      Object.entries(item.prices).forEach(([sup, price]) => {
        if (totals[sup] !== undefined) totals[sup] += price as number;
      });
    });
    const sortedTotals = Object.entries(totals).sort((a, b) => a[1] - b[1]);
    return {
      sortedTotals,
      maxSavings: sortedTotals[sortedTotals.length - 1][1] - sortedTotals[0][1]
    };
  }, [cart, supermarkets]);

  const getSup = (id: string) => supermarkets.find(s => s.id === id);

  const getCheapest = (prices: Record<string, number>) => {
    return Object.entries(prices).sort((a, b) => a[1] - b[1])[0];
  };

  const removeFromCart = (idx: number) => {
    setCart(c => c.filter((_, i) => i !== idx));
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="logo-section">
            <div className="logo-icon"><TrendingDown size={28} /></div>
            <h1 className="logo-text">Ahorro <span className="accent-text">Tuc</span></h1>
          </div>
          <div className="header-actions">
            <button className="location-btn">
              <MapPin size={18} />
              <span>San Miguel de Tucumán</span>
            </button>
            <button className="cart-btn" onClick={() => setIsCartOpen(true)}>
              <ShoppingCart size={22} />
              {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-shapes"></div>
        <div className="hero-content">
          <h2 className="hero-title">Encontrá el mejor precio en <span>Tucumán</span></h2>
          <p className="hero-subtitle">Comparamos Coto, Carrefour, Jumbo, Vea, Disco y Día al instante.</p>
          <div className="search-box">
            <Search className="search-icon" size={24} />
            <input
              type="text"
              placeholder="Buscá un producto… Yerba, Leche, Café..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
            />
            {query && <button className="clear-btn" onClick={() => setQuery('')}><X size={20} /></button>}
          </div>
        </div>
      </section>

      {/* SUPERMARKET LOGOS BAR */}
      {supermarkets.length > 0 && (
        <div className="supermarkets-bar">
          {supermarkets.map(s => (
            <div key={s.id} className="supermarket-chip" style={{ borderColor: s.color }}>
              <span className="chip-logo" style={{ backgroundColor: s.color }}>{s.logo}</span>
              <span className="chip-name">{s.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* PRODUCTS */}
      <main className="main-content">
        <div className="section-header">
          <h3>{debouncedQuery ? `Resultados para "${debouncedQuery}"` : 'Productos Destacados'}</h3>
          {!loading && <p>{products.length} productos encontrados</p>}
        </div>

        {loading ? (
          <div className="loader-container">
            <Loader2 size={48} className="spinner" />
            <p>Buscando los mejores precios...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-state">
            <p>No encontramos productos para <strong>"{debouncedQuery}"</strong>.</p>
            <span>Probá con otro nombre o categoría.</span>
          </div>
        ) : (
          <div className="products-grid">
            {products.map(product => {
              const [cheapestId, cheapestPrice] = getCheapest(product.prices);
              const cheapestSup = getSup(cheapestId);
              return (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    <img src={product.image} alt={product.name} loading="lazy" />
                    <div className="badge-best-price"><Award size={14} /> Mejor Precio</div>
                  </div>
                  <div className="product-info">
                    <span className="product-category">{product.category}</span>
                    <h4 className="product-name">{product.name}</h4>
                    <div className="price-comparison">
                      {cheapestSup && (
                        <div className="best-price-box" style={{ borderColor: cheapestSup.color }}>
                          <div className="supermarket-tag" style={{ backgroundColor: cheapestSup.color }}>
                            {cheapestSup.name}
                          </div>
                          <div className="price-value">${cheapestPrice.toLocaleString('es-AR')}</div>
                        </div>
                      )}
                      <div className="other-prices">
                        {Object.entries(product.prices)
                          .filter(([id]) => id !== cheapestId)
                          .slice(0, 3)
                          .map(([id, price]) => {
                            const s = getSup(id);
                            return (
                              <div key={id} className="mini-price">
                                <span style={{ color: s?.color }}>{s?.logo}:</span> ${(price as number).toLocaleString('es-AR')}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    <button className="add-to-cart-btn" onClick={() => setCart(c => [...c, product])}>
                      + Agregar a mi Lista
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* SIDEBAR CARRITO */}
      {isCartOpen && <div className="cart-overlay" onClick={() => setIsCartOpen(false)}></div>}
      <aside className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>🛒 Mi Lista Inteligente</h3>
          <button className="close-btn" onClick={() => setIsCartOpen(false)}><X size={24} /></button>
        </div>

        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <ShoppingCart size={48} className="empty-icon" />
              <p>Tu lista está vacía</p>
              <span>Agregá productos para ver dónde te conviene comprar toda la lista.</span>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="cart-item">
                    <img src={item.image} alt={item.name} />
                    <div className="cart-item-info">
                      <span className="item-name">{item.name}</span>
                      <span className="item-category">{item.category}</span>
                    </div>
                    <button className="remove-btn" onClick={() => removeFromCart(idx)}><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>

              <div className="cart-summary">
                <h4 className="summary-title">Comparativa Total</h4>
                <p className="summary-subtitle">{cart.length} productos en tu lista:</p>
                {cartTotals && (
                  <div className="totals-list">
                    {cartTotals.sortedTotals.map(([id, total], idx) => {
                      const s = getSup(id);
                      const isCheapest = idx === 0;
                      return (
                        <div key={id} className={`total-row ${isCheapest ? 'winner' : ''}`} style={isCheapest ? { borderColor: s?.color } : {}}>
                          <div className="supermarket-info">
                            <span className="dot" style={{ backgroundColor: s?.color }}></span>
                            <span className="sup-name">{s?.name}</span>
                            {isCheapest && <span className="winner-badge"><Award size={12} /> Ganador</span>}
                          </div>
                          <div className="total-price">${total.toLocaleString('es-AR')}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {cartTotals && cartTotals.maxSavings > 0 && (
                  <div className="savings-alert">
                    <TrendingDown size={20} />
                    <span>¡Ahorrás <strong>${cartTotals.maxSavings.toLocaleString('es-AR')}</strong> comprando en el lugar ganador!</span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-footer">
            <button className="checkout-btn">Optimizar compra <ArrowRight size={20} /></button>
            <button className="clear-cart-btn" onClick={() => setCart([])}>Vaciar lista</button>
          </div>
        )}
      </aside>
    </div>
  );
}
