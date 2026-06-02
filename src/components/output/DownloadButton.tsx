import { useEffect, useRef, useState } from 'react';
import { downloadBlob, inferOutputName } from '../../lib/utils/download';
import { Button } from '../ui/button';

export interface DownloadButtonProps {
  blob: Blob;
  inputName: string;
  outputExtension: string;
  outputMimeType: string;
  label?: string;
}

export function DownloadButton({
  blob,
  inputName,
  outputExtension,
  outputMimeType,
  label = 'Download',
}: DownloadButtonProps) {
  const [url, setUrl] = useState<string | null>(null);
  const prevUrl = useRef<string | null>(null);

  useEffect(() => {
    if (prevUrl.current) {
      URL.revokeObjectURL(prevUrl.current);
    }
    const next = URL.createObjectURL(blob);
    prevUrl.current = next;
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
      prevUrl.current = null;
    };
  }, [blob]);

  if (!url) return null;

  const filename = inferOutputName(inputName, outputExtension);

  return (
    <Button
      onClick={() => downloadBlob(blob, filename)}
      size="lg"
      aria-label={`Download ${filename} as ${outputMimeType}`}
    >
      {label}
    </Button>
  );
}
