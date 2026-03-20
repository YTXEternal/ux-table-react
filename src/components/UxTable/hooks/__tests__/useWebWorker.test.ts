import { renderHook, act } from '@testing-library/react';
import { useWebWorker } from '../useWebWorker';

describe('useWebWorker', () => {
    it('should fallback to main thread if worker is null', async () => {
        const fallback = jest.fn().mockResolvedValue('fallback_result');
        const workerScript = () => null;

        const { result } = renderHook(() => useWebWorker(workerScript, fallback));

        let res;
        await act(async () => {
            res = await result.current.postMessage({ type: 'TEST' });
        });

        expect(fallback).toHaveBeenCalledWith({ type: 'TEST' });
        expect(res).toBe('fallback_result');
    });

    it('should fallback to main thread if window.Worker is not defined', async () => {
        const originalWorker = window.Worker;
        // @ts-ignore
        delete window.Worker;

        const fallback = jest.fn().mockResolvedValue('fallback_result');
        const workerScript = jest.fn();

        const { result } = renderHook(() => useWebWorker(workerScript, fallback));

        let res;
        await act(async () => {
            res = await result.current.postMessage({ type: 'TEST' });
        });

        expect(workerScript).not.toHaveBeenCalled();
        expect(fallback).toHaveBeenCalledWith({ type: 'TEST' });
        expect(res).toBe('fallback_result');

        // Restore Worker
        window.Worker = originalWorker;
    });
});