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
import { useConversion } from '../hooks/useConversion';
import { resizeImage } from '../lib/conversions/image/resize';
import {
  computeResizeToFit,
  detectFormat,
  getImageDimensions,
  terminateWorker,
} from '../lib/engines/jsquash';
import { humanReadableAccept, isAcceptedType } from '../lib/utils/fileValidation';
import {
  MAX_IMAGE_BYTES,
  WARN_IMAGE_BYTES,
  checkFileSize,
  formatBytes,
} from '../lib/utils/guardRails';

const ACCEPT = ['.jpg', '.jpeg', '.png', '.webp', 'image/jpeg', 'image/png', 'image/webp'];
const MIN_EDGE = 16;
const MAX_EDGE = 8000;

export default function ResizeImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [originalDims, setOriginalDims] = useState<{ width: number; height: number } | null>(null);
  const [dimsError, setDimsError] = useState<string | null>(null);
  const [longestEdge, setLongestEdge] = useState(1920);
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateWorker);

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
    setDimsError(null);
    reset();
  }, [cancel, reset]);

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
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Resize image</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Resize an image to a target longest edge. Aspect ratio is preserved. No upload, no signup.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Accepts {humanReadableAccept(ACCEPT)} · Max {formatBytes(MAX_IMAGE_BYTES)} · EXIF stripped
          for JPEG output
        </p>
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
        <Card>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Resized to {outputMimeType} · {formatBytes(result.size)}
          </p>
          <div className="mt-4">
            <DownloadButton
              blob={result}
              inputName={file.name}
              outputExtension={outputExtension}
              outputMimeType={outputMimeType}
              label={`Download .${outputExtension}`}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="mt-3 text-sm text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Resize another file
          </button>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleConvert} onReset={handleRemove} />
      )}
    </div>
  );
}
