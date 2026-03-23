import { renderHook } from '@testing-library/react';
import { useAutoScroll } from '../useAutoScroll';

describe('useAutoScroll', () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    it('当处于框选状态且鼠标靠近边缘时应该触发滚动', () => {
        const isSelecting = { current: true };
        const mockScrollBy = jest.fn();
        const mockOnScrollEdge = jest.fn();
        const scrollContainerRef = {
            current: {
                getBoundingClientRect: () => ({
                    top: 100,
                    bottom: 500,
                    left: 100,
                    right: 500,
                    width: 400,
                    height: 400
                }),
                scrollBy: mockScrollBy
            } as unknown as HTMLElement
        };

        renderHook(() => useAutoScroll({
            scrollContainerRef,
            isSelecting,
            thresholdPercentage: 5,
            onScrollEdge: mockOnScrollEdge
        }));

        // 模拟鼠标移动到容器边缘（距离底部阈值以内）
        // 阈值为 400 * 5% = 20，底部是 500，阈值区域是 480 - 500
        const mouseEvent = new MouseEvent('mousemove', {
            clientX: 250,
            clientY: 490
        });
        window.dispatchEvent(mouseEvent);

        // 推进 requestAnimationFrame
        jest.advanceTimersByTime(16);

        expect(mockScrollBy).toHaveBeenCalled();
        expect(mockScrollBy).toHaveBeenCalledWith(expect.objectContaining({
            left: 0,
            top: expect.any(Number) // 向下滚动，top 应该是正数
        }));
        expect(mockOnScrollEdge).toHaveBeenCalledWith(250, 490);
    });

    it('当未处于框选状态时，不应触发滚动', () => {
        const isSelecting = { current: false };
        const mockScrollBy = jest.fn();
        const scrollContainerRef = {
            current: {
                getBoundingClientRect: () => ({
                    top: 100,
                    bottom: 500,
                    left: 100,
                    right: 500,
                    width: 400,
                    height: 400
                }),
                scrollBy: mockScrollBy
            } as unknown as HTMLElement
        };

        renderHook(() => useAutoScroll({
            scrollContainerRef,
            isSelecting,
            thresholdPercentage: 5
        }));

        const mouseEvent = new MouseEvent('mousemove', {
            clientX: 250,
            clientY: 490
        });
        window.dispatchEvent(mouseEvent);

        jest.advanceTimersByTime(16);

        expect(mockScrollBy).not.toHaveBeenCalled();
    });

    it('鼠标抬起后应停止滚动', () => {
        const isSelecting = { current: true };
        const mockScrollBy = jest.fn();
        const scrollContainerRef = {
            current: {
                getBoundingClientRect: () => ({
                    top: 100,
                    bottom: 500,
                    left: 100,
                    right: 500,
                    width: 400,
                    height: 400
                }),
                scrollBy: mockScrollBy
            } as unknown as HTMLElement
        };

        renderHook(() => useAutoScroll({
            scrollContainerRef,
            isSelecting,
            thresholdPercentage: 5
        }));

        const mouseMoveEvent = new MouseEvent('mousemove', {
            clientX: 250,
            clientY: 490
        });
        window.dispatchEvent(mouseMoveEvent);

        jest.advanceTimersByTime(16);
        expect(mockScrollBy).toHaveBeenCalledTimes(1);

        const mouseUpEvent = new MouseEvent('mouseup');
        window.dispatchEvent(mouseUpEvent);

        jest.advanceTimersByTime(16);
        expect(mockScrollBy).toHaveBeenCalledTimes(1); // 不应再增加
    });
});
