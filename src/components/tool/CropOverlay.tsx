import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { CropHandle, CropRect } from '../../hooks/useCropSelection';

export interface CropOverlayProps {
  imageWidth: number;
  imageHeight: number;
  rect: CropRect;
  onRectChange: (rect: CropRect) => void;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const HANDLE_VISUAL_SIZE = 22;
const HANDLE_HIT_SIZE = 44;
const MIN_VIEWPORT_PX = 64;

interface DisplaySize {
  width: number;
  height: number;
  scaleX: number;
  scaleY: number;
}

function computeDisplay(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
): DisplaySize {
  if (imageWidth <= 0 || imageHeight <= 0 || containerWidth <= 0) {
    return { width: 0, height: 0, scaleX: 1, scaleY: 1 };
  }
  const aspect = imageWidth / imageHeight;
  const width = Math.max(MIN_VIEWPORT_PX, Math.min(imageWidth, containerWidth));
  const height = Math.max(MIN_VIEWPORT_PX, Math.round(width / aspect));
  return {
    width,
    height,
    scaleX: imageWidth / width,
    scaleY: imageHeight / height,
  };
}

function cursorFor(handle: CropHandle): string {
  switch (handle) {
    case 'nw':
    case 'se':
      return 'nwse-resize';
    case 'ne':
    case 'sw':
      return 'nesw-resize';
    case 'n':
    case 's':
      return 'ns-resize';
    case 'e':
    case 'w':
      return 'ew-resize';
    case 'move':
      return 'move';
    default:
      return 'default';
  }
}

function clampRect(rect: CropRect, maxW: number, maxH: number, minSize = 1): CropRect {
  const width = Math.max(minSize, Math.min(Math.round(rect.width), maxW));
  const height = Math.max(minSize, Math.min(Math.round(rect.height), maxH));
  const x = Math.max(0, Math.min(Math.round(rect.x), maxW - width));
  const y = Math.max(0, Math.min(Math.round(rect.y), maxH - height));
  return { x, y, width, height };
}

function applyHandle(
  startRect: CropRect,
  handle: CropHandle,
  dxImage: number,
  dyImage: number,
): CropRect {
  if (handle === 'move') {
    return {
      x: startRect.x + dxImage,
      y: startRect.y + dyImage,
      width: startRect.width,
      height: startRect.height,
    };
  }
  let { x, y, width, height } = startRect;
  const touchesLeft = handle === 'nw' || handle === 'w' || handle === 'sw';
  const touchesRight = handle === 'ne' || handle === 'e' || handle === 'se';
  const touchesTop = handle === 'nw' || handle === 'n' || handle === 'ne';
  const touchesBottom = handle === 'sw' || handle === 's' || handle === 'se';

  if (touchesLeft) {
    const newX = startRect.x + dxImage;
    const newWidth = startRect.width - dxImage;
    if (newWidth >= 1) {
      x = newX;
      width = newWidth;
    } else {
      width = 1;
      x = startRect.x + startRect.width - 1;
    }
  }
  if (touchesRight) {
    const newWidth = startRect.width + dxImage;
    if (newWidth >= 1) width = newWidth;
    else width = 1;
  }
  if (touchesTop) {
    const newY = startRect.y + dyImage;
    const newHeight = startRect.height - dyImage;
    if (newHeight >= 1) {
      y = newY;
      height = newHeight;
    } else {
      height = 1;
      y = startRect.y + startRect.height - 1;
    }
  }
  if (touchesBottom) {
    const newHeight = startRect.height + dyImage;
    if (newHeight >= 1) height = newHeight;
    else height = 1;
  }
  return { x, y, width, height };
}

interface HandleDotProps {
  display: DisplaySize;
  rect: CropRect;
  handle: CropHandle;
  onPointerDown: (event: React.PointerEvent<HTMLElement>, handle: CropHandle) => void;
}

function HandleDot({ display, rect, handle, onPointerDown }: HandleDotProps) {
  const left = rect.x / display.scaleX;
  const top = rect.y / display.scaleY;
  const width = rect.width / display.scaleX;
  const height = rect.height / display.scaleY;
  let px = 0;
  let py = 0;
  switch (handle) {
    case 'nw':
      px = left;
      py = top;
      break;
    case 'n':
      px = left + width / 2;
      py = top;
      break;
    case 'ne':
      px = left + width;
      py = top;
      break;
    case 'e':
      px = left + width;
      py = top + height / 2;
      break;
    case 'se':
      px = left + width;
      py = top + height;
      break;
    case 's':
      px = left + width / 2;
      py = top + height;
      break;
    case 'sw':
      px = left;
      py = top + height;
      break;
    case 'w':
      px = left;
      py = top + height / 2;
      break;
    case 'move':
      px = left + width / 2;
      py = top + height / 2;
      break;
    default:
      px = 0;
      py = 0;
  }
  const hitStyle: React.CSSProperties = {
    position: 'absolute',
    left: px,
    top: py,
    width: HANDLE_HIT_SIZE,
    height: HANDLE_HIT_SIZE,
    marginLeft: -HANDLE_HIT_SIZE / 2,
    marginTop: -HANDLE_HIT_SIZE / 2,
    cursor: cursorFor(handle),
    touchAction: 'none',
  };
  return (
    <div
      role="presentation"
      data-handle={handle}
      data-scale-x={display.scaleX}
      data-scale-y={display.scaleY}
      onPointerDown={(e) => onPointerDown(e, handle)}
      style={hitStyle}
      aria-hidden="true"
    >
      {handle !== 'move' && (
        <span
          aria-hidden="true"
          className="pointer-events-none block rounded-md border-2 border-white bg-accent shadow-md"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: HANDLE_VISUAL_SIZE,
            height: HANDLE_VISUAL_SIZE,
          }}
        />
      )}
    </div>
  );
}

