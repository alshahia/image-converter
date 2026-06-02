import decodeJpeg from '@jsquash/jpeg/decode';
import encodeJpeg, { init as initJpeg } from '@jsquash/jpeg/encode';
import decodePng from '@jsquash/png/decode';
import encodePng, { init as initPng } from '@jsquash/png/encode';
import decodeWebp from '@jsquash/webp/decode';
import encodeWebp, { init as initWebp } from '@jsquash/webp/encode';

export type ImageFormat = 'jpeg' | 'png' | 'webp';

export interface ConvertRequest {
  id: number;
  from: ImageFormat;
  to: ImageFormat;
  buffer: ArrayBuffer;
  quality?: number;
}

export interface ConvertSuccess {
  id: number;
  ok: true;
  buffer: ArrayBuffer;
}

export interface ConvertFailure {
  id: number;
  ok: false;
  error: string;
}

export type ConvertResponse = ConvertSuccess | ConvertFailure;

const initPromises = new Map<string, Promise<void>>();

function ensureInit(codec: 'jpeg' | 'png' | 'webp'): Promise<void> {
  const existing = initPromises.get(codec);
  if (existing) return existing;
  const init = codec === 'jpeg' ? initJpeg() : codec === 'png' ? initPng() : initWebp();
  const promise = init.then(() => undefined);
  initPromises.set(codec, promise);
  return promise;
}

async function decode(format: ImageFormat, buffer: ArrayBuffer): Promise<ImageData> {
  if (format === 'jpeg') return decodeJpeg(buffer);
  if (format === 'png') return decodePng(buffer);
  return decodeWebp(buffer);
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
  return encodePng(data);
}

self.addEventListener('message', async (event: MessageEvent<ConvertRequest>) => {
  const { id, from, to, buffer, quality } = event.data;
  try {
    await Promise.all([ensureInit(from), ensureInit(to)]);
    const imageData = await decode(from, buffer);
    const result = await encode(to, imageData, quality);
    const response: ConvertSuccess = { id, ok: true, buffer: result };
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
