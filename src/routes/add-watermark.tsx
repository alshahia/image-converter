import { useCallback, useEffect, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import {
  type WatermarkControlsState,
  WatermarkControls,
} from '../components/tool/WatermarkControls';
import { ToolOptions } from '../components/tool/ToolOptions';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useConversion } from '../hooks/useConversion';
import { useSEO } from '../hooks/useSEO';
import { watermarkImage } from '../lib/conversions/image/watermark';
import { terminateWorker } from '../lib/engines/jsquash';
import { formatBytes } from '../lib/utils/guardRails';
import {
  MAX_IMAGE_BYTES,
  WARN_IMAGE_BYTES,
  checkFileSize,
} from '../lib/utils/guardRails';
import { humanReadableAccept, isAcceptedType } from '../lib/utils/fileValidation';

const ACCEPT = [
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  'image/jpeg',
  'image/png',
  'image/webp',
];

const DEFAULT_STATE: WatermarkControlsState = {
  mode: 'text',
  text: '© Your name',
  position: 'bottom-right',
  opacity: 0.6,
  fontSize: 48,
  color: '#ffffff',
  imageFile: null,
  imageScale: 0.2,
};

export default function AddWatermarkPage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [controls, setControls] = useState<WatermarkControlsState>(DEFAULT_STATE);
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateWorker);

  useSEO(
    'Add Watermark',
    'Stamp a text or image watermark on a photo. Adjust position, opacity, and size. No upload, no signup.',
  );

  useEffect(() => {
    void terminateWorker;
  }, []);

  const handleFile = useCallback(
    (f: File | File[]) => {
      const first = Array.isArray(f) ? f[0] : f;
      if (!first) {
        setFileError('No file selected.');
        return;
      }
      setFileError(null);
      if (!isAcceptedType(first, ACCEPT)) {
        setFileError(
          `Expected ${humanReadableAccept(ACCEPT)}. Got ${first.type || 'unknown type'}.`,
        );
        return;
      }
      const sizeCheck = checkFileSize(first, MAX_IMAGE_BYTES, WARN_IMAGE_BYTES, 'file');
      if (sizeCheck.verdict === 'block') {
        setFileError(sizeCheck.reason);
        return;
      }
      setFile(first);
      reset();
    },
    [reset],
  );

  const handleRemove = useCallback(() => {
    cancel();
    setFile(null);
    setFileError(null);
    setControls(DEFAULT_STATE);
    reset();
  }, [cancel, reset]);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    if (controls.mode === 'image' && !controls.imageFile) return;
    if (controls.mode === 'text' && controls.text.trim().length === 0) return;
    const options =
      controls.mode === 'text'
        ? {
            mode: 'text' as const,
            text: controls.text,
            position: controls.position,
            opacity: controls.opacity,
            fontSize: controls.fontSize,
            color: controls.color,
          }
        : {
            mode: 'image' as const,
            image: controls.imageFile as File,
            position: controls.position,
            opacity: controls.opacity,
            scale: controls.imageScale,
          };
    await run(watermarkImage(file, options).then((r) => r.blob));
  }, [file, controls, run]);

  const outputMimeType = file?.type || 'image/png';
  const outputExtension = (() => {
    const mime = file?.type;
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return 'jpg';
  })();

  const readyToApply =
    file !== null &&
    (controls.mode === 'image' ? controls.imageFile !== null : controls.text.trim().length > 0);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="animate-fade-in space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Add watermark</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Stamp a text or image watermark on a photo. Pick a position, adjust opacity, and
          download. No upload, no signup.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3 w-3"
              role="img"
              aria-label="Accepted formats"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            {humanReadableAccept(ACCEPT)}
          </span>
          <span className="inline-flex items-center gap-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3 w-3"
              role="img"
              aria-label="Maximum file size"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
            Max {formatBytes(MAX_IMAGE_BYTES)}
          </span>
          <span className="inline-flex items-center gap-1">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-3 w-3"
              role="img"
              aria-label="EXIF stripped"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            EXIF stripped for JPEG output
          </span>
        </div>
      </header>

      {fileError && (
        <ErrorMessage
          error={fileError}
          onReset={handleRemove}
          title="This file can't be processed"
        />
      )}

      {!file && !fileError && (
        <DropZone accept={ACCEPT} onFile={handleFile} hint={humanReadableAccept(ACCEPT)} />
      )}

      {file && <FilePreview file={file} onRemove={handleRemove} />}

      {file && status === 'idle' && (
        <ToolOptions title="Watermark">
          <WatermarkControls value={controls} onChange={setControls} />
          <Button onClick={handleConvert} disabled={!readyToApply}>
            Apply watermark
          </Button>
        </ToolOptions>
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
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                Watermark applied
              </p>
              <p className="text-sm text-neutral-500">
                {outputMimeType} · {formatBytes(result.size)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <DownloadButton
              blob={result}
              inputName={file.name}
              outputExtension={outputExtension}
              outputMimeType={outputMimeType}
              label={`Download .${outputExtension}`}
            />
            <Button variant="secondary" onClick={handleRemove}>
              Watermark another file
            </Button>
          </div>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleConvert} onReset={handleRemove} />
      )}
    </div>
  );
}
