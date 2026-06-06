/**
 * Minimal EXIF (and TIFF/IFD) reader.
 *
 * Scans a JPEG byte stream for an APP1 segment with an EXIF header
 * (`Exif\0\0`) and walks the IFD chain. Returns a flat list of
 * {ifd, tag, name, value} entries with common tag names resolved.
 *
 * Only JPEG inputs are supported here. EXIF in TIFF, WebP, HEIC, and
 * other formats has different framing and is not implemented.
 *
 * This is intentionally a small, dependency-free parser. It does not
 * attempt to interpret maker-note blocks or every niche vendor tag.
 */

export interface ExifField {
  readonly ifd: '0th' | 'Exif' | 'GPS' | '1st' | 'Interop';
  readonly tag: number;
  readonly name: string;
  readonly value: string;
}

export interface ExifReadResult {
  readonly hasExif: boolean;
  readonly fields: ReadonlyArray<ExifField>;
  readonly error: string | null;
}

export type ExifData = ExifReadResult;

const EXIF_HEADER = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00] as const;

const TYPE_SIZES: Record<number, number> = {
  1: 1,
  2: 1,
  3: 2,
  4: 4,
  5: 8,
  6: 1,
  7: 1,
  8: 2,
  9: 4,
  10: 8,
  11: 4,
  12: 8,
};

const TYPE_NAMES: Record<number, string> = {
  1: 'BYTE',
  2: 'ASCII',
  3: 'SHORT',
  4: 'LONG',
  5: 'RATIONAL',
  6: 'SBYTE',
  7: 'UNDEFINED',
  8: 'SSHORT',
  9: 'SLONG',
  10: 'SRATIONAL',
  11: 'FLOAT',
  12: 'DOUBLE',
};

const TAG_NAMES_0TH: Record<number, string> = {
  256: 'ImageWidth',
  257: 'ImageLength',
  258: 'BitsPerSample',
  259: 'Compression',
  270: 'ImageDescription',
  271: 'Make',
  272: 'Model',
  274: 'Orientation',
  282: 'XResolution',
  283: 'YResolution',
  296: 'ResolutionUnit',
  305: 'Software',
  306: 'DateTime',
  315: 'Artist',
  318: 'WhitePoint',
  319: 'PrimaryChromaticities',
  529: 'YCbCrCoefficients',
  531: 'YCbCrPositioning',
  532: 'ReferenceBlackWhite',
  33432: 'Copyright',
  34665: 'ExifIFDPointer',
  34853: 'GPSIFDPointer',
};

const TAG_NAMES_EXIF: Record<number, string> = {
  33434: 'ExposureTime',
  33437: 'FNumber',
  34850: 'ExposureProgram',
  34855: 'ISOSpeedRatings',
  36864: 'ExifVersion',
  36867: 'DateTimeOriginal',
  36868: 'DateTimeDigitized',
  37121: 'ComponentsConfiguration',
  37377: 'ShutterSpeedValue',
  37378: 'ApertureValue',
  37379: 'BrightnessValue',
  37380: 'ExposureBiasValue',
  37381: 'MaxApertureValue',
  37383: 'MeteringMode',
  37384: 'LightSource',
  37385: 'Flash',
  37386: 'FocalLength',
  37500: 'MakerNote',
  37510: 'UserComment',
  40960: 'FlashpixVersion',
  40961: 'ColorSpace',
  40962: 'PixelXDimension',
  40963: 'PixelYDimension',
  40965: 'InteroperabilityIFDPointer',
  41486: 'FocalPlaneXResolution',
  41487: 'FocalPlaneYResolution',
  41488: 'FocalPlaneResolutionUnit',
  41495: 'SensingMethod',
  41728: 'FileSource',
  41729: 'SceneType',
  41730: 'CFAPattern',
  41985: 'CustomRendered',
  41986: 'ExposureMode',
  41987: 'WhiteBalance',
  41988: 'DigitalZoomRatio',
  41989: 'FocalLengthIn35mmFilm',
  41990: 'SceneCaptureType',
  41991: 'GainControl',
  41992: 'Contrast',
  41993: 'Saturation',
  41994: 'Sharpness',
  41996: 'SubjectDistanceRange',
  42016: 'ImageUniqueID',
  42032: 'OwnerName',
  42033: 'BodySerialNumber',
  42034: 'LensSpecification',
  42035: 'LensMake',
  42036: 'LensModel',
  42037: 'LensSerialNumber',
};

