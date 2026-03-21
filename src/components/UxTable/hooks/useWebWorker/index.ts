import { useEffect, useRef, useCallback } from 'react';
import type { WorkerFallback, UseWebWorkerReturn } from './types';

/**
 * 用于管理和与 Web Worker 通信的 Hook，支持优雅降级到主线程
 * 
 * @template T 传递给 Worker 的消息（Payload）类型
 * @template R Worker 返回的结果类型
 * @param {() => Worker | null} workerScript 创建 Web Worker 实例的函数
 * @param {WorkerFallback<T, R>} fallback 当 Worker 不可用或被禁用时，在主线程执行的降级处理函数
 * @param {boolean} [isWorker=true] 是否启用 Web Worker
 * @returns {UseWebWorkerReturn<T, R>} 包含向 Worker 发送消息方法的对象
 */
export const useWebWorker = <T, R>(
    workerScript: () => Worker | null,
    fallback: WorkerFallback<T, R>,
    isWorker: boolean = true
): UseWebWorkerReturn<T, R> => {
    // 存储 Web Worker 实例
    const workerRef = useRef<Worker | null>(null);
    // 存储挂起的消息回调（使用消息 ID 映射 resolve/reject）
    const callbacksRef = useRef<Map<string, { resolve: (val: R) => void, reject: (err: unknown) => void }>>(new Map());

    useEffect(() => {
        // 如果未启用 Worker，确保清理现有实例
        if (!isWorker) {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
            return;
        }

        try {
            // 检查当前环境是否支持 Worker
            if (typeof window !== 'undefined' && window.Worker) {
                const worker = workerScript();
                if (worker) {
                    workerRef.current = worker;
                    // 监听 Worker 返回的消息
                    worker.onmessage = (e: MessageEvent) => {
                        const { id, result, error } = e.data;
                        const cb = callbacksRef.current.get(id);
                        if (cb) {
                            if (error) {
                                cb.reject(new Error(error));
                            } else {
                                cb.resolve(result);
                            }
                            // 处理完成后移除回调
                            callbacksRef.current.delete(id);
                        }
                    };
                }
            }
        } catch (e) {
            console.warn('Web Worker initialization failed, falling back to main thread.', e);
        }

        // 组件卸载时清理 Worker 实例
        return () => {
            if (workerRef.current) {
                workerRef.current.terminate();
                workerRef.current = null;
            }
        };
    }, [workerScript, isWorker]);

    /**
     * 发送消息给 Web Worker 进行处理
     * 如果 Worker 可用，则异步等待 Worker 返回结果
     * 否则调用降级函数在主线程处理
     * 
     * @param {T} payload 要发送的数据
     * @returns {Promise<R>} 处理结果的 Promise
     */
    const postMessage = useCallback(async (payload: T): Promise<R> => {
        if (isWorker && workerRef.current) {
            return new Promise((resolve, reject) => {
                // 生成唯一消息 ID，以便匹配 Worker 返回的结果
                const id = Math.random().toString(36).substring(2, 9);
                callbacksRef.current.set(id, { resolve, reject });
                workerRef.current!.postMessage({ id, payload });
            });
        } else {
            // 降级：在主线程同步或异步执行
            return await fallback(payload);
        }
    }, [fallback, isWorker]);

    return { postMessage };
};
