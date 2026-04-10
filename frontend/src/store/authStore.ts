import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { api } from '../api';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (user: User, token: string) => void;
    logout: () => void;
    setUser: (user: User) => void;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: (user, token) => {
                set({ user, token, isAuthenticated: true });
                // Set default header for all subsequent requests
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
                delete api.defaults.headers.common['Authorization'];
            },

            setUser: (user) => set({ user }),

            checkAuth: async () => {
                const { token } = get();
                if (!token) {
                    set({ user: null, isAuthenticated: false });
                    return;
                }

                try {
                    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                    const response = await api.get('/auth/me');
                    set({ user: response.data.user, isAuthenticated: true });
                } catch {
                    // Token expired or invalid — clean up
                    set({ user: null, token: null, isAuthenticated: false });
                    delete api.defaults.headers.common['Authorization'];
                }
            },
        }),
        {
            name: 'ahorroTucAuth-zustand',
            // Restore Authorization header on rehydration
            onRehydrateStorage: () => (state) => {
                if (state?.token) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
                }
            },
        }
    )
);
