import { processCopy, processPasteParse } from './workerLogic';

self.onmessage = (e: MessageEvent) => {
    const { id, payload } = e.data;
    const { type, data } = payload;

    try {
        if (type === 'COPY') {
            const result = processCopy(data.selectedData, data.columns);
            self.postMessage({ id, result });
        } else if (type === 'PASTE_PARSE') {
            const result = processPasteParse(data.text);
            self.postMessage({ id, result });
        } else {
            self.postMessage({ id, error: 'Unknown task type' });
        }
    } catch (err) {
        self.postMessage({ id, error: err instanceof Error ? err.message : String(err) });
    }
};