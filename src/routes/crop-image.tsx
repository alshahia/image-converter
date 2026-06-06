import { useCallback, useEffect, useMemo, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { CropOverlay } from '../components/tool/CropOverlay';
import { type CropRect } from '../hooks/useCropSelection';
import { ToolOptions } from '../components/tool/ToolOptions';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useConversion } from '../hooks/useConversion';
import { useSEO } from '../hooks/useSEO';
import { cropImage } from '../lib/conversions/image/crop';
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

const MIN_RECT_SIDE = 8;

function fullRect(w: number, h: number): CropRect {
  return { x: 0, y: 0, width: w, height: h };
}

export default function CropImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ width: number; height: number } | null>(null);
  const [rect, setRect] = useState<CropRect | null>(null);
  const [dimsError, setDimsError] = useState<string | null>(null);
  const { status, progress, result, error, run, cancel, reset } = useConversion(terminateWorker);

  useSEO(
    'Crop Image',
    'Crop an image visually. Drag the rectangle or resize it from the handles. No upload, no signup.',
  );

  useEffect(() => {
    void terminateWorker;
  }, []);

  useEffect(() => {
    if (!file) {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(null);
      setImageDims(null);
      setRect(null);
      setDimsError(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w === 0 || h === 0) {
        setDimsError('Could not read image dimensions.');
        return;
      }
      setImageDims({ width: w, height: h });
      setRect(fullRect(w, h));
    };
    img.onerror = () => {
      setDimsError('Could not load the image preview.');
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file, imageUrl]);

  const handleRectChange = useCallback((next: CropRect) => {
    setRect(next);
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
    reset();
  }, [cancel, reset]);

  const handleConvert = useCallback(async () => {
    if (!file || !rect) return;
    await run(cropImage(file, { rect }).then((r) => r.blob));
  }, [file, rect, run]);

  const outputMimeType = file?.type || 'image/png';
  const outputExtension = useMemo(() => {
    const mime = file?.type;
    if (mime === 'image/png') return 'png';
    if (mime === 'image/webp') return 'webp';
    return 'jpg';
  }, [file?.type]);

  const noChange =
    rect && imageDims && rect.x === 0 && rect.y === 0 && rect.width === imageDims.width && rect.height === imageDims.height;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="animate-fade-in space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Crop image</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Drag the rectangle to position, or grab a handle to resize. No upload, no signup.
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
          error={dimsError}
          onReset={handleRemove}
          title="Image could not be measured"
        />
      )}

      {file && imageUrl && imageDims && rect && status === 'idle' && (
        <ToolOptions title="Crop region">
          <div className="text-sm text-neutral-600 dark:text-neutral-400">
            Original: {imageDims.width} × {imageDims.height} px · Selection:{' '}
            <span className="font-mono">
              {rect.width} × {rect.height} px
            </span>
          </div>
          <CropOverlay
            imageWidth={imageDims.width}
            imageHeight={imageDims.height}
            rect={rect}
            onRectChange={handleRectChange}
            ariaLabel="Crop region"
          >
            <img
              src={imageUrl}
              alt="Crop preview"
              draggable={false}
              className="block h-full w-full select-none"
              style={{
                width: '100%',
                height: '100%',
                userSelect: 'none',
                pointerEvents: 'none',
              }}
            />
          </CropOverlay>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => setRect(fullRect(imageDims.width, imageDims.height))}
            >
              Reset
            </Button>
            <Button
              onClick={handleConvert}
              disabled={
                !!noChange ||
                rect.width < MIN_RECT_SIDE ||
                rect.height < MIN_RECT_SIDE
              }
            >
              {noChange ? 'No crop region selected' : 'Crop image'}
            </Button>
          </div>
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
              <p className="font-medium text-neutral-900 dark:text-neutral-100">Crop complete</p>
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
              Crop another file
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
