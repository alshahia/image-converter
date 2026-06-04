import { Canvg } from 'canvg';

export interface SvgToPngOptions {
  width?: number;
  height?: number;
  background?: string;
}

export interface SvgToPngResult {
  blob: Blob;
  width: number;
  height: number;
}

function parseSvgSize(svg: string): { width: number; height: number; viewBox?: string } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.tagName.toLowerCase() !== 'svg') {
    throw new Error('svgToPng: input is not a valid SVG document');
  }
  const widthAttr = root.getAttribute('width');
  const heightAttr = root.getAttribute('height');
  const viewBox = root.getAttribute('viewBox') ?? undefined;
  const parseLength = (raw: string | null): number | null => {
    if (!raw) return null;
    const m = raw.trim().match(/^([0-9]*\.?[0-9]+)\s*(px|pt|em|rem|%)?$/);
    if (!m || !m[1]) return null;
    if (m[2] === '%') return null;
    return Number.parseFloat(m[1]);
  };
  let width = parseLength(widthAttr);
  let height = parseLength(heightAttr);
  if ((!width || !height) && viewBox) {
    const parts = viewBox.split(/[\s,]+/).map((p) => Number.parseFloat(p));
    if (parts.length === 4) {
      const [, , w, h] = parts;
      if ((!width || !height) && w && h) {
        width = width ?? w;
        height = height ?? h;
      }
    }
  }
  if (!width || !height) {
    width = 512;
    height = 512;
  }
  return { width, height, viewBox };
}

export async function svgToPng(
  input: Blob,
  options: SvgToPngOptions = {},
): Promise<SvgToPngResult> {
  const svgText = await input.text();
  if (!svgText.trim().toLowerCase().startsWith('<svg')) {
    throw new Error('svgToPng: file is not an SVG');
  }
  const parsed = parseSvgSize(svgText);
  const targetWidth = options.width ?? parsed.width;
  const targetHeight = options.height ?? parsed.height;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(targetWidth));
  canvas.height = Math.max(1, Math.round(targetHeight));
  if (options.background) {
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = options.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('svgToPng: 2D canvas context unavailable');
  const v = await Canvg.from(ctx, svgText);
  v.resize(canvas.width, canvas.height);
  await v.render();
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/png');
  });
  if (!blob) throw new Error('svgToPng: canvas.toBlob returned null');
  return { blob, width: canvas.width, height: canvas.height };
}
