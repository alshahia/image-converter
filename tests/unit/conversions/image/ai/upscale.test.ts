import { describe, expect, it, vi } from 'vitest';

if (typeof HTMLCanvasElement !== 'undefined' && !HTMLCanvasElement.prototype.toBlob) {
  HTMLCanvasElement.prototype.toBlob = (
    cb: BlobCallback,
    type = 'image/png',
    _quality?: number,
  ) => {
    const PNG_HEADER = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    cb(new Blob([new Uint8Array(PNG_HEADER)], { type }));
  };
}

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

vi.mock('../../../../../src/lib/engines/imageData', () => ({
  decodeToImageData: vi.fn(async (_blob: Blob) => {
    const w = 4;
    const h = 4;
    return new ImageData(new Uint8ClampedArray(w * h * 4), w, h);
  }),
}));

vi.mock('../../../../../src/lib/engines/onnx', () => {
  class FakeTensor {
    public data: Float32Array;
    public dims: number[];
    public type: string;
    constructor(type: string, data: Float32Array, dims: number[]) {
      this.type = type;
      this.data = data;
      this.dims = dims;
    }
  }
  return {
    ort: { Tensor: FakeTensor },
    loadModel: vi.fn(async (id: string) => {
      const scale = id === 'realesrgan-x4plus' ? 4 : 2;
      const w = 4 * scale;
      const h = 4 * scale;
      return {
        inputNames: ['input.1'],
        outputNames: ['output'],
        run: vi.fn(async () => ({
          output: new FakeTensor('float32', new Float32Array(3 * w * h).fill(0.5), [1, 3, h, w]),
        })),
      };
    }),
  };
});

import { upscale } from '../../../../../src/lib/conversions/image/ai/upscale';
import { loadModel } from '../../../../../src/lib/engines/onnx';

const mockedLoadModel = vi.mocked(loadModel);

function makePngBlob(w: number, h: number): Blob {
  return new Blob([new Uint8Array(w * h * 4)], { type: 'image/png' });
}

describe('upscale', () => {
  it('returns a PNG blob for the 2x model', async () => {
    const out = await upscale(makePngBlob(4, 4), { modelId: 'realesrgan-x2plus' });
    expect(out).toBeInstanceOf(Blob);
    expect(out.type).toBe('image/png');
  });

  it('returns a PNG blob for the 4x model', async () => {
    const out = await upscale(makePngBlob(4, 4), { modelId: 'realesrgan-x4plus' });
    expect(out).toBeInstanceOf(Blob);
    expect(out.type).toBe('image/png');
  });

  it('throws if modelId is unknown', async () => {
    await expect(upscale(makePngBlob(4, 4), { modelId: 'nope' as never })).rejects.toThrow();
  });

  it('feeds the input tensor under the model\'s actual input name (e.g. "input.1")', async () => {
    await upscale(makePngBlob(4, 4), { modelId: 'realesrgan-x2plus' });
    const session = await mockedLoadModel.mock.results[0]?.value;
    const runMock = session?.run as ReturnType<typeof vi.fn>;
    expect(runMock).toHaveBeenCalledTimes(1);
    const feeds = runMock.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(Object.keys(feeds)).toEqual(['input.1']);
  });
});
