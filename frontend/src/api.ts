import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from './store/authStore';

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 — token expired or invalid
        if (error.response?.status === 401) {
            const authStore = useAuthStore.getState();
            if (authStore.isAuthenticated) {
                authStore.logout();
                toast.error('Tu sesión expiró. Iniciá sesión nuevamente.', {
                    description: 'Por seguridad, tu token ha expirado.'
                });
            }
        } else if (error.response) {
            console.error('API Error:', error.response.data);
            toast.error(error.response.data.error || 'Ocurrió un error en el servidor', {
                description: 'Por favor, intenta de nuevo más tarde.'
            });
        } else if (error.request) {
            console.error('Network Error:', error.request);
            toast.error('Error de red', {
                description: 'No se pudo conectar con el servidor.'
            });
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);
