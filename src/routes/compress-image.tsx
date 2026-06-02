import { useCallback, useState } from 'react';
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
import { compressImage } from '../lib/conversions/image/compress';
import { detectFormat } from '../lib/engines/jsquash';
import { humanReadableAccept, isAcceptedType } from '../lib/utils/fileValidation';
import {
  MAX_IMAGE_BYTES,
  WARN_IMAGE_BYTES,
  checkFileSize,
  formatBytes,
} from '../lib/utils/guardRails';

const ACCEPT = ['.jpg', '.jpeg', '.webp', 'image/jpeg', 'image/webp'];

export default function CompressImagePage() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [quality, setQuality] = useState(70);
  const { status, progress, result, error, run, cancel, reset } = useConversion();

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
    if (!file) return;
    const format = detectFormat(file);
    if (!format) return;
    await run(compressImage(file, { format, quality }));
  }, [file, quality, run]);

  const outputExtension = (() => {
    const mime = file?.type;
    if (mime === 'image/webp') return 'webp';
    return 'jpg';
  })();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Compress image</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Reduce the file size of a JPG or WebP image by re-encoding at a lower quality. No upload,
          no signup, EXIF stripped.
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          Accepts {humanReadableAccept(ACCEPT)} · Max {formatBytes(MAX_IMAGE_BYTES)} · EXIF stripped
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

      {file && (
        <ToolOptions title="Options">
          <Slider
            id="compress-quality"
            label="Quality"
            value={quality}
            onChange={setQuality}
            min={1}
            max={100}
            step={1}
          />
          <p className="text-xs text-neutral-500">
            Higher quality keeps more detail. 70 is a good default; below 50 shows visible
            artifacts.
          </p>
          <Button onClick={handleConvert} disabled={status === 'processing'}>
            Compress
          </Button>
        </ToolOptions>
      )}

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} />
      )}

      {file && status === 'done' && result && (
        <Card>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Compressed to {file.type} · {formatBytes(result.size)}
          </p>
          <div className="mt-4">
            <DownloadButton
              blob={result}
              inputName={file.name}
              outputExtension={outputExtension}
              outputMimeType={file.type}
              label={`Download .${outputExtension}`}
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="mt-3 text-sm text-neutral-500 underline hover:text-neutral-700 dark:hover:text-neutral-300"
          >
            Compress another file
          </button>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleConvert} onReset={handleRemove} />
      )}
    </div>
  );
}
