import { type ReactNode, useCallback, useState } from 'react';
import { useConversion } from '../../hooks/useConversion';
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
  validateFile,
}: ToolPageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const { status, progress, result, error, run, cancel, reset } = useConversion();

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
      const blob = await run(convert(first));
      void blob;
    },
    [accept, convert, run, validateFile],
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

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">{description}</p>
        <p className="mt-1 text-xs text-neutral-500">
          Accepts {humanReadableAccept(accept)} · Max {formatBytes(MAX_IMAGE_BYTES)} · EXIF stripped
        </p>
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

      {file && status === 'processing' && (
        <ProcessingStatus progress={progress} onCancel={cancel} />
      )}

      {file && status === 'done' && result && (
        <Card>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Converted to {outputMimeType} · {formatBytes(result.size)}
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
            Convert another file
          </button>
        </Card>
      )}

      {file && status === 'error' && error && (
        <ErrorMessage error={error} onRetry={handleRetry} onReset={handleRemove} />
      )}
    </div>
  );
}
