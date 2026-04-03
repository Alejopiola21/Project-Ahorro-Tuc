import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import UserAgent from 'user-agents';

// Retraso aleatorio para evitar bloqueos
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const randomSleep = async (min = 3000, max = 5000) => {
    const ms = Math.floor(Math.random() * (max - min + 1)) + min;
    console.log(`[Stealth] 🛡️ Durmiendo ${ms}ms para evadir firewall...`);
    await delay(ms);
};

export interface FetchOptions extends AxiosRequestConfig {
    retries?: number;
    delayMs?: number;
}

/**
 * Cliente HTTP robusto con rotación de User-Agent y reintentos automáticos
 */
export async function fetchWithRetry<T = any>(url: string, options: FetchOptions = {}): Promise<T> {
    const { retries = 3, delayMs = 1500, headers = {}, ...axiosOpts } = options;

    for (let i = 0; i < retries; i++) {
        try {
            // Generar un User-Agent humano aleatorio (desktop, windows/mac)
            const userAgent = new UserAgent({ deviceCategory: 'desktop' });
            
            const finalHeaders = {
                'User-Agent': userAgent.toString(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'es-AR,es;q=0.8,en-US;q=0.5,en;q=0.3',
                ...headers
            };

            const response: AxiosResponse<T> = await axios(url, {
                ...axiosOpts,
                headers: finalHeaders,
                timeout: 10000 // 10s max
            });

            return response.data;
        } catch (error: any) {
            const isLastAttempt = i === retries - 1;
            const status = error.response?.status;
            
            console.warn(`[Fetcher] Falló intento ${i + 1}/${retries} para ${url}. HTTP ${status || 'Network Error'}`);
            
            if (isLastAttempt) {
                console.error(`[Fetcher] Abortando petición a ${url} tras ${retries} intentos.`);
                throw error;
            }

            // Aumentar el retraso exponencialmente (backoff)
            const sleepTime = delayMs * Math.pow(2, i);
            console.log(`[Fetcher] Esperando ${sleepTime}ms antes de reintentar...`);
            await delay(sleepTime);
        }
    }
    throw new Error('Unreachable');
}
