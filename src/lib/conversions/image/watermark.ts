import { decodeToImageData } from '../../engines/imageData';

export type WatermarkPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right';

export interface WatermarkTextOptions {
  mode: 'text';
  text: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  marginPercent?: number;
  outputType?: string;
  quality?: number;
}

export interface WatermarkImageOptions {
  mode: 'image';
  image: File | Blob;
  position: WatermarkPosition;
  opacity: number;
  scale: number;
  marginPercent?: number;
  outputType?: string;
  quality?: number;
}

export type WatermarkOptions = WatermarkTextOptions | WatermarkImageOptions;

export interface WatermarkResult {
  blob: Blob;
  width: number;
  height: number;
  outputType: string;
}

const MARGIN_PERCENT_DEFAULT = 0.02;
const TEXT_PADDING_RATIO = 0.5;
const DEFAULT_FONT_FAMILY =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const DEFAULT_TEXT_COLOR = '#ffffff';

interface OverlaySize {
  width: number;
  height: number;
}

function clampedOpacity(value: number): number {
  if (Number.isNaN(value)) return 1;
  return Math.max(0, Math.min(1, value));
}

function clampedMargin(percent: number | undefined, fallback: number): number {
  const value = percent ?? fallback;
  if (Number.isNaN(value)) return fallback;
  return Math.max(0, Math.min(0.2, value));
}

function computeTextSize(text: string, fontSize: number, fontFamily: string): OverlaySize {
  if (typeof document === 'undefined') {
    const approxCharWidth = fontSize * 0.55;
    const lines = text.split('\n');
    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
    return { width: Math.max(1, longest * approxCharWidth), height: fontSize * lines.length };
  }
  const measure = document.createElement('canvas');
  const ctx = measure.getContext('2d');
  if (!ctx) {
    const approxCharWidth = fontSize * 0.55;
    const lines = text.split('\n');
    const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
    return { width: Math.max(1, longest * approxCharWidth), height: fontSize * lines.length };
  }
  ctx.font = `${fontSize}px ${fontFamily}`;
  const lines = text.split('\n');
  const widths = lines.map((line) => ctx.measureText(line).width);
  const longestWidth = widths.reduce((max, w) => Math.max(max, w), 0);
  const totalHeight = fontSize * lines.length * TEXT_PADDING_RATIO * 2;
  return { width: Math.max(1, longestWidth), height: totalHeight };
}

function computePosition(
  position: WatermarkPosition,
  canvasW: number,
  canvasH: number,
  overlayW: number,
  overlayH: number,
  margin: number,
): { x: number; y: number } {
  const marginX = canvasW * margin;
  const marginY = canvasH * margin;
  const vertical: Record<WatermarkPosition, 'top' | 'center' | 'bottom'> = {
    'top-left': 'top',
    top: 'top',
    'top-right': 'top',
    left: 'center',
    center: 'center',
    right: 'center',
    'bottom-left': 'bottom',
    bottom: 'bottom',
    'bottom-right': 'bottom',
  };
  const horizontal: Record<WatermarkPosition, 'left' | 'center' | 'right'> = {
    'top-left': 'left',
    top: 'center',
    'top-right': 'right',
    left: 'left',
    center: 'center',
    right: 'right',
    'bottom-left': 'left',
    bottom: 'center',
    'bottom-right': 'right',
  };
  const v = vertical[position];
  const h = horizontal[position];
  let y: number;
  if (v === 'top') y = marginY;
  else if (v === 'bottom') y = canvasH - overlayH - marginY;
  else y = (canvasH - overlayH) / 2;
  let x: number;
  if (h === 'left') x = marginX;
  else if (h === 'right') x = canvasW - overlayW - marginX;
  else x = (canvasW - overlayW) / 2;
  return { x, y };
}

async function loadOverlayBitmap(image: File | Blob): Promise<ImageBitmap> {
  if (typeof createImageBitmap === 'function') {
    return createImageBitmap(image);
  }
  return new Promise<ImageBitmap>((resolve, reject) => {
    const url = URL.createObjectURL(image);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('watermark: 2D context unavailable'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      createImageBitmap(canvas)
        .then((bmp) => resolve(bmp))
        .catch((err) => reject(err));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('watermark: failed to load overlay image'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number | undefined,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('watermark: canvas.toBlob returned null'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

export async function watermarkImage(
  file: File | Blob,
  options: WatermarkOptions,
): Promise<WatermarkResult> {
  const imageData = await decodeToImageData(file);
  const sourceCanvas = document.createElement('canvas');
  sourceCanvas.width = imageData.width;
  sourceCanvas.height = imageData.height;
  const sourceCtx = sourceCanvas.getContext('2d');
  if (!sourceCtx) throw new Error('watermark: 2D context unavailable');
  sourceCtx.putImageData(imageData, 0, 0);

  const canvas = sourceCanvas;
  const ctx = sourceCtx;
  const opacity = clampedOpacity(options.opacity);
  const margin = clampedMargin(options.marginPercent, MARGIN_PERCENT_DEFAULT);

  if (options.mode === 'text') {
    const fontSize = Math.max(8, options.fontSize);
    const fontFamily = options.fontFamily ?? DEFAULT_FONT_FAMILY;
    const color = options.color ?? DEFAULT_TEXT_COLOR;
    const lines = options.text.split('\n');
    const { width: textW, height: textH } = computeTextSize(options.text, fontSize, fontFamily);
    const { x, y } = computePosition(
      options.position,
      canvas.width,
      canvas.height,
      textW,
      textH,
      margin,
    );

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.font = `${fontSize}px ${fontFamily}`;
    ctx.textBaseline = 'top';
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = Math.max(2, fontSize * 0.1);
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 1;
    const lineHeight = fontSize * TEXT_PADDING_RATIO * 2;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const lineWidth = ctx.measureText(line).width;
      const lineX = x + (textW - lineWidth) / 2;
      ctx.fillText(line, lineX, y + i * lineHeight);
    }
    ctx.restore();
  } else {
    const scale = Math.max(0.01, Math.min(1, options.scale));
    const overlayBitmap = await loadOverlayBitmap(options.image);
    const overlayW = overlayBitmap.width * scale;
    const overlayH = overlayBitmap.height * scale;
    const { x, y } = computePosition(
      options.position,
      canvas.width,
      canvas.height,
      overlayW,
      overlayH,
      margin,
    );
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(overlayBitmap, x, y, overlayW, overlayH);
    ctx.restore();
    overlayBitmap.close();
  }

  const outputType = options.outputType ?? 'image/png';
  const quality = outputType === 'image/png' ? undefined : (options.quality ?? 0.92);
  const blob = await canvasToBlob(canvas, outputType, quality);
  return { blob, width: canvas.width, height: canvas.height, outputType };
}
