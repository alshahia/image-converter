import { Link } from 'react-router-dom';

interface Tool {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly category: 'image' | 'video' | 'internal';
}

const TOOLS: ReadonlyArray<Tool> = [
  {
    path: '/heic-to-jpg',
    title: 'HEIC to JPG',
    description: 'Convert iPhone HEIC photos to JPG in your browser. No upload.',
    category: 'image',
  },
  {
    path: '/png-to-jpg',
    title: 'PNG to JPG',
    description: 'Convert PNG images to JPG with adjustable quality.',
    category: 'image',
  },
  {
    path: '/jpg-to-png',
    title: 'JPG to PNG',
    description: 'Convert JPG images to lossless PNG.',
    category: 'image',
  },
  {
    path: '/webp-to-jpg',
    title: 'WebP to JPG',
    description: 'Convert modern WebP images to universally supported JPG.',
    category: 'image',
  },
  {
    path: '/jpg-to-webp',
    title: 'JPG to WebP',
    description: 'Convert JPG images to smaller WebP files.',
    category: 'image',
  },
  {
    path: '/resize-image',
    title: 'Resize Image',
    description: 'Resize images to a specific width or height in your browser.',
    category: 'image',
  },
  {
    path: '/compress-image',
    title: 'Compress Image',
    description: 'Shrink JPG/PNG/WebP file size with a quality slider.',
    category: 'image',
  },
  {
    path: '/strip-exif',
    title: 'Strip EXIF',
    description: 'Remove EXIF metadata (GPS, camera, timestamp) from a JPG.',
    category: 'image',
  },
  {
    path: '/video-to-mp4',
    title: 'Video to MP4',
    description: 'Convert any video to MP4 (H.264) in your browser.',
    category: 'video',
  },
  {
    path: '/video-to-gif',
    title: 'Video to GIF',
    description: 'Convert a short video clip to an animated GIF.',
    category: 'video',
  },
  {
    path: '/extract-audio',
    title: 'Extract Audio',
    description: 'Pull the audio track out of a video as MP3, WAV, or AAC.',
    category: 'video',
  },
  {
    path: '/ffmpeg-smoke',
    title: 'ffmpeg.wasm smoke test',
    description: 'Internal: verify ffmpeg.wasm loads on this browser. Not a user tool.',
    category: 'internal',
  },
];

export function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Image and video conversion, in your browser.
        </h1>
        <p className="max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          Drop a file, pick a tool, get the result. Nothing is uploaded. We never see your files.
        </p>
        <p className="max-w-2xl text-sm text-neutral-500">
          All 11 tools run locally using WebAssembly. EXIF is stripped from every image output. Open
          source on{' '}
          <a className="underline" href="https://github.com/alshahia/image-converter">
            GitHub
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Image tools
        </h2>
        <ToolGrid tools={TOOLS.filter((t) => t.category === 'image')} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Video tools
        </h2>
        <ToolGrid tools={TOOLS.filter((t) => t.category === 'video')} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-neutral-500">
          Internal
        </h2>
        <ToolGrid tools={TOOLS.filter((t) => t.category === 'internal')} />
      </section>
    </div>
  );
}

function ToolGrid({ tools }: { tools: ReadonlyArray<Tool> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <Link
          key={tool.path}
          to={tool.path}
          className="group block rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-neutral-900 hover:shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-50"
        >
          <h3 className="font-semibold group-hover:underline">{tool.title}</h3>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">{tool.description}</p>
        </Link>
      ))}
    </div>
  );
}
