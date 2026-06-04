import decodeAvif, { init as initAvif } from '@jsquash/avif/decode';
import encodeAvif, { init as initAvifEncode } from '@jsquash/avif/encode';
import decodeJpeg from '@jsquash/jpeg/decode';
import encodeJpeg, { init as initJpeg } from '@jsquash/jpeg/encode';
import decodeJxl, { init as initJxl } from '@jsquash/jxl/decode';
import encodeJxl, { init as initJxlEncode } from '@jsquash/jxl/encode';
import decodePng from '@jsquash/png/decode';
import encodePng, { init as initPng } from '@jsquash/png/encode';
import resize, { initResize } from '@jsquash/resize';
import decodeWebp from '@jsquash/webp/decode';
import encodeWebp, { init as initWebp } from '@jsquash/webp/encode';

export type ImageFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'jxl';

export type JsquashCodec = 'jpeg' | 'png' | 'webp' | 'avif' | 'jxl' | 'resize';

export interface ResizeSpec {
  width: number;
  height: number;
}

export interface ConvertRequest {
  id: number;
  from: ImageFormat;
  to: ImageFormat;
  buffer: ArrayBuffer;
  quality?: number;
  resize?: ResizeSpec;
}

export interface ConvertSuccess {
  id: number;
  ok: true;
  buffer: ArrayBuffer;
  width: number;
  height: number;
}

export interface ConvertFailure {
  id: number;
  ok: false;
  error: string;
}

export type ConvertResponse = ConvertSuccess | ConvertFailure;

const initPromises = new Map<JsquashCodec, Promise<void>>();

function ensureInit(codec: JsquashCodec): Promise<void> {
  const existing = initPromises.get(codec);
  if (existing) return existing;
  let init: Promise<unknown>;
  switch (codec) {
    case 'jpeg':
      init = initJpeg();
      break;
    case 'png':
      init = initPng();
      break;
    case 'webp':
      init = initWebp();
      break;
    case 'avif':
      init = Promise.all([initAvif(), initAvifEncode()]);
      break;
    case 'jxl':
      init = Promise.all([initJxl(), initJxlEncode()]);
      break;
    case 'resize':
      init = initResize();
      break;
  }
  const promise = init.then(() => undefined);
  initPromises.set(codec, promise);
  return promise;
}

async function decode(format: ImageFormat, buffer: ArrayBuffer): Promise<ImageData> {
  if (format === 'jpeg') return decodeJpeg(buffer);
  if (format === 'png') return decodePng(buffer);
  if (format === 'webp') return decodeWebp(buffer);
  if (format === 'avif') {
    const decoded = await decodeAvif(buffer);
    if (!decoded) throw new Error('avif decode returned null');
    return decoded;
  }
  if (format === 'jxl') return decodeJxl(buffer);
  throw new Error(`${format} decode is not supported`);
}

async function encode(
  format: ImageFormat,
  data: ImageData,
  quality?: number,
): Promise<ArrayBuffer> {
  if (format === 'jpeg') {
    const q = quality != null ? quality / 100 : undefined;
    return encodeJpeg(data, q != null ? { quality: q } : undefined);
  }
  if (format === 'webp') {
    const q = quality != null ? quality / 100 : undefined;
    return encodeWebp(data, q != null ? { quality: q } : undefined);
  }
  if (format === 'png') return encodePng(data);
  if (format === 'avif') {
    const q = quality != null ? quality / 100 : undefined;
    return encodeAvif(data, q != null ? { quality: q } : {});
  }
  if (format === 'jxl') {
    const q = quality != null ? quality / 100 : undefined;
    return encodeJxl(data, q != null ? { quality: q } : {});
  }
  throw new Error(`${format} encode is not supported`);
}

self.addEventListener('message', async (event: MessageEvent<ConvertRequest>) => {
  const { id, from, to, buffer, quality, resize: resizeSpec } = event.data;
  try {
    await Promise.all([ensureInit(from), ensureInit(to)]);
    let imageData = await decode(from, buffer);
    if (resizeSpec) {
      await ensureInit('resize');
      imageData = await resize(imageData, {
        width: resizeSpec.width,
        height: resizeSpec.height,
        fitMethod: 'stretch',
      });
    }
    const result = await encode(to, imageData, quality);
    const response: ConvertSuccess = {
      id,
      ok: true,
      buffer: result,
      width: imageData.width,
      height: imageData.height,
    };
    self.postMessage(response, [result]);
  } catch (err) {
    const response: ConvertFailure = {
      id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
    self.postMessage(response);
  }
});
