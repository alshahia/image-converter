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
import { removeBackground } from '../lib/conversions/image/ai/remove-background';
import { getModel } from '../lib/engines/aiModels';
import { terminateWorker } from '../lib/engines/jsquash';
import { humanReadableAccept } from '../lib/utils/fileValidation';
import { formatBytes, MAX_IMAGE_BYTES, WARN_IMAGE_BYTES } from '../lib/utils/guardRails';

const ACCEPT = ['.jpg', '.jpeg', '.png', '.webp', 'image/jpeg', 'image/png', 'image/webp'];
const MODEL = getModel('silueta');

export default function RemoveBackgroundPage() {
  useSEO(
    'Remove image background',
    'Remove the background from any photo, free. Runs entirely in your browser using a local AI model. PNG output with transparency.',
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
  const [modelReady, setModelReady] = useState(false);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    await run(removeBackground(file, { onProgress: setProgress }));
  }, [file, run, setProgress]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="animate-fade-in space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Remove image background</h1>
        <p className="text-neutral-600 dark:text-neutral-400">
          Drop a photo, get a PNG with a transparent background. Everything runs locally on your
          device.
        </p>
      </header>

      <AiDisclosure model={MODEL} />

      {!modelReady && <AiModelLoader model={MODEL} onLoaded={() => setModelReady(true)} />}

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
            Remove background
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
                Background removed
              </p>
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
