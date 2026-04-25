import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { fetchWithRetry } from './fetcher';

// Hacemos mock de axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('Fetcher Core Data Extractions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should resolve immediately if the first request is successful', async () => {
        const mockData = { id: 1, result: 'success' };
        mockedAxios.mockResolvedValueOnce({ data: mockData } as any);

        const data = await fetchWithRetry('http://example.com');
        expect(data).toEqual(mockData);
        expect(mockedAxios).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and resolve on the subsequent attempt', async () => {
        const mockData = { result: 'ok' };
        // Fails first time
        mockedAxios.mockRejectedValueOnce(new Error('Network Error'));
        // Succeeds second time
        mockedAxios.mockResolvedValueOnce({ data: mockData } as any);

        // We set a very low delayMs to speed up the test
        const data = await fetchWithRetry('http://example.com', { retries: 3, delayMs: 10 });
        
        expect(data).toEqual(mockData);
        expect(mockedAxios).toHaveBeenCalledTimes(2);
    });

    it('should throw an error if all retries fail', async () => {
        mockedAxios.mockRejectedValue(new Error('Internal Server Error'));

        await expect(fetchWithRetry('http://example.com', { retries: 2, delayMs: 10 }))
            .rejects
            .toThrow('Internal Server Error');

        expect(mockedAxios).toHaveBeenCalledTimes(2);
    });
});
