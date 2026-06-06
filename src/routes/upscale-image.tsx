import { useCallback, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { AiModelLoader } from '../components/processing/AiModelLoader';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { AiDisclosure } from '../components/tool/AiDisclosure';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useFileConversion } from '../hooks/useFileConversion';
import { useSEO } from '../hooks/useSEO';
import { type UpscaleModelId, upscale } from '../lib/conversions/image/ai/upscale';
import { AI_MODELS, type AiModel, getModel } from '../lib/engines/aiModels';
import { terminateWorker } from '../lib/engines/jsquash';
import { humanReadableAccept } from '../lib/utils/fileValidation';
import { formatBytes, MAX_IMAGE_BYTES, WARN_IMAGE_BYTES } from '../lib/utils/guardRails';

const ACCEPT = ['.jpg', '.jpeg', '.png', '.webp', 'image/jpeg', 'image/png', 'image/webp'];

const UPSCALE_MODELS = AI_MODELS.filter(
  (m): m is AiModel & { id: UpscaleModelId } =>
    m.id === 'realesrgan-x2plus' || m.id === 'realesrgan-x4plus',
);

export default function UpscaleImagePage() {
  useSEO(
    'Upscale image 2× or 4×',
    'Increase image resolution with AI super-resolution. Runs entirely in your browser.',
  );

  const [modelId, setModelId] = useState<UpscaleModelId>('realesrgan-x2plus');
  const model = getModel(modelId);
  const {
    file,
    fileError,
    handleFile,
    handleRemove,
    status,
    progress,
    result,
    error,
    run,
    cancel,
    setProgress,
  } = useFileConversion({
    accept: ACCEPT,
    maxBytes: MAX_IMAGE_BYTES,
    warnBytes: WARN_IMAGE_BYTES,
    onCancel: terminateWorker,
  });
  const [modelReady, setModelReady] = useState(false);

  const handleModelChange = useCallback((next: UpscaleModelId) => {
    setModelId(next);
    setModelReady(false);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    await run(upscale(file, { modelId, onProgress: setProgress }));
  }, [file, modelId, run, setProgress]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="animate-fade-in space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Upscale image</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Increase resolution with AI super-resolution. Choose 2× or 4×. Everything runs locally on
          your device.
        </p>
      </header>

      <AiDisclosure model={model} />

      <Card className="space-y-3">
        <label htmlFor="upscale-model" className="text-sm font-medium">
          Model
        </label>
        <select
          id="upscale-model"
          value={modelId}
          onChange={(e) => handleModelChange(e.target.value as UpscaleModelId)}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-base dark:border-neutral-700 dark:bg-neutral-900"
        >
          {UPSCALE_MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.displayName}
            </option>
          ))}
        </select>
        <p className="text-xs text-neutral-500">
          2× is faster and good for moderate upscaling. 4× gives more detail but takes longer.
        </p>
      </Card>

      {!modelReady && <AiModelLoader model={model} onLoaded={() => setModelReady(true)} />}

      {modelReady && !file && !fileError && (
        <DropZone accept={ACCEPT} onFile={handleFile} hint={humanReadableAccept(ACCEPT)} />
      )}

      {fileError && (
        <ErrorMessage
          error={fileError}
          onReset={handleRemove}
          title="This file can't be processed"
        />
      )}

      {file && status === 'idle' && <FilePreview file={file} onRemove={handleRemove} />}

      {file && status === 'idle' && (
        <div className="flex justify-center">
          <Button onClick={handleConvert} size="lg">
            Upscale
          </Button>
        </div>
      )}

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} />
      )}

      {file && status === 'done' && result && (
        <Card className="animate-scale-in space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="h-4 w-4"
                role="img"
                aria-label="Success"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">Upscale complete</p>
              <p className="text-sm text-neutral-500">image/png · {formatBytes(result.size)}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <DownloadButton
              blob={result}
              inputName={file.name}
              outputExtension="png"
              outputMimeType="image/png"
              label="Download .png"
            />
            <Button variant="secondary" onClick={handleRemove}>
              Convert another file
            </Button>
          </div>
        </Card>
      )}

      {file && status === 'error' && error && <ErrorMessage error={error} onReset={handleRemove} />}
    </div>
  );
}
