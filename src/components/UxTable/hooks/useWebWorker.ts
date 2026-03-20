import { useEffect, useRef, useCallback } from 'react';

type WorkerFallback<T, R> = (payload: T) => Promise<R>;

export const useWebWorker = <T, R>(
    workerScript: () => Worker | null,
    fallback: WorkerFallback<T, R>
) => {
    const workerRef = useRef<Worker | null>(null);
    const callbacksRef = useRef<Map<string, { resolve: (val: R) => void, reject: (err: unknown) => void }>>(new Map());

    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && window.Worker) {
                const worker = workerScript();
                if (worker) {
                    workerRef.current = worker;
                    worker.onmessage = (e: MessageEvent) => {
                        const { id, result, error } = e.data;
                        const cb = callbacksRef.current.get(id);
                        if (cb) {
                            if (error) {
                                cb.reject(new Error(error));
                            } else {
                                cb.resolve(result);
                            }
                            callbacksRef.current.delete(id);
                        }
                    };
                }
            }
        } catch (e) {
            console.warn('Web Worker initialization failed, falling back to main thread.', e);
        }

        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
            }
        };
    }, [workerScript]);

    const postMessage = useCallback((payload: T): Promise<R> => {
        if (workerRef.current) {
            return new Promise((resolve, reject) => {
                const id = Math.random().toString(36).substring(2, 9);
                callbacksRef.current.set(id, { resolve, reject });
                workerRef.current!.postMessage({ id, payload });
            });
        } else {
            // Fallback to synchronous/async execution in main thread
            return fallback(payload);
        }
    }, [fallback]);

    return { postMessage };
};