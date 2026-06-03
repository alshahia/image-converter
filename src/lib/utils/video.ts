export const INPUT_VIDEO_EXTENSIONS = [
  'mp4',
  'mov',
  'webm',
  'mkv',
  'avi',
  'flv',
  'm4v',
  'mpeg',
  'mpg',
];

export function inferVideoExtension(file: File | Blob, fallback: string): string {
  const fromName = file instanceof File ? file.name.split('.').pop()?.toLowerCase() : undefined;
  if (fromName && INPUT_VIDEO_EXTENSIONS.includes(fromName)) return fromName;
  const fromType = file.type;
  if (fromType === 'video/mp4') return 'mp4';
  if (fromType === 'video/quicktime') return 'mov';
  if (fromType === 'video/webm') return 'webm';
  if (fromType === 'video/x-matroska') return 'mkv';
  return fallback;
}
