import { useEffect, useRef } from 'react';

export interface UseAutoScrollOptions {
    scrollContainerRef: React.RefObject<HTMLElement | null>;
    isSelecting: React.MutableRefObject<boolean>;
    thresholdPercentage: number;
    onScrollEdge?: (clientX: number, clientY: number) => void;
}

export const useAutoScroll = ({
    scrollContainerRef,
    isSelecting,
    thresholdPercentage,
    onScrollEdge
}: UseAutoScrollOptions) => {
    const mousePosRef = useRef<{ x: number, y: number } | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isSelecting.current) {
                mousePosRef.current = null;
                return;
            }
            mousePosRef.current = { x: e.clientX, y: e.clientY };
        };

        const handleMouseUp = () => {
            mousePosRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isSelecting]);

    useEffect(() => {
        const startScrollLoop = () => {
            if (!isSelecting.current || !mousePosRef.current || !scrollContainerRef.current) {
                animationFrameRef.current = requestAnimationFrame(startScrollLoop);
                return;
            }

            const container = scrollContainerRef.current;
            const rect = container.getBoundingClientRect();
            const { x, y } = mousePosRef.current;

            // 如果鼠标不在容器可视范围内（可能拖到了容器外），也要处理
            // thresholdPercentage: 默认5%，即 0.05
            const thresholdX = (rect.width * thresholdPercentage) / 100;
            const thresholdY = (rect.height * thresholdPercentage) / 100;

            let scrollX = 0;
            let scrollY = 0;

            const maxSpeed = 15;

            // 计算 x 轴方向的滚动速度
            if (x < rect.left + thresholdX) {
                // 靠近左侧或在左侧外部
                const distance = rect.left + thresholdX - x;
                const ratio = Math.min(1, distance / thresholdX);
                scrollX = -maxSpeed * ratio;
            } else if (x > rect.right - thresholdX) {
                // 靠近右侧或在右侧外部
                const distance = x - (rect.right - thresholdX);
                const ratio = Math.min(1, distance / thresholdX);
                scrollX = maxSpeed * ratio;
            }

            // 计算 y 轴方向的滚动速度
            if (y < rect.top + thresholdY) {
                // 靠近顶部或在顶部外部
                const distance = rect.top + thresholdY - y;
                const ratio = Math.min(1, distance / thresholdY);
                scrollY = -maxSpeed * ratio;
            } else if (y > rect.bottom - thresholdY) {
                // 靠近底部或在底部外部
                const distance = y - (rect.bottom - thresholdY);
                const ratio = Math.min(1, distance / thresholdY);
                scrollY = maxSpeed * ratio;
            }

            if (scrollX !== 0 || scrollY !== 0) {
                // 执行滚动
                container.scrollBy({ left: scrollX, top: scrollY });
                
                // 触发边缘滚动回调，以便更新选区
                if (onScrollEdge) {
                    onScrollEdge(x, y);
                }
            }

            animationFrameRef.current = requestAnimationFrame(startScrollLoop);
        };

        animationFrameRef.current = requestAnimationFrame(startScrollLoop);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isSelecting, scrollContainerRef, thresholdPercentage, onScrollEdge]);
};
