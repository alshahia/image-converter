export interface ImageFormat {
  family: 'jpeg' | 'png' | 'webp' | 'heic' | 'avif' | 'jxl' | 'unknown';
  isHeif: boolean;
}

const SIG_HEIC_BOX_SIZE: ReadonlyArray<number> = [0x00, 0x00, 0x00];
const SIG_HEIC_FTYP: ReadonlyArray<number> = [0x66, 0x74, 0x79, 0x70];

const SIG_JPEG: ReadonlyArray<number> = [0xff, 0xd8, 0xff];
const SIG_PNG: ReadonlyArray<number> = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const SIG_RIFF: ReadonlyArray<number> = [0x52, 0x49, 0x46, 0x46];
const SIG_GIF: ReadonlyArray<number> = [0x47, 0x49, 0x46, 0x38];

function startsWith(bytes: Uint8Array, sig: ReadonlyArray<number>): boolean {
  if (bytes.length < sig.length) return false;
  for (let i = 0; i < sig.length; i++) {
    if (bytes[i] !== sig[i]) return false;
  }
  return true;
}

export async function detectImageFormat(file: File | Blob): Promise<ImageFormat> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer).slice(0, 16);

  if (startsWith(bytes, SIG_JPEG)) return { family: 'jpeg', isHeif: false };
  if (startsWith(bytes, SIG_PNG)) return { family: 'png', isHeif: false };

  if (startsWith(bytes, SIG_HEIC_BOX_SIZE) && bytes.length >= 12) {
    const ftyp = Array.from(bytes.slice(4, 8));
    if (ftyp.every((b, i) => b === SIG_HEIC_FTYP[i])) {
      const b8 = bytes[8] ?? 0;
      const b9 = bytes[9] ?? 0;
      const b10 = bytes[10] ?? 0;
      const b11 = bytes[11] ?? 0;
      const brand = String.fromCharCode(b8, b9, b10, b11);
      const lower = brand.toLowerCase();
      const isHeif =
        lower.includes('heic') ||
        lower.includes('heix') ||
        lower.includes('hevc') ||
        lower.includes('heim') ||
        lower.includes('heis') ||
        lower.includes('mif1') ||
        lower.includes('msf1');
      return { family: isHeif ? 'heic' : 'unknown', isHeif };
    }
  }

  if (startsWith(bytes, SIG_RIFF) && bytes.length >= 12) {
    const webp = String.fromCharCode(bytes[8] ?? 0, bytes[9] ?? 0, bytes[10] ?? 0, bytes[11] ?? 0);
    if (webp === 'WEBP') return { family: 'webp', isHeif: false };
  }

  if (startsWith(bytes, SIG_GIF)) return { family: 'unknown', isHeif: false };

  return { family: 'unknown', isHeif: false };
}
