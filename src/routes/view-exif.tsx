import { useCallback, useEffect, useState } from 'react';
import { InfoPage, type InfoSection } from '../components/tool/InfoPage';
import { useSEO } from '../hooks/useSEO';
import { readExif } from '../lib/conversions/image/view-exif';
import { terminateWorker } from '../lib/engines/jsquash';
import {
  MAX_IMAGE_BYTES,
  WARN_IMAGE_BYTES,
  checkFileSize,
} from '../lib/utils/guardRails';
import { humanReadableAccept, isAcceptedType } from '../lib/utils/fileValidation';

const ACCEPT = ['.jpg', '.jpeg', 'image/jpeg'];

type ReadStatus = 'idle' | 'processing' | 'done' | 'error';

const SECTION_LABELS: Record<string, string> = {
  '0th': 'Main image (IFD0)',
  Exif: 'Camera settings (Exif IFD)',
  GPS: 'GPS location',
  '1st': 'Thumbnail (IFD1)',
  Interop: 'Interoperability',
};

function buildSections(fields: ReadonlyArray<{ ifd: string; label: string; value: string }>) {
  const byIfd = new Map<string, Array<{ label: string; value: string }>>();
  for (const field of fields) {
    const list = byIfd.get(field.ifd) ?? [];
    list.push({ label: field.label, value: field.value });
    byIfd.set(field.ifd, list);
  }
  const order = ['0th', 'Exif', 'GPS', 'Interop', '1st'];
  const sections: InfoSection[] = [];
  for (const ifd of order) {
    const fields = byIfd.get(ifd);
    if (!fields || fields.length === 0) continue;
    sections.push({ title: SECTION_LABELS[ifd] ?? ifd, fields });
  }
  return sections;
}

export default function ViewExifPage() {
  const [status, setStatus] = useState<ReadStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<ReadonlyArray<InfoSection>>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  useSEO(
    'View EXIF Data',
    'Read EXIF metadata from a JPEG image directly in your browser. View camera settings, GPS coordinates, and timestamps. No upload, no signup.',
  );

  useEffect(() => {
    void terminateWorker;
  }, []);

  const handleFile = useCallback(async (f: File | File[]) => {
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
    setStatus('processing');
    setError(null);
    setSections([]);
    try {
      const result = await readExif(first);
      if (result.error) {
        setError(result.error);
        setStatus('error');
        return;
      }
      if (!result.hasExif || result.fields.length === 0) {
        setError(null);
        setSections([]);
        setStatus('done');
        return;
      }
      setSections(
        buildSections(
          result.fields.map((f) => ({ ifd: f.ifd, label: f.name, value: f.value })),
        ),
      );
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, []);

  const handleReset = useCallback(() => {
    setStatus('idle');
    setError(null);
    setSections([]);
    setFileError(null);
  }, []);

  return (
    <InfoPage
      title="View EXIF Data"
      description="Read EXIF metadata (camera, GPS, timestamps) from a JPEG without uploading it. Everything runs locally in your browser."
      accept={ACCEPT}
      status={status}
      error={fileError ?? error}
      sections={sections}
      emptyMessage="This image has no EXIF metadata. It may have been stripped, or the file uses a format that does not carry EXIF."
      onFile={handleFile}
      onReset={handleReset}
    />
  );
}
