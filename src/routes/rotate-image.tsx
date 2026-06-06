import { useCallback, useEffect, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { ToolOptions } from '../components/tool/ToolOptions';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useConversion } from '../hooks/useConversion';
import { useSEO } from '../hooks/useSEO';
import { type Rotation, rotateFlipImage } from '../lib/conversions/image/rotate-flip';
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

const ROTATIONS: ReadonlyArray<{ value: Rotation; label: string }> = [
  { value: 0, label: '0°' },
  { value: 90, label: '90°' },
  { value: 180, label: '180°' },
  { value: 270, label: '270°' },
];

export default function RotateImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateWorker);

  useSEO(
    'Rotate Image',
    'Rotate images by 90, 180, or 270 degrees, or flip them horizontally or vertically. No upload, no signup.',
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
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    reset();
  }, [cancel, reset]);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    await run(
      rotateFlipImage(file, { rotation, flipHorizontal: flipH, flipVertical: flipV }).then(
        (r) => r.blob,
      ),
    );
  }, [file, rotation, flipH, flipV, run]);

  const noChange = rotation === 0 && !flipH && !flipV;

  const outputMimeType = file?.type || 'image/png';
  const outputExtension = (() => {
    const mime = file?.type;
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return 'jpg';
  })();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="animate-fade-in space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Rotate image</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Rotate by 90°, 180°, or 270°, or flip horizontally or vertically. Aspect ratio is
          preserved. No upload, no signup.
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
        <ToolOptions title="Rotate and flip">
          <div className="grid grid-cols-4 gap-1.5" role="radiogroup" aria-label="Rotation">
            {ROTATIONS.map((opt) => {
              const active = rotation === opt.value;
              return (
                <label
                  key={opt.value}
                  className={`flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-200 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 ${
                    active
                      ? 'border-accent bg-accent text-white shadow-drift-card dark:bg-accent dark:text-white'
                      : 'border-white/60 bg-glass-soft text-ink hover:bg-glass-strong dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-inverse dark:hover:bg-white/[0.08]'
                  }`}
                >
                  <input
                    type="radio"
                    name="rotation"
                    value={opt.value}
                    checked={active}
                    onChange={() => setRotation(opt.value)}
                    className="sr-only"
                  />
                  <span aria-hidden="true">{opt.label}</span>
                  <span className="sr-only">{`Rotate ${opt.value} degrees`}</span>
                </label>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/60 bg-glass-soft text-xs font-semibold text-ink hover:bg-glass-strong focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-inverse dark:hover:bg-white/[0.08]">
              <input
                type="checkbox"
                checked={flipH}
                onChange={(e) => setFlipH(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-accent"
              />
              Flip horizontal
            </label>
            <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/60 bg-glass-soft text-xs font-semibold text-ink hover:bg-glass-strong focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-inverse dark:hover:bg-white/[0.08]">
              <input
                type="checkbox"
                checked={flipV}
                onChange={(e) => setFlipV(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-accent"
              />
              Flip vertical
            </label>
          </div>

          <Button onClick={handleConvert} disabled={noChange}>
            {noChange ? 'No changes to apply' : 'Apply'}
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
                Rotation complete
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
              Rotate another file
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
