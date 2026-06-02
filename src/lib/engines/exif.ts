import piexif from 'piexifjs';

const JPEG_DATA_URL_PREFIX = 'data:image/jpeg;base64,';

export async function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('FileReader did not return a string'));
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
    reader.readAsDataURL(blob);
  });
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  if (!header || !base64) throw new Error('Invalid data URL');
  const mimeMatch = header.match(/data:([^;]+)(?:;base64)?/);
  const mime = mimeMatch?.[1] ?? 'application/octet-stream';
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

export async function stripExifFromJpeg(jpegBlob: Blob): Promise<Blob> {
  if (jpegBlob.type !== 'image/jpeg') {
    return jpegBlob;
  }
  const dataUrl = await blobToDataUrl(jpegBlob);
  if (!dataUrl.startsWith(JPEG_DATA_URL_PREFIX)) {
    return jpegBlob;
  }
  const strippedDataUrl = piexif.remove(dataUrl);
  return dataUrlToBlob(strippedDataUrl);
}

export function hasExif(jpegBlob: Blob): boolean {
  if (jpegBlob.type !== 'image/jpeg') return false;
  return false;
}
