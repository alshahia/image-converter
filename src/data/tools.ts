export type ToolIconName =
  | 'image'
  | 'resize'
  | 'compress'
  | 'tag'
  | 'video'
  | 'gif'
  | 'audio'
  | 'terminal'
  | 'shield'
  | 'wand'
  | 'layers';

export type TileColor = 'pink' | 'purple' | 'blue' | 'green' | 'yellow' | 'peach';

export interface Tool {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly category: 'convert' | 'optimize' | 'video' | 'internal';
  readonly icon: ToolIconName;
  readonly tileColor: TileColor;
  readonly abbreviation: string;
}

export const TOOLS: ReadonlyArray<Tool> = [
  {
    path: '/heic-to-jpg',
    title: 'HEIC to JPG',
    description: 'Convert iPhone HEIC photos to universally supported JPG.',
    category: 'convert',
    icon: 'image',
    tileColor: 'blue',
    abbreviation: 'HEIC → JPG',
  },
  {
    path: '/png-to-jpg',
    title: 'PNG to JPG',
    description: 'Convert PNG images to JPG with adjustable quality.',
    category: 'convert',
    icon: 'image',
    tileColor: 'peach',
    abbreviation: 'PNG → JPG',
  },
  {
    path: '/jpg-to-png',
    title: 'JPG to PNG',
    description: 'Convert JPG images to lossless PNG with transparency support.',
    category: 'convert',
    icon: 'image',
    tileColor: 'green',
    abbreviation: 'JPG → PNG',
  },
  {
    path: '/webp-to-jpg',
    title: 'WebP to JPG',
    description: 'Convert modern WebP images to universally supported JPG.',
    category: 'convert',
    icon: 'image',
    tileColor: 'yellow',
    abbreviation: 'WebP → JPG',
  },
  {
    path: '/jpg-to-webp',
    title: 'JPG to WebP',
    description: 'Convert JPG images to smaller, modern WebP files.',
    category: 'convert',
    icon: 'image',
    tileColor: 'pink',
    abbreviation: 'JPG → WebP',
  },
  {
    path: '/resize-image',
    title: 'Resize Image',
    description: 'Resize images to exact dimensions. No quality loss.',
    category: 'optimize',
    icon: 'resize',
    tileColor: 'blue',
    abbreviation: 'RESIZE',
  },
  {
    path: '/compress-image',
    title: 'Compress Image',
    description: 'Shrink file size with an adjustable quality slider.',
    category: 'optimize',
    icon: 'compress',
    tileColor: 'green',
    abbreviation: 'COMPRESS',
  },
  {
    path: '/strip-exif',
    title: 'Strip EXIF',
    description: 'Remove GPS location, camera data, and other metadata.',
    category: 'optimize',
    icon: 'shield',
    tileColor: 'purple',
    abbreviation: 'STRIP EXIF',
  },
  {
    path: '/video-to-mp4',
    title: 'Video to MP4',
    description: 'Convert any video to MP4 (H.264) right in your browser.',
    category: 'video',
    icon: 'video',
    tileColor: 'pink',
    abbreviation: 'MP4',
  },
  {
    path: '/video-to-gif',
    title: 'Video to GIF',
    description: 'Turn a short video clip into an animated GIF.',
    category: 'video',
    icon: 'gif',
    tileColor: 'peach',
    abbreviation: 'GIF',
  },
  {
    path: '/extract-audio',
    title: 'Extract Audio',
    description: 'Pull audio from video as MP3, WAV, or AAC.',
    category: 'video',
    icon: 'audio',
    tileColor: 'yellow',
    abbreviation: 'AUDIO',
  },
  {
    path: '/ffmpeg-smoke',
    title: 'ffmpeg.wasm smoke test',
    description: 'Internal: verify ffmpeg.wasm loads on this browser.',
    category: 'internal',
    icon: 'terminal',
    tileColor: 'blue',
    abbreviation: 'SMOKE',
  },
];

export const categoryMeta: Record<Tool['category'], { label: string; description: string }> = {
  convert: {
    label: 'Format conversion',
    description: 'Convert between image formats while preserving quality',
  },
  optimize: {
    label: 'Image optimization',
    description: 'Resize, compress, and clean up your images',
  },
  video: {
    label: 'Video & audio',
    description: 'Convert videos and extract audio tracks',
  },
  internal: {
    label: 'Internal',
    description: 'Development and testing tools',
  },
};
