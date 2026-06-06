import { useCallback, useState } from 'react';
import { DownloadButton } from '../components/output/DownloadButton';
import { ErrorMessage } from '../components/processing/ErrorMessage';
import { ProcessingStatus } from '../components/processing/ProcessingStatus';
import { AiDisclosure, type AiDisclosureModel } from '../components/tool/AiDisclosure';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { DropZone } from '../components/upload/DropZone';
import { FilePreview } from '../components/upload/FilePreview';
import { useFileConversion } from '../hooks/useFileConversion';
import { useSEO } from '../hooks/useSEO';
import { smartCompress } from '../lib/conversions/image/ai/smart-compress';
import { terminateWorker } from '../lib/engines/jsquash';
import { humanReadableAccept } from '../lib/utils/fileValidation';
import { formatBytes, MAX_IMAGE_BYTES, WARN_IMAGE_BYTES } from '../lib/utils/guardRails';

const ACCEPT = ['.jpg', '.jpeg', '.png', '.webp', 'image/jpeg', 'image/png', 'image/webp'];

const CODEC_DISCLOSURE: AiDisclosureModel = {
  displayName: 'Smart codec compression',
  bytes: 0,
  license: 'Apache-2.0',
  attributionUrl: 'https://github.com/jakearchibald/squoosh',
  attributionName: 'jakearchibald/squoosh (jSquash codecs)',
};

function outputExtFor(mime: string | undefined): string {
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg';
}

export default function SmartCompressPage() {
  useSEO(
    'Smart compress to target size',
    'Compress JPG, PNG, or WebP to a target file size in KB. Quality auto-tuned locally in your browser.',
  );

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
  const [targetKB, setTargetKB] = useState(200);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    await run(smartCompress(file, { targetSizeKB: targetKB, onProgress: setProgress }));
  }, [file, targetKB, run, setProgress]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="animate-fade-in space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Smart compress</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Compress to a target file size. Quality is auto-tuned locally in your browser.
        </p>
      </header>

      <AiDisclosure model={CODEC_DISCLOSURE} />

      <Card className="space-y-3">
        <label htmlFor="target-kb" className="text-sm font-medium">
          Target size (KB)
        </label>
        <input
          id="target-kb"
          type="number"
          min={1}
          max={10000}
          value={targetKB}
          onChange={(e) => setTargetKB(Math.max(1, Number(e.target.value) || 1))}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2.5 text-base dark:border-neutral-700 dark:bg-neutral-900"
        />
        <p className="text-xs text-neutral-500">
          Output will be within ±10% of this size. For very small targets the engine may not be able
          to hit the goal — the smallest sensible result is returned instead.
        </p>
      </Card>

      {!file && !fileError && (
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
            Compress to {targetKB} KB
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
              <p className="font-medium text-neutral-900 dark:text-neutral-100">
                Compression complete
              </p>
              <p className="text-sm text-neutral-500">
                {result.type || file.type} · {formatBytes(result.size)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <DownloadButton
              blob={result}
              inputName={file.name}
              outputExtension={outputExtFor(result.type || file.type)}
              outputMimeType={result.type || file.type}
              label="Download"
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
