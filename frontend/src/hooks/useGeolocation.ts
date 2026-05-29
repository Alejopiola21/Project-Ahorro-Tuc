import { useState, useCallback } from 'react';

export type GeolocationStatus = 'idle' | 'loading' | 'success' | 'denied' | 'unavailable' | 'error';

export interface UseGeolocationReturn {
    coords: GeolocationCoordinates | null;
    status: GeolocationStatus;
    error: string | null;
    request: () => void;
    reset: () => void;
}

/**
 * Hook que encapsula la Geolocation API del browser.
 * No solicita permiso hasta que se llama explícitamente a `request()`.
 */
export function useGeolocation(): UseGeolocationReturn {
    const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
    const [status, setStatus] = useState<GeolocationStatus>('idle');
    const [error, setError] = useState<string | null>(null);

    const request = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus('unavailable');
            setError('Tu navegador no soporta geolocalización.');
            return;
        }

        setStatus('loading');
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords(position.coords);
                setStatus('success');
                setError(null);
            },
            (err) => {
                if (err.code === err.PERMISSION_DENIED) {
                    setStatus('denied');
                    setError('Permiso de ubicación denegado. Habilitalo en la configuración del navegador.');
                } else if (err.code === err.POSITION_UNAVAILABLE) {
                    setStatus('unavailable');
                    setError('No se pudo determinar tu ubicación.');
                } else {
                    setStatus('error');
                    setError('Tiempo de espera agotado al obtener la ubicación.');
                }
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maximumAge: 5 * 60 * 1000, // 5 minutos de cache
            },
        );
    }, []);

    const reset = useCallback(() => {
        setCoords(null);
        setStatus('idle');
        setError(null);
    }, []);

    return { coords, status, error, request, reset };
}
