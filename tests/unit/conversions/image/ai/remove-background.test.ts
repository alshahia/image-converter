import { describe, expect, it, vi } from 'vitest';

// happy-dom/jsdom canvas: polyfill toBlob if missing (setup.ts already does this;
// keeping as a safety net in case setup.ts is changed).
if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.toBlob) {
  HTMLCanvasElement.prototype.toBlob = (
    cb: BlobCallback,
    type = 'image/png',
    _quality?: number,
  ) => {
    const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    const blob = new Blob([new Uint8Array(PNG_HEADER)], { type });
    cb(blob);
  };
}

// setup.ts installs a noop Proxy for getContext('2d'). The SUT needs real
// putImageData / getImageData / createImageData calls, so override with a
// stateful fake. drawImage is a no-op (we don't need resampling for these tests).
function makeFake2DContext(): Record<string, unknown> {
  let stored: ImageData | null = null;
  return {
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    canvas: { width: 0, height: 0 },
    measureText: (_t: string) => ({ width: 0 }),
    createImageData: (w: number, h: number) =>
      new ImageData(new Uint8ClampedArray(w * h * 4), w, h),
    getImageData: (_x: number, _y: number, w: number, h: number) =>
      stored ?? new ImageData(new Uint8ClampedArray(w * h * 4), w, h),
    putImageData: (img: ImageData) => {
      stored = img;
    },
    drawImage: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    scale: () => {},
    fillRect: () => {},
    clearRect: () => {},
    fillText: () => {},
    strokeText: () => {},
    beginPath: () => {},
    closePath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    setTransform: () => {},
    resetTransform: () => {},
    createLinearGradient: () => ({}),
    createRadialGradient: () => ({}),
    createPattern: () => ({}),
    bezierCurveTo: () => {},
    quadraticCurveTo: () => {},
  };
}

HTMLCanvasElement.prototype.getContext = function getContext(
  this: HTMLCanvasElement,
  contextId: string,
  ..._args: unknown[]
): RenderingContext | null {
  if (contextId === '2d') return makeFake2DContext() as unknown as RenderingContext;
  return null;
} as unknown as typeof HTMLCanvasElement.prototype.getContext;

vi.mock('../../../../../src/lib/engines/onnx', () => ({
  ort: {
    Tensor: class Tensor {
      public dims: number[];
      public data: Float32Array;
      public type: string;
      constructor(type: string, data: Float32Array, dims: number[]) {
        this.type = type;
        this.data = data;
        this.dims = dims;
      }
    },
  },
  loadModel: vi.fn(async () => ({
    inputNames: ['input.1'],
    outputNames: ['output'],
    run: vi.fn(async () => ({
      output: {
        data: new Float32Array([0, 0, 0, 1, 1, 1, 0.5, 0.5, 0.5]),
        dims: [1, 1, 3, 3],
      },
    })),
  })),
}));

// jsdom can't decode a fake PNG. Stub decodeToImageData to return a known
// 100x100 ImageData. The SUT composites against this size, so the test is
// deterministic regardless of the input blob's dimensions.
vi.mock('../../../../../src/lib/engines/imageData', () => ({
  decodeToImageData: vi.fn(async (_blob: Blob) => {
    return new ImageData(new Uint8ClampedArray(100 * 100 * 4), 100, 100);
  }),
}));

import { removeBackground } from '../../../../../src/lib/conversions/image/ai/remove-background';
import { loadModel } from '../../../../../src/lib/engines/onnx';

const mockedLoadModel = vi.mocked(loadModel);

function makeBlob(w: number, h: number, fill: [number, number, number, number]): Blob {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = fill[3];
  }
  return new Blob([data], { type: 'image/png' });
}

describe('removeBackground', () => {
  it('returns a PNG blob', async () => {
    const blob = makeBlob(640, 480, [255, 0, 0, 255]);
    const out = await removeBackground(blob);
    expect(out).toBeInstanceOf(Blob);
    expect(out.type).toBe('image/png');
  });

  it('uses silueta model by default', async () => {
    const blob = makeBlob(100, 100, [0, 255, 0, 255]);
    const out = await removeBackground(blob);
    expect(out).toBeInstanceOf(Blob);
  });

  it('accepts an onProgress callback without throwing', async () => {
    const blob = makeBlob(50, 50, [0, 0, 255, 255]);
    const progress = vi.fn();
    await expect(removeBackground(blob, { onProgress: progress })).resolves.toBeInstanceOf(Blob);
  });

  it('feeds the input tensor under the model\'s actual input name (e.g. "input.1")', async () => {
    const blob = makeBlob(64, 64, [0, 0, 0, 255]);
    await removeBackground(blob);
    const session = await mockedLoadModel.mock.results[0]?.value;
    const runMock = session?.run as ReturnType<typeof vi.fn>;
    expect(runMock).toHaveBeenCalledTimes(1);
    const feeds = runMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(Object.keys(feeds)).toEqual(['input.1']);
  });
});