const TAG_NAMES_GPS: Record<number, string> = {
  0: 'GPSVersionID',
  1: 'GPSLatitudeRef',
  2: 'GPSLatitude',
  3: 'GPSLongitudeRef',
  4: 'GPSLongitude',
  5: 'GPSAltitudeRef',
  6: 'GPSAltitude',
  7: 'GPSTimeStamp',
  8: 'GPSSatellites',
  9: 'GPSStatus',
  10: 'GPSMeasureMode',
  11: 'GPSDOP',
  12: 'GPSSpeedRef',
  13: 'GPSSpeed',
  14: 'GPSTrackRef',
  15: 'GPSTrack',
  16: 'GPSImgDirectionRef',
  17: 'GPSImgDirection',
  18: 'GPSMapDatum',
  19: 'GPSDestLatitudeRef',
  20: 'GPSDestLatitude',
  21: 'GPSDestLongitudeRef',
  22: 'GPSDestLongitude',
  29: 'GPSDateStamp',
};

const TAG_NAMES_1ST: Record<number, string> = {
  512: 'JPEGProc',
  513: 'ThumbnailOffset',
  514: 'ThumbnailLength',
};

const TAG_NAMES_INTEROP: Record<number, string> = {
  1: 'InteroperabilityIndex',
  2: 'InteroperabilityVersion',
};

const TAG_NAMES_BY_IFD: Record<
  '0th' | 'Exif' | 'GPS' | '1st' | 'Interop',
  Record<number, string>
> = {
  '0th': TAG_NAMES_0TH,
  Exif: TAG_NAMES_EXIF,
  GPS: TAG_NAMES_GPS,
  '1st': TAG_NAMES_1ST,
  Interop: TAG_NAMES_INTEROP,
};

function findExifSegment(bytes: Uint8Array): { offset: number; length: number } | null {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let i = 2;
  while (i < bytes.length) {
    if (bytes[i] !== 0xff) return null;
    i++;
    while (i < bytes.length && bytes[i] === 0xff) i++;
    if (i >= bytes.length) return null;
    const marker = bytes[i];
    i++;
    if (marker === 0xd8 || marker === 0xd9) return null;
    if (marker === 0xda) return null;
    if (i + 2 > bytes.length) return null;
    const segLen = ((bytes[i] ?? 0) << 8) | (bytes[i + 1] ?? 0);
    if (segLen < 2) return null;
    const segDataStart = i + 2;
    const segEnd = i + segLen;
    if (marker === 0xe1 && segEnd <= bytes.length) {
      if (matchesExifHeader(bytes, segDataStart)) {
        return { offset: segDataStart + EXIF_HEADER.length, length: segEnd - segDataStart };
      }
    }
    i = segEnd;
  }
  return null;
}

function matchesExifHeader(bytes: Uint8Array, start: number): boolean {
  if (start + EXIF_HEADER.length > bytes.length) return false;
  for (let i = 0; i < EXIF_HEADER.length; i++) {
    if (bytes[start + i] !== EXIF_HEADER[i]) return false;
  }
  return true;
}

interface Reader {
  u16(offset: number): number;
  u32(offset: number): number;
  s16(offset: number): number;
}

function makeReader(bytes: Uint8Array, baseOffset: number, littleEndian: boolean): Reader {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return {
    u16(offset) {
      return dv.getUint16(baseOffset + offset, littleEndian);
    },
    u32(offset) {
      return dv.getUint32(baseOffset + offset, littleEndian);
    },
    s16(offset) {
      return dv.getInt16(baseOffset + offset, littleEndian);
    },
  };
}

function readValue(
  bytes: Uint8Array,
  baseOffset: number,
  typeId: number,
  count: number,
  valueOffset: number,
  littleEndian: boolean,
): unknown {
  const typeSize = TYPE_SIZES[typeId] ?? 0;
  if (typeSize === 0) return null;
  const total = typeSize * count;
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  if (total <= 4) {
    return readScalar(dv, baseOffset + valueOffset, typeId, littleEndian, count);
  }
  return readArray(dv, baseOffset + valueOffset, typeId, count, littleEndian);
}

function readScalar(
  dv: DataView,
  offset: number,
  typeId: number,
  littleEndian: boolean,
  count: number,
): unknown {
  if (count > 1) {
    return readArray(dv, offset, typeId, count, littleEndian);
  }
  switch (typeId) {
    case 1:
    case 7:
      return dv.getUint8(offset);
    case 2:
      return readAsciiString(dv, offset, 1);
    case 3:
      return dv.getUint16(offset, littleEndian);
    case 4:
      return dv.getUint32(offset, littleEndian);
    case 5:
      return null;
    case 6:
      return dv.getInt8(offset);
    case 8:
      return dv.getInt16(offset, littleEndian);
    case 9:
      return dv.getInt32(offset, littleEndian);
    case 10:
      return null;
    case 11:
      return dv.getFloat32(offset, littleEndian);
    case 12:
      return dv.getFloat64(offset, littleEndian);
    default:
      return null;
  }
}

