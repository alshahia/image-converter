import { type ReactNode, useCallback, useState } from 'react';
import { useConversion } from '../../hooks/useConversion';
import { useSEO } from '../../hooks/useSEO';
import { terminateWorker } from '../../lib/engines/jsquash';
import { humanReadableAccept, isAcceptedType } from '../../lib/utils/fileValidation';
import {
  MAX_IMAGE_BYTES,
  WARN_IMAGE_BYTES,
  checkFileSize,
  formatBytes,
} from '../../lib/utils/guardRails';
import { DownloadButton } from '../output/DownloadButton';
import { ErrorMessage } from '../processing/ErrorMessage';
import { ProcessingStatus } from '../processing/ProcessingStatus';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { DropZone } from '../upload/DropZone';
import { FilePreview } from '../upload/FilePreview';

export interface ToolPageProps {
  title: string;
  description: string;
  accept: ReadonlyArray<string>;
  convert: (file: File) => Promise<Blob>;
  outputMimeType: string;
  outputExtension: string;
  optionsComponent?: ReactNode;
  onCancel?: () => void;
  autoConvert?: boolean;
  validateFile?: (file: File) => string | null;
}

export function ToolPage({
  title,
  description,
  accept,
  convert,
  outputMimeType,
  outputExtension,
  optionsComponent,
  onCancel,
  autoConvert = true,
  validateFile,
}: ToolPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { status, progress, result, error, run, cancel, reset } = useConversion(
    onCancel ?? terminateWorker,
  );

  useSEO(title, description);

  const handleFile = useCallback(
    async (f: File | File[]) => {
      const first = Array.isArray(f) ? f[0] : f;
      if (!first) {
        setFileError('No file selected.');
        return;
      }
      setFileError(null);
      if (!isAcceptedType(first, accept)) {
        setFileError(
          `Expected ${humanReadableAccept(accept)}. Got ${first.type || 'unknown type'}.`,
        );
        return;
      }
      const sizeCheck = checkFileSize(first, MAX_IMAGE_BYTES, WARN_IMAGE_BYTES, 'file');
      if (sizeCheck.verdict === 'block') {
        setFileError(sizeCheck.reason);
        return;
      }
      if (validateFile) {
        const customError = validateFile(first);
        if (customError) {
          setFileError(customError);
          return;
        }
      }
      setFile(first);
      if (autoConvert) {
        const blob = await run(convert(first));
        void blob;
      }
    },
    [accept, autoConvert, convert, run, validateFile],
  );

  const handleRemove = useCallback(() => {
    cancel();
    setFile(null);
    setFileError(null);
    reset();
  }, [cancel, reset]);

  const handleRetry = useCallback(() => {
    if (!file) return;
    handleFile(file);
  }, [file, handleFile]);

  const handleConvert = useCallback(() => {
    if (!file) return;
    run(convert(file));
  }, [file, convert, run]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="animate-fade-in space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="text-neutral-600 dark:text-neutral-400">{description}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-neutral-500">
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
            {humanReadableAccept(accept)}
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
            EXIF stripped
          </span>
        </div>
      </header>

      {optionsComponent}

      {!file && !fileError && (
        <DropZone accept={accept} onFile={handleFile} hint={`${humanReadableAccept(accept)}`} />
      )}

      {fileError && (
        <ErrorMessage
          error={fileError}
          onReset={handleRemove}
          title="This file can't be processed"
        />
      )}

      {file && status === 'idle' && <FilePreview file={file} onRemove={handleRemove} />}

      {file && status === 'idle' && !autoConvert && (
        <div className="flex justify-center">
          <Button onClick={handleConvert}>Convert</Button>
        </div>
      )}

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} />
      )}

      {file && status === 'done' && result && (
        <Card className="animate-scale-in space-y-4">
          <div className="flex items-center gap-2.5">
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
                Conversion complete
              </p>
              <p className="text-sm text-neutral-500">
                {outputMimeType} &middot; {formatBytes(result.size)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <DownloadButton
              blob={result}
              inputName={file.name}
              outputExtension={outputExtension}
              outputMimeType={outputMimeType}
              label={`Download .${outputExtension}`}
            />
            <Button variant="secondary" onClick={handleRemove}>
              Convert another file
            </Button>
          </div>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleRetry} onReset={handleRemove} />
      )}
    </div>
  );
}
