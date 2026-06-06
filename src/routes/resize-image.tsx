import { useCallback, useEffect, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { ToolOptions } from '../components/tool/ToolOptions';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Slider } from '../components/ui/slider';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useFileConversion } from '../hooks/useFileConversion';
import { useSEO } from '../hooks/useSEO';
import { resizeImage } from '../lib/conversions/image/resize';
import {
  computeResizeToFit,
  detectFormat,
  getImageDimensions,
  terminateWorker,
} from '../lib/engines/jsquash';
import { humanReadableAccept } from '../lib/utils/fileValidation';
import { formatBytes, MAX_IMAGE_BYTES, WARN_IMAGE_BYTES } from '../lib/utils/guardRails';

const ACCEPT = ['.jpg', '.jpeg', '.png', '.webp', 'image/jpeg', 'image/png', 'image/webp'];
const MIN_EDGE = 16;
const MAX_EDGE = 8000;

export default function ResizeImagePage() {
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
  } = useFileConversion({
    accept: ACCEPT,
    maxBytes: MAX_IMAGE_BYTES,
    warnBytes: WARN_IMAGE_BYTES,
    onCancel: terminateWorker,
  });
  const [originalDims, setOriginalDims] = useState<{ width: number; height: number } | null>(null);
  const [dimsError, setDimsError] = useState<string | null>(null);
  const [longestEdge, setLongestEdge] = useState(1920);

  useSEO(
    'Resize Image',
    'Resize images to exact dimensions. Aspect ratio is preserved. No upload, no signup.',
  );

  useEffect(() => {
    if (!file) {
      setOriginalDims(null);
      setDimsError(null);
      return;
    }
    let cancelled = false;
    setDimsError(null);
    (async () => {
      try {
        const dims = await getImageDimensions(file);
        if (cancelled) return;
        setOriginalDims(dims);
        setLongestEdge(Math.max(dims.width, dims.height));
      } catch (err) {
        if (cancelled) return;
        setDimsError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [file]);

  const targetDims = originalDims ? computeResizeToFit(originalDims, longestEdge) : null;
  const format = file ? detectFormat(file) : null;

  const handleConvert = useCallback(async () => {
    if (!file || !targetDims || !format) return;
    await run(resizeImage(file, { format, resize: targetDims }));
  }, [file, targetDims, format, run]);

  const noChange =
    targetDims &&
    originalDims &&
    targetDims.width === originalDims.width &&
    targetDims.height === originalDims.height;

  const outputMimeType = file?.type || 'image/jpeg';
  const outputExtension = (() => {
    const mime = file?.type;
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return 'jpg';
  })();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="animate-fade-in space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Resize image</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Resize an image to a target longest edge. Aspect ratio is preserved. No upload, no signup.
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

      {file && dimsError && (
        <ErrorMessage
          error={`Could not read image dimensions: ${dimsError}`}
          onReset={handleRemove}
          title="Image could not be measured"
        />
      )}

      {file && originalDims && targetDims && (
        <ToolOptions title="Resize">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Original: {originalDims.width} × {originalDims.height} px
          </div>
          <Slider
            id="resize-longest-edge"
            label="Longest edge"
            value={longestEdge}
            onChange={setLongestEdge}
            min={MIN_EDGE}
            max={MAX_EDGE}
            step={1}
          />
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            New size:{' '}
            <span className="font-mono">
              {targetDims.width} × {targetDims.height} px
            </span>
          </div>
          <Button onClick={handleConvert} disabled={status === 'processing' || !!noChange}>
            {noChange ? 'Already at target size' : 'Resize'}
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
              <p className="font-medium text-neutral-900 dark:text-neutral-100">Resize complete</p>
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
              Resize another file
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
