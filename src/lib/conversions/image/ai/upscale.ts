import type { AiModel } from '../../../engines/aiModels';
import { decodeToImageData } from '../../../engines/imageData';
import { type LoadModelOptions, loadModel, ort } from '../../../engines/onnx';

export type UpscaleModelId = Extract<AiModel['id'], 'realesrgan-x2plus' | 'realesrgan-x4plus'>;

const SCALE: Record<UpscaleModelId, number> = {
  'realesrgan-x2plus': 2,
  'realesrgan-x4plus': 4,
};

export interface UpscaleOptions {
  modelId: UpscaleModelId;
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}

function imageDataToTensor(data: ImageData): ort.Tensor {
  const floats = new Float32Array(1 * 3 * data.width * data.height);
  const plane = data.width * data.height;
  for (let i = 0; i < plane; i++) {
    const r = data.data[i * 4] ?? 0;
    const g = data.data[i * 4 + 1] ?? 0;
    const b = data.data[i * 4 + 2] ?? 0;
    floats[i] = r / 255;
    floats[plane + i] = g / 255;
    floats[2 * plane + i] = b / 255;
  }
  return new ort.Tensor('float32', floats, [1, 3, data.height, data.width]);
}

function tensorToImageData(t: ort.Tensor, outW: number, outH: number): ImageData {
  const data = t.data as Float32Array;
  const plane = outW * outH;
  const out = new Uint8ClampedArray(outW * outH * 4);
  for (let i = 0; i < plane; i++) {
    const r = data[i] ?? 0;
    const g = data[plane + i] ?? 0;
    const b = data[2 * plane + i] ?? 0;
    out[i * 4] = Math.max(0, Math.min(255, Math.round(r * 255)));
    out[i * 4 + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
    out[i * 4 + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
    out[i * 4 + 3] = 255;
  }
  return new ImageData(out, outW, outH);
}

export async function upscale(file: Blob, opts: UpscaleOptions): Promise<Blob> {
  if (!(opts.modelId in SCALE)) {
    throw new Error(`Unknown upscale model: ${opts.modelId}`);
  }
  const loadOpts: LoadModelOptions = {
    onProgress: (loaded, total) => opts.onProgress?.(Math.round((loaded / total) * 60)),
    signal: opts.signal,
  };
  const session = await loadModel(opts.modelId, loadOpts);
  const image = await decodeToImageData(file);
  opts.onProgress?.(70);
  const input = imageDataToTensor(image);
  const inputName = session.inputNames[0];
  if (!inputName) {
    throw new Error('Real-ESRGAN session has no input names');
  }
  const result = await session.run({ [inputName]: input });
  const outKey = session.outputNames[0];
  if (!outKey || !result[outKey]) {
    throw new Error('Real-ESRGAN returned no output tensor');
  }
  const outTensor = result[outKey];
  const dims = outTensor.dims as number[];
  const outH = dims[2] ?? 0;
  const outW = dims[3] ?? 0;
  const out = tensorToImageData(outTensor, outW, outH);
  opts.onProgress?.(95);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.putImageData(out, 0, 0);
  opts.onProgress?.(100);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to encode upscaled PNG'));
    }, 'image/png');
  });
}
