import { existsSync } from 'node:fs';
import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const SOURCE_CANDIDATES = [
  join(ROOT, "node_modules", "@ffmpeg", "core", "dist", "esm"),
  join(ROOT, "node_modules", "@ffmpeg", "core", "dist", "umd"),
  join(ROOT, "node_modules", "@ffmpeg", "core", "dist"),
];

const TARGET_DIR = join(ROOT, "public", "ffmpeg");

const REQUIRED_FILES = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

async function findSourceDir(): Promise<string | null> {
  for (const candidate of SOURCE_CANDIDATES) {
    if (!existsSync(candidate)) continue;
    const statResult = await stat(candidate).catch(() => null);
    if (!statResult?.isDirectory()) continue;
    const entries = await readdir(candidate);
    const hasCore = REQUIRED_FILES.some((f) => entries.includes(f));
    if (hasCore) return candidate;
  }
  return null;
}

async function main() {
  const source = await findSourceDir();
  if (!source) {
    console.warn(
      `[copy-ffmpeg-core] ffmpeg-core files not found in node_modules/@ffmpeg/core/dist/*.
  The /video-* tools will not work until ffmpeg-core is installed and copied.
  Expected one of: ${SOURCE_CANDIDATES.join(', ')}`,
    );
    process.exit(0);
  }

  await mkdir(TARGET_DIR, { recursive: true });

  const entries = await readdir(source);
  const candidates = entries.filter((f) => f.startsWith('ffmpeg-core'));
  let copied = 0;

  for (const file of candidates) {
    const src = join(source, file);
    const dst = join(TARGET_DIR, file);
    const fileStat = await stat(src).catch(() => null);
    if (!fileStat?.isFile()) continue;
    await copyFile(src, dst);
    copied++;
    console.log(`[copy-ffmpeg-core] ${file} (${(fileStat.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  if (copied === 0) {
    console.warn(`[copy-ffmpeg-core] no ffmpeg-core.* files found in ${source}`);
  } else {
    console.log(`[copy-ffmpeg-core] copied ${copied} file(s) to public/ffmpeg/`);
  }
}

main().catch((err) => {
  console.error('[copy-ffmpeg-core] failed:', err);
  process.exit(1);
});