function readArray(
  dv: DataView,
  offset: number,
  typeId: number,
  count: number,
  littleEndian: boolean,
): unknown[] {
  const out: unknown[] = [];
  for (let i = 0; i < count; i++) {
    const step = TYPE_SIZES[typeId] ?? 0;
    const at = offset + i * step;
    switch (typeId) {
      case 1:
        out.push(dv.getUint8(at));
        break;
      case 2:
        out.push(dv.getUint8(at));
        break;
      case 3:
        out.push(dv.getUint16(at, littleEndian));
        break;
      case 4:
        out.push(dv.getUint32(at, littleEndian));
        break;
      case 5: {
        const num = dv.getUint32(at, littleEndian);
        const den = dv.getUint32(at + 4, littleEndian);
        out.push(den === 0 ? null : num / den);
        break;
      }
      case 6:
        out.push(dv.getInt8(at));
        break;
      case 7:
        out.push(dv.getUint8(at));
        break;
      case 8:
        out.push(dv.getInt16(at, littleEndian));
        break;
      case 9:
        out.push(dv.getInt32(at, littleEndian));
        break;
      case 10: {
        const num = dv.getInt32(at, littleEndian);
        const den = dv.getInt32(at + 4, littleEndian);
        out.push(den === 0 ? null : num / den);
        break;
      }
      case 11:
        out.push(dv.getFloat32(at, littleEndian));
        break;
      case 12:
        out.push(dv.getFloat64(at, littleEndian));
        break;
      default:
        out.push(null);
    }
  }
  return out;
}

function readAsciiString(dv: DataView, offset: number, maxLen: number): string {
  let out = '';
  for (let i = 0; i < maxLen; i++) {
    const b = dv.getUint8(offset + i);
    if (b === 0) break;
    out += String.fromCharCode(b);
  }
  return out;
}

function readAsciiArray(dv: DataView, offset: number, count: number): string {
  let out = '';
  for (let i = 0; i < count; i++) {
    const b = dv.getUint8(offset + i);
    if (b === 0) break;
    out += String.fromCharCode(b);
  }
  return out;
}

function formatRational(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'number') {
    if (Number.isInteger(value)) return value.toString();
    return value.toFixed(2).replace(/\.?0+$/, '');
  }
  return '';
}

function formatRationalArray(values: unknown): string {
  if (!Array.isArray(values)) return '';
  return values
    .map((v) => formatRational(v))
    .filter((s) => s.length > 0)
    .join('/');
}

function formatExifValue(
  typeId: number,
  raw: unknown,
  _littleEndian: boolean,
  dv: DataView,
  valueOffset: number,
  count: number,
): string {
  if (raw == null) return '';
  switch (typeId) {
    case 2: {
      if (count <= 4) {
        return readAsciiString(dv, valueOffset, count).trim();
      }
      if (Array.isArray(raw)) {
        return readAsciiArray(dv, valueOffset, count).trim();
      }
      return '';
    }
    case 5:
    case 10:
      return formatRationalArray(raw);
    case 1: {
      if (Array.isArray(raw)) {
        return raw.map((b) => String(b)).join(' ');
      }
      return String(raw);
    }
    case 3:
    case 4:
    case 8:
    case 9: {
      if (Array.isArray(raw)) {
        if (raw.length > 8) return `[${raw.length} values]`;
        return raw.map((v) => String(v)).join(', ');
      }
      return String(raw);
    }
    case 7: {
      if (count <= 4 && Array.isArray(raw)) {
        return raw
          .map((b) => (typeof b === 'number' ? b.toString(16).padStart(2, '0') : ''))
          .join(' ');
      }
      return `[${count} bytes]`;
    }
    case 11:
    case 12: {
      if (Array.isArray(raw)) return raw.map((v) => String(v)).join(', ');
      return String(raw);
    }
    default:
      if (Array.isArray(raw)) {
        if (raw.length > 8) return `[${raw.length} values]`;
        return raw.map((v) => String(v)).join(', ');
      }
      return String(raw);
  }
}

interface IfdEntry {
  tag: number;
  typeId: number;
  count: number;
  valueOffset: number;
  littleEndian: boolean;
}

