import React, { useMemo } from 'react';
import { MapPin, Navigation, Loader2, AlertCircle, X, Store, ChevronDown } from 'lucide-react';
import { useGeolocation } from '../hooks/useGeolocation';
import { buildGeoAdjustedTotals, formatDistance } from '../utils/geoUtils';
import { useSupermarketStore } from '../store';
import type { CartTotals } from '../types';

interface Props {
    cartTotals: CartTotals;
}

export const GeoRankingPanel: React.FC<Props> = ({ cartTotals }) => {
    const { coords, status, error, request, reset } = useGeolocation();
    const getSupermarket = useSupermarketStore(state => state.getSupermarket);

    const geoTotals = useMemo(() => {
        if (!coords || cartTotals.sortedTotals.length === 0) return null;
        return buildGeoAdjustedTotals(
            cartTotals.sortedTotals,
            coords.latitude,
            coords.longitude,
        );
    }, [coords, cartTotals.sortedTotals]);

    return (
        <div className="geo-ranking-panel">
            <div className="geo-panel-header">
                <div className="geo-panel-title">
                    <MapPin size={16} className="geo-pin-icon" />
                    <span>Distancia a sucursales</span>
                </div>
                {status === 'success' && (
                    <button
                        className="geo-reset-btn"
                        onClick={reset}
                        title="Quitar ubicación"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {status === 'idle' && (
                <button className="geo-request-btn" onClick={request}>
                    <Navigation size={16} />
                    Ver distancia al súper más cercano
                </button>
            )}

            {status === 'loading' && (
                <div className="geo-status geo-status--loading">
                    <Loader2 size={16} className="spinner" />
                    <span>Obteniendo ubicación...</span>
                </div>
            )}

            {(status === 'denied' || status === 'unavailable' || status === 'error') && (
                <div className="geo-status geo-status--error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                    <button className="geo-retry-btn" onClick={request}>Reintentar</button>
                </div>
            )}

            {status === 'success' && geoTotals && (
                <div className="geo-results">
                    <p className="geo-results-caption">
                        Sucursal más cercana de cada cadena a tu posición actual:
                    </p>
                    <div className="geo-results-list">
                        {geoTotals.map((item, idx) => {
                            const s = getSupermarket(item.supermarketId);
                            const isFirst = idx === 0 && !item.noPhysicalStore;

                            return (
                                <div
                                    key={item.supermarketId}
                                    className={`geo-result-row ${isFirst ? 'geo-result-row--closest' : ''} ${item.noPhysicalStore ? 'geo-result-row--no-store' : ''}`}
                                >
                                    <div className="geo-result-sup">
                                        <span
                                            className="geo-dot"
                                            style={{ backgroundColor: s?.color }}
                                        />
                                        <span className="geo-sup-name">{s?.name}</span>
                                        {isFirst && (
                                            <span className="geo-closest-badge">
                                                <Navigation size={10} />
                                                Más cerca
                                            </span>
                                        )}
                                    </div>

                                    {item.noPhysicalStore ? (
                                        <div className="geo-no-store">
                                            <Store size={12} />
                                            <span>Sin local en Tucumán</span>
                                        </div>
                                    ) : item.nearestBranch && item.distanceKm !== null ? (
                                        <div className="geo-result-dist">
                                            <span className="geo-dist-km">
                                                {formatDistance(item.distanceKm)}
                                            </span>
                                            <span className="geo-branch-name" title={item.nearestBranch.address}>
                                                <ChevronDown size={10} />
                                                {item.nearestBranch.address.split(',')[0]}
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="geo-no-store">
                                            <Store size={12} />
                                            <span>Sin sucursal registrada</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <p className="geo-disclaimer">
                        Distancias aéreas. Sucursales verificadas a mayo 2026.
                    </p>
                </div>
            )}
        </div>
    );
};
