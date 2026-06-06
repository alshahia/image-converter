import { useCallback, useEffect, useRef, useState } from 'react';

export interface CropRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type CropHandle = 'move' | 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

interface DragState {
  handle: CropHandle;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startRect: CropRect;
}

export interface UseCropSelectionOptions {
  imageWidth: number;
  imageHeight: number;
  initialRect?: CropRect;
  minSize?: number;
}

export interface UseCropSelectionResult {
  rect: CropRect;
  setRect: (rect: CropRect) => void;
  reset: () => void;
  beginDrag: (event: React.PointerEvent<HTMLElement>, handle: CropHandle) => void;
  isDragging: boolean;
}

function clampRect(rect: CropRect, maxW: number, maxH: number, minSize: number): CropRect {
  const width = Math.max(minSize, Math.min(Math.round(rect.width), maxW));
  const height = Math.max(minSize, Math.min(Math.round(rect.height), maxH));
  const x = Math.max(0, Math.min(Math.round(rect.x), maxW - width));
  const y = Math.max(0, Math.min(Math.round(rect.y), maxH - height));
  return { x, y, width, height };
}

function defaultRect(width: number, height: number): CropRect {
  return { x: 0, y: 0, width, height };
}

function shrinkToRect(
  startRect: CropRect,
  handle: CropHandle,
  dx: number,
  dy: number,
  minSize: number,
): CropRect {
  let x = startRect.x;
  let y = startRect.y;
  let w = startRect.width;
  let h = startRect.height;

  if (handle === 'move') {
    return { x: startRect.x + dx, y: startRect.y + dy, width: w, height: h };
  }
  if (handle === 'nw' || handle === 'n' || handle === 'w') {
    const newX = startRect.x + dx;
    const newY = handle === 'n' || handle === 'nw' ? startRect.y + dy : startRect.y;
    const newW = startRect.width + (startRect.x - newX);
    const newH =
      handle === 'w' || handle === 'nw'
        ? startRect.height + (startRect.y - newY)
        : startRect.height;
    if (newW >= minSize) {
      x = newX;
      w = newW;
    }
    if (newH >= minSize) {
      y = newY;
      h = newH;
    }
    return { x, y, width: w, height: h };
  }
  if (handle === 'ne' || handle === 'e') {
    const newW = startRect.width + dx;
    if (newW >= minSize) w = newW;
    if (handle === 'ne') {
      const newY = startRect.y + dy;
      const newH = startRect.height + (startRect.y - newY);
      if (newH >= minSize) {
        y = newY;
        h = newH;
      }
    }
    return { x, y, width: w, height: h };
  }
  if (handle === 'se' || handle === 's') {
    const newW = startRect.width + dx;
    const newH = startRect.height + dy;
    if (newW >= minSize) w = newW;
    if (newH >= minSize) h = newH;
    return { x, y, width: w, height: h };
  }
  if (handle === 'sw') {
    const newX = startRect.x + dx;
    const newW = startRect.width + (startRect.x - newX);
    const newH = startRect.height + dy;
    if (newW >= minSize) {
      x = newX;
      w = newW;
    }
    if (newH >= minSize) h = newH;
    return { x, y, width: w, height: h };
  }
  return { x, y, width: w, height: h };
}

export function useCropSelection(options: UseCropSelectionOptions): UseCropSelectionResult {
  const { imageWidth, imageHeight, initialRect, minSize = 1 } = options;
  const initial = initialRect ?? defaultRect(imageWidth, imageHeight);
  const [rect, setRectInternal] = useState<CropRect>(() =>
    clampRect(initial, imageWidth, imageHeight, minSize),
  );
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<DragState | null>(null);
  const scaleRef = useRef<{ x: number; y: number } | null>(null);

  const setRect = useCallback(
    (next: CropRect) => {
      setRectInternal(clampRect(next, imageWidth, imageHeight, minSize));
    },
    [imageWidth, imageHeight, minSize],
  );

  const reset = useCallback(() => {
    setRectInternal(defaultRect(imageWidth, imageHeight));
  }, [imageWidth, imageHeight]);

  useEffect(() => {
    if (imageWidth <= 0 || imageHeight <= 0) return;
    setRectInternal((current) => clampRect(current, imageWidth, imageHeight, minSize));
  }, [imageWidth, imageHeight, minSize]);

  const updateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const drag = dragRef.current;
      const scale = scaleRef.current;
      if (!drag || !scale) return;
      const dxImage = (clientX - drag.startClientX) / scale.x;
      const dyImage = (clientY - drag.startClientY) / scale.y;
      const next = shrinkToRect(drag.startRect, drag.handle, dxImage, dyImage, minSize);
      setRectInternal(clampRect(next, imageWidth, imageHeight, minSize));
    },
    [imageWidth, imageHeight, minSize],
  );

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: PointerEvent) => {
      updateFromClient(e.clientX, e.clientY);
    };
    const handleUp = () => {
      dragRef.current = null;
      scaleRef.current = null;
      setIsDragging(false);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [isDragging, updateFromClient]);

  const beginDrag = useCallback(
    (event: React.PointerEvent<HTMLElement>, handle: CropHandle) => {
      const target = event.currentTarget as HTMLElement | null;
      if (!target) return;
      const scaleAttr = target.dataset.scaleX;
      const scaleYAttr = target.dataset.scaleY;
      const scaleX = scaleAttr ? Number.parseFloat(scaleAttr) : 1;
      const scaleY = scaleYAttr ? Number.parseFloat(scaleYAttr) : 1;
      if (!Number.isFinite(scaleX) || scaleX <= 0) return;
      if (!Number.isFinite(scaleY) || scaleY <= 0) return;
      event.preventDefault();
      (event.target as Element).setPointerCapture?.(event.pointerId);
      dragRef.current = {
        handle,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startRect: rect,
      };
      scaleRef.current = { x: scaleX, y: scaleY };
      setIsDragging(true);
    },
    [rect],
  );

  return { rect, setRect, reset, beginDrag, isDragging };
}
