/**
 * EXIF stripping for JPEG.
 *
 * A standard JPEG is a sequence of segments, each prefixed with `0xFF` and a
 * marker byte. APP1 (`0xFFE1`) carries EXIF and XMP metadata. We walk the
 * segments, drop APP1, copy everything else through, and reassemble.
 *
 * This is a direct byte-level implementation — no data-URL round-trip, no
 * base64 inflation, no library to fork. Memory cost is 1:1 with the input.
 */

const SOI = 0xd8;
const EOI = 0xd9;
const SOS = 0xda;
const APP1 = 0xe1;
const TEM = 0x01;

function isStandaloneMarker(marker: number): boolean {
  return (marker >= 0xd0 && marker <= 0xd7) || marker === EOI || marker === TEM;
}

/**
 * Strips EXIF (and XMP, which also lives in APP1) from a JPEG byte sequence.
 * Returns a new Uint8Array. If the input is not a recognizable JPEG, returns
 * it unchanged. The original is never mutated.
 */
export function stripJpegExif(bytes: Uint8Array): Uint8Array {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== SOI) {
    return bytes;
  }

  const out: number[] = [];
  out.push(0xff, SOI);

  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) {
      // Malformed: not at a marker. Bail and return the original.
      return bytes;
    }
    i++;
    while (i < bytes.length && bytes[i] === 0xff) i++;
    if (i >= bytes.length) break;

    const marker = bytes[i];
    if (marker === undefined) break;
    i++;

    if (isStandaloneMarker(marker)) {
      out.push(0xff, marker);
      if (marker === EOI) return new Uint8Array(out);
      continue;
    }

    if (i + 2 > bytes.length) {
      // Truncated header. Append what we have and stop.
      return new Uint8Array(out);
    }
    const lenHi = bytes[i];
    const lenLo = bytes[i + 1];
    if (lenHi === undefined || lenLo === undefined) {
      return new Uint8Array(out);
    }
    const segLen = (lenHi << 8) | lenLo;
    const segEnd = i + segLen;
    if (segEnd > bytes.length) {
      // Truncated segment. Append the part we have and stop.
      out.push(0xff, marker);
      for (let j = i; j < bytes.length; j++) {
        out.push(bytes[j] as number);
      }
      return new Uint8Array(out);
    }

    if (marker === APP1) {
      // Drop EXIF / XMP. Jump past the segment.
      i = segEnd;
      continue;
    }

    if (marker === SOS) {
      // SOS is followed by the entropy-coded scan, which has no segment
      // structure. Copy marker + length + header, then raw scan to EOF.
      out.push(0xff, marker);
      for (let j = i; j < bytes.length; j++) {
        out.push(bytes[j] as number);
      }
      return new Uint8Array(out);
    }

    // Copy any other segment verbatim.
    out.push(0xff, marker);
    for (let j = i; j < segEnd; j++) {
      out.push(bytes[j] as number);
    }
    i = segEnd;
  }

  return new Uint8Array(out);
}

export async function stripExifFromJpeg(jpegBlob: Blob): Promise<Blob> {
  if (jpegBlob.type !== 'image/jpeg') {
    return jpegBlob;
  }
  const buffer = await jpegBlob.arrayBuffer();
  const input = new Uint8Array(buffer);
  const stripped = stripJpegExif(input);
  if (stripped === input) {
    return jpegBlob;
  }
  return new Blob([stripped.buffer as ArrayBuffer], { type: 'image/jpeg' });
}
