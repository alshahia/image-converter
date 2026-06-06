import '@testing-library/jest-dom/vitest';

// jsdom doesn't ship URL.createObjectURL / URL.revokeObjectURL.
// Several components (DownloadButton, DemoZone) rely on them.
// Polyfill with a no-op pair that returns a synthetic blob: URL.
if (typeof URL.createObjectURL !== 'function') {
  let blobCounter = 0;
  URL.createObjectURL = (_obj: Blob | MediaSource): string => {
    blobCounter += 1;
    return `blob:test-${blobCounter}`;
  };
}
if (typeof URL.revokeObjectURL !== 'function') {
  URL.revokeObjectURL = (_url: string): void => {
    // no-op
  };
}

if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer(this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) resolve(reader.result);
        else reject(new Error('FileReader result was not an ArrayBuffer'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
      reader.readAsArrayBuffer(this);
    });
  };
}

if (typeof globalThis.ImageData === 'undefined') {
  class TestImageData {
    public readonly data: Uint8ClampedArray;
    public readonly width: number;
    public readonly height: number;
    constructor(data: Uint8ClampedArray, width: number, height?: number) {
      this.data = data;
      this.width = width;
      this.height = height ?? data.length / (width * 4);
    }
  }
  (globalThis as { ImageData: typeof TestImageData }).ImageData =
    TestImageData as unknown as typeof globalThis.ImageData;
}

const originalGetContext = HTMLCanvasElement.prototype.getContext;

type CanvasContextProxy = Record<string, unknown> & {
  measureText: (text: string) => { width: number };
  fillRect: (...args: unknown[]) => void;
  clearRect: (...args: unknown[]) => void;
  getImageData: (x: number, y: number, w: number, h: number) => ImageData;
  putImageData: (image: ImageData, dx: number, dy: number) => void;
  drawImage: (...args: unknown[]) => void;
  save: () => void;
  restore: () => void;
  translate: (...args: unknown[]) => void;
  rotate: (...args: unknown[]) => void;
  scale: (...args: unknown[]) => void;
  fillText: (...args: unknown[]) => void;
  strokeText: (...args: unknown[]) => void;
  beginPath: () => void;
  closePath: () => void;
  moveTo: (...args: unknown[]) => void;
  lineTo: (...args: unknown[]) => void;
  arc: (...args: unknown[]) => void;
  fill: () => void;
  stroke: () => void;
  createImageData: (w: number, h: number) => ImageData;
  setTransform: (...args: unknown[]) => void;
  resetTransform: () => void;
  createLinearGradient: () => unknown;
  createRadialGradient: () => unknown;
  createPattern: () => unknown;
  bezierCurveTo: (...args: unknown[]) => void;
  quadraticCurveTo: (...args: unknown[]) => void;
};

function createNoopContext(): CanvasContextProxy {
  return new Proxy({} as CanvasContextProxy, {
    get(_target, prop) {
      if (prop === 'measureText') {
        return (_text: string) => ({ width: 0 });
      }
      if (prop === 'canvas') {
        return { width: 0, height: 0 };
      }
      return () => undefined;
    },
    set() {
      return true;
    },
  });
}

const originalToBlob = HTMLCanvasElement.prototype.toBlob;

HTMLCanvasElement.prototype.getContext = (() => {
  const fn = function getContext(
    this: HTMLCanvasElement,
    contextId: string,
    ...args: unknown[]
  ): RenderingContext | null {
    if (contextId === '2d') {
      return createNoopContext() as unknown as RenderingContext;
    }
    return (originalGetContext as (...a: unknown[]) => RenderingContext | null).apply(this, [
      contextId,
      ...args,
    ]);
  };
  return fn as unknown as typeof HTMLCanvasElement.prototype.getContext;
})();

HTMLCanvasElement.prototype.toBlob = function toBlob(
  cb: BlobCallback | null,
  type?: string,
  _quality?: number,
): void {
  if (cb) {
    cb(new Blob(['stub'], { type: type ?? 'image/png' }));
  }
};

export const __testCanvasCleanup = (): void => {
  HTMLCanvasElement.prototype.getContext = originalGetContext;
  HTMLCanvasElement.prototype.toBlob = originalToBlob;
};
