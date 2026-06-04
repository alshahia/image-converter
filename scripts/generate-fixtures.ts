import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) {
    const idx = (crc ^ (buf[i] ?? 0)) & 0xff;
    const val = table[idx] ?? 0;
    crc = val ^ (crc >>> 1);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeB, data])));
  return Buffer.concat([len, typeB, data, crcBuf]);
}

// 1x1 red PNG
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(1, 0);
ihdr.writeUInt32BE(1, 4);
ihdr[8] = 8;
ihdr[9] = 2;
ihdr[10] = 0;
ihdr[11] = 0;
ihdr[12] = 0;

const rawScanline = Buffer.from([0, 255, 0, 0]);
const idatData = deflateSync(rawScanline);

const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const png = Buffer.concat([
  signature,
  pngChunk('IHDR', ihdr),
  pngChunk('IDAT', idatData),
  pngChunk('IEND', Buffer.alloc(0)),
]);

writeFileSync('tests/fixtures/sample.png', png);
console.log('Created tests/fixtures/sample.png (%d bytes)', png.length);

// Generate JPEG, WebP, GIF, and MP4 via ffmpeg
const fixtures: Array<[string, string]> = [
  ['sample.jpg', '-frames:v 1 -update 1 -q:v 1'],
  ['sample.gif', '-frames:v 2'],
  ['sample-video.mp4', '-frames:v 10'],
];

for (const [name, opts] of fixtures) {
  const cmd = `ffmpeg -y -f lavfi -i "color=c=red:s=2x2:d=0.5" ${opts} tests/fixtures/${name}`;
  execSync(cmd, { stdio: 'pipe' });
  console.log('Created tests/fixtures/%s', name);
}

// WebP needs a separate call (libwebp encoder)
execSync(
  `ffmpeg -y -f lavfi -i "color=c=red:s=1x1:d=1" -frames:v 1 -c:v libwebp tests/fixtures/sample.webp`,
  { stdio: 'pipe' },
);
console.log('Created tests/fixtures/sample.webp');
