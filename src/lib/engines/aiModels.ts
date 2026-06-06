export interface AiModel {
  readonly id: 'silueta' | 'realesrgan-x2plus' | 'realesrgan-x4plus';
  readonly path: string;
  readonly displayName: string;
  readonly description: string;
  readonly bytes: number;
  readonly license: 'Apache-2.0' | 'BSD-3-Clause';
  readonly attributionUrl: string;
  readonly attributionName: string;
}

export const AI_MODELS: ReadonlyArray<AiModel> = [
  {
    id: 'silueta',
    path: '/models/silueta.onnx',
    displayName: 'U-2-Net (silueta)',
    description: 'Salient object detection. Used for background removal.',
    bytes: 43 * 1024 * 1024,
    license: 'Apache-2.0',
    attributionUrl: 'https://github.com/xuebinqin/U-2-Net',
    attributionName: 'xuebinqin/U-2-Net (paper: Pattern Recognition 2020)',
  },
  {
    id: 'realesrgan-x2plus',
    path: '/models/realesrgan-x2plus.fp16.onnx',
    displayName: 'Real-ESRGAN 2x',
    description: '2x super-resolution. Best for moderate upscaling.',
    bytes: 34 * 1024 * 1024,
    license: 'BSD-3-Clause',
    attributionUrl: 'https://github.com/xinntao/Real-ESRGAN',
    attributionName: 'xinntao/Real-ESRGAN (BSD-3-Clause)',
  },
  {
    id: 'realesrgan-x4plus',
    path: '/models/realesrgan-x4plus.fp16.onnx',
    displayName: 'Real-ESRGAN 4x',
    description: '4x super-resolution. Higher enlargement, slower inference.',
    bytes: 34 * 1024 * 1024,
    license: 'BSD-3-Clause',
    attributionUrl: 'https://github.com/xinntao/Real-ESRGAN',
    attributionName: 'xinntao/Real-ESRGAN (BSD-3-Clause)',
  },
];

const MODEL_BY_ID: Record<AiModel['id'], AiModel> = {} as Record<AiModel['id'], AiModel>;
for (const m of AI_MODELS) {
  MODEL_BY_ID[m.id] = m;
}

export function getModel(id: AiModel['id']): AiModel {
  const m = MODEL_BY_ID[id];
  if (!m) throw new Error(`Unknown AI model: ${id}`);
  return m;
}

export function formatModelSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
}
