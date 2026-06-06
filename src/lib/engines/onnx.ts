import * as ort from 'onnxruntime-web';
import ortWasmSimdMjsUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url';
import ortWasmSimdWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url';
import { type AiModel, getModel } from './aiModels';

let wasmPathsConfigured = false;

function configureWasmPaths(): void {
  if (wasmPathsConfigured) return;
  ort.env.wasm.wasmPaths = {
    mjs: ortWasmSimdMjsUrl,
    wasm: ortWasmSimdWasmUrl,
  };
  wasmPathsConfigured = true;
}

const sessionCache = new Map<AiModel['id'], ort.InferenceSession>();

const MAX_FETCH_ATTEMPTS = 3;
const RETRY_BASE_MS = 200;

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'));
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

async function fetchWithRetry(url: string, signal?: AbortSignal): Promise<Response> {
  let lastErrorMessage = '';
  for (let attempt = 0; attempt < MAX_FETCH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(url, { signal });
      if (response.ok) return response;
      if (response.status >= 400 && response.status < 500) {
        throw new Error(
          `Failed to fetch model: HTTP ${response.status} ${response.statusText}`,
        );
      }
      lastErrorMessage = `HTTP ${response.status} ${response.statusText}`;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') throw e;
      if (e instanceof Error && e.message.startsWith('Failed to fetch model: HTTP 4')) {
        throw e;
      }
      lastErrorMessage = e instanceof Error ? e.message : String(e);
    }
    if (attempt < MAX_FETCH_ATTEMPTS - 1) {
      await sleep(RETRY_BASE_MS * 2 ** attempt, signal);
    }
  }
  throw new Error(
    `Failed to fetch model after ${MAX_FETCH_ATTEMPTS} attempts: ${lastErrorMessage}`,
  );
}

export interface LoadModelOptions {
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}

export async function loadModel(
  id: AiModel['id'],
  opts: LoadModelOptions = {},
): Promise<ort.InferenceSession> {
  configureWasmPaths();
  const cached = sessionCache.get(id);
  if (cached) return cached;
  const model = getModel(id);
  const response = await fetchWithRetry(model.path, opts.signal);
  const total = Number(response.headers.get('content-length')) || model.bytes;
  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let loaded = 0;
  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.byteLength;
        opts.onProgress?.(loaded, total);
      }
    }
  } else {
    const buf = new Uint8Array(await response.arrayBuffer());
    chunks.push(buf);
    loaded = buf.byteLength;
    opts.onProgress?.(loaded, total);
  }
  const blob = new Blob(chunks as BlobPart[]);
  const buffer = await blob.arrayBuffer();
  const session = await ort.InferenceSession.create(buffer, {
    executionProviders: ['wasm'],
    graphOptimizationLevel: 'all',
  });
  sessionCache.set(id, session);
  return session;
}

export function releaseModel(id: AiModel['id']): void {
  const s = sessionCache.get(id);
  if (s) {
    void s.release();
    sessionCache.delete(id);
  }
}

export function releaseAllModels(): void {
  for (const [id, s] of sessionCache) {
    void s.release();
    sessionCache.delete(id);
  }
}

export { ort };
