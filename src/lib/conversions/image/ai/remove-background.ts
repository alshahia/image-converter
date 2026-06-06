import { decodeToImageData } from '../../../engines/imageData';
import { type LoadModelOptions, loadModel, ort } from '../../../engines/onnx';

export interface RemoveBackgroundOptions {
  modelId?: 'silueta';
  onProgress?: (pct: number) => void;
  signal?: AbortSignal;
}

const SILUETA_INPUT_SIZE = 320;
const IMAGENET_MEAN: readonly [number, number, number] = [0.485, 0.456, 0.406];
const IMAGENET_STD: readonly [number, number, number] = [0.229, 0.224, 0.225];

function imageDataToTensor(data: ImageData, size: number): ort.Tensor {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  const tmp = document.createElement('canvas');
  tmp.width = data.width;
  tmp.height = data.height;
  const tctx = tmp.getContext('2d');
  if (!tctx) throw new Error('Canvas 2D context unavailable');
  tctx.putImageData(data, 0, 0);
  ctx.drawImage(tmp, 0, 0, size, size);
  const out = ctx.getImageData(0, 0, size, size);
  const floats = new Float32Array(1 * 3 * size * size);
  const plane = size * size;
  for (let i = 0; i < plane; i++) {
    const r = (out.data[i * 4] ?? 0) / 255;
    const g = (out.data[i * 4 + 1] ?? 0) / 255;
    const b = (out.data[i * 4 + 2] ?? 0) / 255;
    floats[i] = (r - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    floats[plane + i] = (g - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    floats[2 * plane + i] = (b - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }
  return new ort.Tensor('float32', floats, [1, 3, size, size]);
}

function maskToAlpha(mask: ort.Tensor, sourceW: number, sourceH: number): Uint8ClampedArray {
  const dims = mask.dims as [number, number, number, number];
  const hm = dims[2];
  const wm = dims[3];
  const maskData = mask.data as Float32Array;
  const maskCanvas = document.createElement('canvas');
  maskCanvas.width = wm;
  maskCanvas.height = hm;
  const mctx = maskCanvas.getContext('2d');
  if (!mctx) throw new Error('Canvas 2D context unavailable');
  const imgData = mctx.createImageData(wm, hm);
  for (let i = 0; i < wm * hm; i++) {
    const v = Math.max(0, Math.min(1, maskData[i] ?? 0));
    const a = Math.round(v * 255);
    imgData.data[i * 4] = a;
    imgData.data[i * 4 + 1] = a;
    imgData.data[i * 4 + 2] = a;
    imgData.data[i * 4 + 3] = 255;
  }
  mctx.putImageData(imgData, 0, 0);

  const resizeCanvas = document.createElement('canvas');
  resizeCanvas.width = sourceW;
  resizeCanvas.height = sourceH;
  const rctx = resizeCanvas.getContext('2d');
  if (!rctx) throw new Error('Canvas 2D context unavailable');
  rctx.imageSmoothingEnabled = true;
  rctx.imageSmoothingQuality = 'high';
  rctx.drawImage(maskCanvas, 0, 0, sourceW, sourceH);
  return rctx.getImageData(0, 0, sourceW, sourceH).data;
}

export async function removeBackground(
  file: Blob,
  opts: RemoveBackgroundOptions = {},
): Promise<Blob> {
  const modelId = opts.modelId ?? 'silueta';
  const loadOpts: LoadModelOptions = {
    onProgress: (loaded, total) => opts.onProgress?.(Math.round((loaded / total) * 50)),
    signal: opts.signal,
  };
  const session = await loadModel(modelId, loadOpts);
  const image = await decodeToImageData(file);
  const input = imageDataToTensor(image, SILUETA_INPUT_SIZE);
  const inputName = session.inputNames[0];
  if (!inputName) {
    throw new Error('U-2-Net session has no input names');
  }
  const feeds: Record<string, ort.Tensor> = { [inputName]: input };
  const results = await session.run(feeds);
  const outKey = session.outputNames[0];
  if (!outKey || !results[outKey]) {
    throw new Error('U-2-Net returned no output tensor');
  }
  const maskTensor = results[outKey];
  const alpha = maskToAlpha(maskTensor, image.width, image.height);
  const composited = new Uint8ClampedArray(image.width * image.height * 4);
  for (let i = 0; i < image.width * image.height; i++) {
    composited[i * 4] = image.data[i * 4] ?? 0;
    composited[i * 4 + 1] = image.data[i * 4 + 1] ?? 0;
    composited[i * 4 + 2] = image.data[i * 4 + 2] ?? 0;
    composited[i * 4 + 3] = alpha[i * 4] ?? 0;
  }
  const compositeCanvas = document.createElement('canvas');
  compositeCanvas.width = image.width;
  compositeCanvas.height = image.height;
  const cctx = compositeCanvas.getContext('2d');
  if (!cctx) throw new Error('Canvas 2D context unavailable');
  const out = new ImageData(composited, image.width, image.height);
  cctx.putImageData(out, 0, 0);
  opts.onProgress?.(100);
  return new Promise<Blob>((resolve, reject) => {
    compositeCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error('Failed to encode composited PNG'));
    }, 'image/png');
  });
}