function readIfd(
  bytes: Uint8Array,
  baseOffset: number,
  ifdOffset: number,
  littleEndian: boolean,
  fields: ExifField[],
  ifdName: '0th' | 'Exif' | 'GPS' | '1st' | 'Interop',
): number {
  const reader = makeReader(bytes, baseOffset, littleEndian);
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let entryCount: number;
  try {
    entryCount = reader.u16(ifdOffset);
  } catch {
    return 0;
  }
  const tagNames = TAG_NAMES_BY_IFD[ifdName];
  let exifSubIfdOffset: number | null = null;
  let gpsSubIfdOffset: number | null = null;
  let interopSubIfdOffset: number | null = null;

  for (let i = 0; i < entryCount; i++) {
    const entryOffset = ifdOffset + 2 + i * 12;
    if (entryOffset + 12 > bytes.length - baseOffset) break;
    let tag: number;
    let typeId: number;
    let count: number;
    let valueField: number;
    try {
      tag = reader.u16(entryOffset);
      typeId = reader.u16(entryOffset + 2);
      count = reader.u32(entryOffset + 4);
      valueField = reader.u32(entryOffset + 8);
    } catch {
      break;
    }
    const typeSize = TYPE_SIZES[typeId] ?? 0;
    const total = typeSize * count;
    const valueOffset = total <= 4 ? entryOffset + 8 : valueField;

    if (ifdName === '0th') {
      if (tag === 0x8769) {
        exifSubIfdOffset = valueField;
        continue;
      }
      if (tag === 0x8825) {
        gpsSubIfdOffset = valueField;
        continue;
      }
    }
    if (ifdName === 'Exif' && tag === 0xa005) {
      interopSubIfdOffset = valueField;
      continue;
    }

    const entry: IfdEntry = { tag, typeId, count, valueOffset, littleEndian };
    let raw: unknown;
    try {
      raw = readValue(bytes, baseOffset, typeId, count, valueField, littleEndian);
    } catch {
      raw = null;
    }
    const typeName = TYPE_NAMES[typeId] ?? `Type${typeId}`;
    void typeName;
    const name = tagNames[tag] ?? `Tag${tag.toString(16)}`;
    const formatted = formatExifValue(typeId, raw, littleEndian, dv, valueOffset, count);
    if (formatted) {
      fields.push({ ifd: ifdName, tag, name, value: formatted });
    }
    void entry;
  }

  if (exifSubIfdOffset != null && exifSubIfdOffset > 0) {
    readIfd(bytes, baseOffset, exifSubIfdOffset, littleEndian, fields, 'Exif');
  }
  if (gpsSubIfdOffset != null && gpsSubIfdOffset > 0) {
    readIfd(bytes, baseOffset, gpsSubIfdOffset, littleEndian, fields, 'GPS');
  }
  if (interopSubIfdOffset != null && interopSubIfdOffset > 0) {
    readIfd(bytes, baseOffset, interopSubIfdOffset, littleEndian, fields, 'Interop');
  }

  let nextIfd: number;
  try {
    nextIfd = reader.u16(ifdOffset + 2 + entryCount * 12);
  } catch {
    return 0;
  }
  if (ifdName === '0th' && nextIfd > 0) {
    readIfd(bytes, baseOffset, nextIfd, littleEndian, fields, '1st');
  }
  return nextIfd;
}

export function parseJpegExif(bytes: Uint8Array): ExifReadResult {
  const segment = findExifSegment(bytes);
  if (!segment) {
    return { hasExif: false, fields: [], error: 'No EXIF segment found' };
  }
  const baseOffset = segment.offset;
  if (baseOffset + 8 > bytes.length) {
    return { hasExif: false, fields: [], error: 'EXIF segment too short' };
  }
  const byteOrder = bytes[baseOffset] === 0x49 && bytes[baseOffset + 1] === 0x49;
  const altOrder = bytes[baseOffset] === 0x4d && bytes[baseOffset + 1] === 0x4d;
  if (!byteOrder && !altOrder) {
    return { hasExif: false, fields: [], error: 'Invalid EXIF byte order' };
  }
  const littleEndian = byteOrder;
  try {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const magic = dv.getUint16(baseOffset + 2, littleEndian);
    if (magic !== 0x002a) {
      return { hasExif: false, fields: [], error: 'Invalid EXIF magic' };
    }
    const ifd0Offset = dv.getUint32(baseOffset + 4, littleEndian);
    const fields: ExifField[] = [];
    readIfd(bytes, baseOffset, ifd0Offset, littleEndian, fields, '0th');
    return { hasExif: fields.length > 0, fields, error: null };
  } catch (err) {
    return {
      hasExif: false,
      fields: [],
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
