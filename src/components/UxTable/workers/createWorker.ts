export const createTableWorker = () => {
    try {
        return new Worker(new URL('./tableWorker.ts', import.meta.url), { type: 'module' });
    } catch {
        return null;
    }
};