interface DragSession {
  handle: CropHandle;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  startRect: CropRect;
  scaleX: number;
  scaleY: number;
}

export function CropOverlay({
  imageWidth,
  imageHeight,
  rect,
  onRectChange,
  children,
  className = '',
  ariaLabel = 'Crop region',
}: CropOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const display = computeDisplay(imageWidth, imageHeight, containerWidth);
  const dragRef = useRef<DragSession | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const first = entries[0];
      if (!first) return;
      setContainerWidth(first.contentRect.width);
    });
    observer.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dxImage = (e.clientX - drag.startClientX) / drag.scaleX;
      const dyImage = (e.clientY - drag.startClientY) / drag.scaleY;
      const next = applyHandle(drag.startRect, drag.handle, dxImage, dyImage);
      const clamped = clampRect(next, imageWidth, imageHeight, 1);
      onRectChange(clamped);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [imageWidth, imageHeight, onRectChange]);

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>, handle: CropHandle) => {
    const target = event.currentTarget;
    const scaleX = Number.parseFloat(target.dataset.scaleX ?? '1');
    const scaleY = Number.parseFloat(target.dataset.scaleY ?? '1');
    if (!Number.isFinite(scaleX) || scaleX <= 0) return;
    if (!Number.isFinite(scaleY) || scaleY <= 0) return;
    event.preventDefault();
    dragRef.current = {
      handle,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startRect: rect,
      scaleX,
      scaleY,
    };
  };

  const displayLeft = rect.x / (display.scaleX || 1);
  const displayTop = rect.y / (display.scaleY || 1);
  const displayWidth = rect.width / (display.scaleX || 1);
  const displayHeight = rect.height / (display.scaleY || 1);

  return (
    <div
      ref={containerRef}
      className={`relative w-full select-none overflow-hidden rounded-glass-sm border border-white/60 bg-black/5 shadow-glass-sm dark:border-white/10 dark:bg-white/[0.04] ${className}`}
      style={{ minHeight: MIN_VIEWPORT_PX }}
    >
      {display.width > 0 && display.height > 0 && (
        <div
          className="relative"
          style={{
            width: display.width,
            height: display.height,
            maxWidth: '100%',
          }}
        >
          {children}
          <div
            className="pointer-events-none absolute"
            style={{
              left: displayLeft,
              top: displayTop,
              width: displayWidth,
              height: displayHeight,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.45), 0 0 0 2px rgba(255,255,255,0.9)',
              border: '2px solid rgba(255,255,255,0.9)',
              borderRadius: 2,
            }}
          />
          <HandleDot display={display} rect={rect} handle="nw" onPointerDown={handlePointerDown} />
          <HandleDot display={display} rect={rect} handle="n" onPointerDown={handlePointerDown} />
          <HandleDot display={display} rect={rect} handle="ne" onPointerDown={handlePointerDown} />
          <HandleDot display={display} rect={rect} handle="e" onPointerDown={handlePointerDown} />
          <HandleDot display={display} rect={rect} handle="se" onPointerDown={handlePointerDown} />
          <HandleDot display={display} rect={rect} handle="s" onPointerDown={handlePointerDown} />
          <HandleDot display={display} rect={rect} handle="sw" onPointerDown={handlePointerDown} />
          <HandleDot display={display} rect={rect} handle="w" onPointerDown={handlePointerDown} />
          <HandleDot
            display={display}
            rect={rect}
            handle="move"
            onPointerDown={handlePointerDown}
          />
        </div>
      )}
      <span className="sr-only" aria-live="polite">
        {ariaLabel}: {rect.width} pixels wide by {rect.height} pixels tall
      </span>
    </div>
  );
}
