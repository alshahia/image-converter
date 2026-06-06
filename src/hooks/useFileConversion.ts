import { useCallback, useState } from 'react';
import { useConversion, type UseConversionResult } from './useConversion';
import { checkFileSize } from '../lib/utils/guardRails';
import { detectImageFormat } from '../lib/utils/formatDetection';
import { humanReadableAccept, isAcceptedType } from '../lib/utils/fileValidation';

export interface UseFileConversionOptions {
  /** Accept tokens; format matches `<input accept>` (`.jpg`, `image/jpeg`, `image/*`). */
  accept: ReadonlyArray<string>;
  /** Hard cap (bytes). Files above are blocked. */
  maxBytes: number;
  /** Soft cap (bytes). Files above emit a warn verdict but are still accepted. */
  warnBytes: number;
  /**
   * Optional worker teardown called when the user cancels a conversion
   * (e.g. `terminateWorker` for jsquash). Routes with non-jsquash engines
   * (AI, ffmpeg) can omit this.
   */
  onCancel?: () => void;
}

export interface UseFileConversionResult {
  file: File | null;
  fileError: string | null;
  handleFile: (f: File | File[]) => void;
  handleRemove: () => void;
  status: UseConversionResult['status'];
  progress: number;
  result: Blob | null;
  error: Error | null;
  run: UseConversionResult['run'];
  cancel: () => void;
  reset: () => void;
  setProgress: (pct: number) => void;
}

/**
 * Scaffolds the file-pick → validate → convert → cancel pattern shared by
 * most image tools. Encapsulates the accept list + size guard + per-route
 * reset/cancel pairing. Routes still own the `run()` factory (e.g. what
 * conversion function to call) and the per-route option state.
 */
export function useFileConversion(options: UseFileConversionOptions): UseFileConversionResult {
  const { accept, maxBytes, warnBytes, onCancel } = options;
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const conversion = useConversion(onCancel);

  const handleFile = useCallback(
    (f: File | File[]) => {
      const first = Array.isArray(f) ? f[0] : f;
      if (!first) {
        setFileError('No file selected.');
        return;
      }
      setFileError(null);
      if (!isAcceptedType(first, accept)) {
        setFileError(`Expected ${humanReadableAccept(accept)}. Got ${first.type || 'unknown type'}.`);
        return;
      }
      const sizeCheck = checkFileSize(first, maxBytes, warnBytes, 'file');
      if (sizeCheck.verdict === 'block') {
        setFileError(sizeCheck.reason);
        return;
      }
      // Magic-byte check: catches the "file.png that's actually a JPEG" case
      // where the extension / MIME type lies. Only runs when the accept
      // list contains a known image family; unknown families (BMP, TIFF,
      // SVG, GIF, raw formats) skip the check because their detector
      // signature is incomplete.
      const acceptFamilies = collectImageFamilies(accept);
      if (acceptFamilies.size > 0) {
        void detectImageFormat(first).then((detected) => {
          if (detected.family === 'unknown') return;
          if (acceptFamilies.has(detected.family)) return;
          setFileError(
            `File looks like ${detected.family.toUpperCase()} but the accepted formats are ${[...acceptFamilies].join(', ')}.`,
          );
          setFile((current) => (current === first ? null : current));
        });
      }
      setFile(first);
      conversion.reset();
    },
    [accept, maxBytes, warnBytes, conversion],
  );

  const handleRemove = useCallback(() => {
    conversion.cancel();
    setFile(null);
    setFileError(null);
    conversion.reset();
  }, [conversion]);

  return {
    file,
    fileError,
    handleFile,
    handleRemove,
    status: conversion.status,
    progress: conversion.progress,
    result: conversion.result,
    error: conversion.error,
    run: conversion.run,
    cancel: conversion.cancel,
    reset: conversion.reset,
    setProgress: conversion.setProgress,
  };
}

function collectImageFamilies(accept: ReadonlyArray<string>): Set<string> {
  const families = new Set<string>();
  for (const tokenRaw of accept) {
    const t = tokenRaw.toLowerCase();
    if (t === '.jpg' || t === '.jpeg' || t === 'image/jpeg') families.add('jpeg');
    else if (t === '.png' || t === 'image/png') families.add('png');
    else if (t === '.webp' || t === 'image/webp') families.add('webp');
    else if (
      t === '.heic' ||
      t === '.heif' ||
      t === 'image/heic' ||
      t === 'image/heif' ||
      t === 'image/heic-sequence' ||
      t === 'image/heif-sequence'
    )
      families.add('heic');
  }
  return families;
}
