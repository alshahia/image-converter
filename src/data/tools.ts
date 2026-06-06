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
  | 'layers'
  | 'crop'
  | 'qr'
  | 'barcode'
  | 'palette'
  | 'sparkle'
  | 'merge'
  | 'grid'
  | 'archive'
  | 'scale'
  | 'view'
  | 'compare'
  | 'sliders'
  | 'photo'
  | 'flip'
  | 'rotate'
  | 'edit'
  | 'play'
  | 'text'
  | 'lock'
  | 'eye'
  | 'scissors'
  | 'globe';

export type TileColor = 'pink' | 'purple' | 'blue' | 'green' | 'yellow' | 'peach';

export type ToolCategory =
  | 'image-convert'
  | 'image-optimize'
  | 'image-transform'
  | 'image-effect'
  | 'image-utility'
  | 'format'
  | 'text-in'
  | 'video-convert'
  | 'audio'
  | 'media-utility'
  | 'ai'
  | 'gif'
  | 'internal';

export type ToolEngine =
  | 'jsquash'
  | 'heic'
  | 'ffmpeg'
  | 'exif'
  | 'qr'
  | 'barcode'
  | 'bmp'
  | 'tiff'
  | 'ico'
  | 'svg'
  | 'meme'
  | 'gif-encoder'
  | 'ai-rmbg'
  | 'ai-upscale'
  | 'composite'
  | 'blur'
  | 'watermark'
  | 'raw-canvas';

export interface Tool {
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly category: ToolCategory;
  readonly icon: ToolIconName;
  readonly tileColor: TileColor;
  readonly abbreviation: string;
  readonly engine: ToolEngine;
  readonly accepts?: ReadonlyArray<string>;
  readonly outputs?: ReadonlyArray<string>;
  readonly batchable?: boolean;
  readonly internal?: boolean;
}

export const TOOLS: ReadonlyArray<Tool> = [
  {
    path: '/heic-to-jpg',
    title: 'HEIC to JPG',
    description: 'Convert iPhone HEIC photos to universally supported JPG.',
    category: 'image-convert',
    icon: 'image',
    tileColor: 'blue',
    abbreviation: 'HEIC → JPG',
    engine: 'heic',
    accepts: ['.heic', '.heif'],
    outputs: ['.jpg'],
    batchable: true,
  },
  {
    path: '/png-to-jpg',
    title: 'PNG to JPG',
    description: 'Convert PNG images to JPG with adjustable quality.',
    category: 'image-convert',
    icon: 'image',
    tileColor: 'peach',
    abbreviation: 'PNG → JPG',
    engine: 'jsquash',
    accepts: ['.png'],
    outputs: ['.jpg'],
    batchable: true,
  },
  {
    path: '/jpg-to-png',
    title: 'JPG to PNG',
    description: 'Convert JPG images to lossless PNG with transparency support.',
    category: 'image-convert',
    icon: 'image',
    tileColor: 'green',
    abbreviation: 'JPG → PNG',
    engine: 'jsquash',
    accepts: ['.jpg', '.jpeg'],
    outputs: ['.png'],
    batchable: true,
  },
  {
    path: '/webp-to-jpg',
    title: 'WebP to JPG',
    description: 'Convert modern WebP images to universally supported JPG.',
    category: 'image-convert',
    icon: 'image',
    tileColor: 'yellow',
    abbreviation: 'WebP → JPG',
    engine: 'jsquash',
    accepts: ['.webp'],
    outputs: ['.jpg'],
    batchable: true,
  },
  {
    path: '/jpg-to-webp',
    title: 'JPG to WebP',
    description: 'Convert JPG images to smaller, modern WebP files.',
    category: 'image-convert',
    icon: 'image',
    tileColor: 'pink',
    abbreviation: 'JPG → WebP',
    engine: 'jsquash',
    accepts: ['.jpg', '.jpeg'],
    outputs: ['.webp'],
    batchable: true,
  },
  {
    path: '/resize-image',
    title: 'Resize Image',
    description: 'Resize images to exact dimensions. No quality loss.',
    category: 'image-optimize',
    icon: 'resize',
    tileColor: 'blue',
    abbreviation: 'RESIZE',
    engine: 'jsquash',
    accepts: ['.jpg', '.jpeg', '.png', '.webp'],
    outputs: ['.jpg', '.png', '.webp'],
    batchable: true,
  },
  {
    path: '/compress-image',
    title: 'Compress Image',
    description: 'Shrink file size with an adjustable quality slider.',
    category: 'image-optimize',
    icon: 'compress',
    tileColor: 'green',
    abbreviation: 'COMPRESS',
    engine: 'jsquash',
    accepts: ['.jpg', '.jpeg', '.png', '.webp'],
    outputs: ['.jpg', '.png', '.webp'],
    batchable: true,
  },
  {
    path: '/strip-exif',
    title: 'Strip EXIF',
    description: 'Remove GPS location, camera data, and other metadata.',
    category: 'image-optimize',
    icon: 'shield',
    tileColor: 'purple',
    abbreviation: 'STRIP EXIF',
    engine: 'exif',
    accepts: ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'],
    outputs: ['.jpg', '.png', '.webp'],
    batchable: true,
  },
  {
    path: '/crop-image',
    title: 'Crop Image',
    description: 'Crop an image visually. Drag and resize the selection rectangle.',
    category: 'image-transform',
    icon: 'crop',
    tileColor: 'blue',
    abbreviation: 'CROP',
    engine: 'raw-canvas',
    accepts: ['.jpg', '.jpeg', '.png', '.webp'],
    outputs: ['.jpg', '.png', '.webp'],
    batchable: true,
  },
  {
    path: '/rotate-image',
    title: 'Rotate Image',
    description: 'Rotate images by 90°, 180°, or 270°, or flip horizontally or vertically.',
    category: 'image-transform',
    icon: 'rotate',
    tileColor: 'pink',
    abbreviation: 'ROTATE',
    engine: 'raw-canvas',
    accepts: ['.jpg', '.jpeg', '.png', '.webp'],
    outputs: ['.jpg', '.png', '.webp'],
    batchable: true,
  },
  {
    path: '/add-watermark',
    title: 'Add Watermark',
    description: 'Stamp a text or image watermark on a photo with adjustable position and opacity.',
    category: 'image-effect',
    icon: 'text',
    tileColor: 'yellow',
    abbreviation: 'WATERMARK',
    engine: 'watermark',
    accepts: ['.jpg', '.jpeg', '.png', '.webp'],
    outputs: ['.jpg', '.png', '.webp'],
    batchable: true,
  },
  {
    path: '/view-exif',
    title: 'View EXIF Data',
    description:
      'Inspect EXIF metadata (camera, GPS, timestamps) from a JPEG without uploading it.',
    category: 'image-utility',
    icon: 'view',
    tileColor: 'green',
    abbreviation: 'VIEW EXIF',
    engine: 'exif',
    accepts: ['.jpg', '.jpeg'],
    outputs: [],
  },
  {
    path: '/video-to-mp4',
    title: 'Video to MP4',
    description: 'Convert any video to MP4 (H.264) right in your browser.',
    category: 'video-convert',
    icon: 'video',
    tileColor: 'pink',
    abbreviation: 'MP4',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.flv', '.m4v'],
    outputs: ['.mp4'],
    batchable: true,
  },
  {
    path: '/video-to-gif',
    title: 'Video to GIF',
    description: 'Turn a short video clip into an animated GIF.',
    category: 'video-convert',
    icon: 'gif',
    tileColor: 'peach',
    abbreviation: 'GIF',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.flv', '.m4v'],
    outputs: ['.gif'],
    batchable: true,
  },
  {
    path: '/extract-audio',
    title: 'Extract Audio',
    description: 'Pull audio from video as MP3, WAV, or AAC.',
    category: 'audio',
    icon: 'audio',
    tileColor: 'yellow',
    abbreviation: 'AUDIO',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.flv', '.m4v'],
    outputs: ['.mp3', '.wav', '.aac', '.flac', '.ogg'],
    batchable: true,
  },
  {
    path: '/ffmpeg-smoke',
    title: 'ffmpeg.wasm smoke test',
    description: 'Internal: verify ffmpeg.wasm loads on this browser.',
    category: 'internal',
    icon: 'terminal',
    tileColor: 'blue',
    abbreviation: 'SMOKE',
    engine: 'ffmpeg',
    internal: true,
  },
  {
    path: '/jpg-to-avif',
    title: 'JPG to AVIF',
    description: 'Convert JPG to AVIF, the next-gen image format with better compression.',
    category: 'format',
    icon: 'image',
    tileColor: 'pink',
    abbreviation: 'JPG → AVIF',
    engine: 'jsquash',
    accepts: ['.jpg', '.jpeg'],
    outputs: ['.avif'],
    batchable: true,
  },
  {
    path: '/avif-to-jpg',
    title: 'AVIF to JPG',
    description: 'Convert AVIF images to universally supported JPG.',
    category: 'format',
    icon: 'image',
    tileColor: 'blue',
    abbreviation: 'AVIF → JPG',
    engine: 'jsquash',
    accepts: ['.avif'],
    outputs: ['.jpg'],
    batchable: true,
  },
  {
    path: '/png-to-avif',
    title: 'PNG to AVIF',
    description: 'Convert PNG to AVIF for smaller lossless or high-quality lossy files.',
    category: 'format',
    icon: 'image',
    tileColor: 'peach',
    abbreviation: 'PNG → AVIF',
    engine: 'jsquash',
    accepts: ['.png'],
    outputs: ['.avif'],
    batchable: true,
  },
  {
    path: '/avif-to-png',
    title: 'AVIF to PNG',
    description: 'Convert AVIF images to lossless PNG with transparency support.',
    category: 'format',
    icon: 'image',
    tileColor: 'green',
    abbreviation: 'AVIF → PNG',
    engine: 'jsquash',
    accepts: ['.avif'],
    outputs: ['.png'],
    batchable: true,
  },
  {
    path: '/jpg-to-jxl',
    title: 'JPG to JXL',
    description: 'Convert JPG to JPEG XL for superior compression and quality.',
    category: 'format',
    icon: 'image',
    tileColor: 'yellow',
    abbreviation: 'JPG → JXL',
    engine: 'jsquash',
    accepts: ['.jpg', '.jpeg'],
    outputs: ['.jxl'],
    batchable: true,
  },
  {
    path: '/jxl-to-jpg',
    title: 'JXL to JPG',
    description: 'Convert JPEG XL images to universally supported JPG.',
    category: 'format',
    icon: 'image',
    tileColor: 'blue',
    abbreviation: 'JXL → JPG',
    engine: 'jsquash',
    accepts: ['.jxl'],
    outputs: ['.jpg'],
    batchable: true,
  },
  {
    path: '/png-to-jxl',
    title: 'PNG to JXL',
    description: 'Convert PNG to JPEG XL for smaller lossless files.',
    category: 'format',
    icon: 'image',
    tileColor: 'purple',
    abbreviation: 'PNG → JXL',
    engine: 'jsquash',
    accepts: ['.png'],
    outputs: ['.jxl'],
    batchable: true,
  },
  {
    path: '/jxl-to-png',
    title: 'JXL to PNG',
    description: 'Convert JPEG XL images to lossless PNG with transparency support.',
    category: 'format',
    icon: 'image',
    tileColor: 'green',
    abbreviation: 'JXL → PNG',
    engine: 'jsquash',
    accepts: ['.jxl'],
    outputs: ['.png'],
    batchable: true,
  },
  {
    path: '/heic-to-webp',
    title: 'HEIC to WebP',
    description: 'Convert iPhone HEIC photos to smaller, modern WebP files.',
    category: 'image-convert',
    icon: 'image',
    tileColor: 'pink',
    abbreviation: 'HEIC → WebP',
    engine: 'heic',
    accepts: ['.heic', '.heif'],
    outputs: ['.webp'],
    batchable: true,
  },
  {
    path: '/heic-to-png',
    title: 'HEIC to PNG',
    description: 'Convert iPhone HEIC photos to lossless PNG with transparency.',
    category: 'image-convert',
    icon: 'image',
    tileColor: 'green',
    abbreviation: 'HEIC → PNG',
    engine: 'heic',
    accepts: ['.heic', '.heif'],
    outputs: ['.png'],
    batchable: true,
  },
  {
    path: '/jpg-to-bmp',
    title: 'JPG to BMP',
    description: 'Convert JPG images to uncompressed Windows BMP format.',
    category: 'format',
    icon: 'image',
    tileColor: 'peach',
    abbreviation: 'JPG → BMP',
    engine: 'bmp',
    accepts: ['.jpg', '.jpeg'],
    outputs: ['.bmp'],
    batchable: true,
  },
  {
    path: '/png-to-bmp',
    title: 'PNG to BMP',
    description: 'Convert PNG images to uncompressed Windows BMP format.',
    category: 'format',
    icon: 'image',
    tileColor: 'yellow',
    abbreviation: 'PNG → BMP',
    engine: 'bmp',
    accepts: ['.png'],
    outputs: ['.bmp'],
    batchable: true,
  },
  {
    path: '/bmp-to-jpg',
    title: 'BMP to JPG',
    description: 'Convert uncompressed BMP files to compact JPG.',
    category: 'format',
    icon: 'image',
    tileColor: 'blue',
    abbreviation: 'BMP → JPG',
    engine: 'bmp',
    accepts: ['.bmp'],
    outputs: ['.jpg'],
    batchable: true,
  },
  {
    path: '/bmp-to-png',
    title: 'BMP to PNG',
    description: 'Convert BMP files to lossless PNG with transparency support.',
    category: 'format',
    icon: 'image',
    tileColor: 'green',
    abbreviation: 'BMP → PNG',
    engine: 'bmp',
    accepts: ['.bmp'],
    outputs: ['.png'],
    batchable: true,
  },
  {
    path: '/jpg-to-tiff',
    title: 'JPG to TIFF',
    description: 'Convert JPG images to uncompressed TIFF for archival use.',
    category: 'format',
    icon: 'image',
    tileColor: 'pink',
    abbreviation: 'JPG → TIFF',
    engine: 'tiff',
    accepts: ['.jpg', '.jpeg'],
    outputs: ['.tiff'],
    batchable: true,
  },
  {
    path: '/png-to-tiff',
    title: 'PNG to TIFF',
    description: 'Convert PNG images to uncompressed TIFF for archival use.',
    category: 'format',
    icon: 'image',
    tileColor: 'purple',
    abbreviation: 'PNG → TIFF',
    engine: 'tiff',
    accepts: ['.png'],
    outputs: ['.tiff'],
    batchable: true,
  },
  {
    path: '/tiff-to-jpg',
    title: 'TIFF to JPG',
    description: 'Convert TIFF images to compact JPG.',
    category: 'format',
    icon: 'image',
    tileColor: 'yellow',
    abbreviation: 'TIFF → JPG',
    engine: 'tiff',
    accepts: ['.tiff', '.tif'],
    outputs: ['.jpg'],
    batchable: true,
  },
  {
    path: '/tiff-to-png',
    title: 'TIFF to PNG',
    description: 'Convert TIFF images to lossless PNG with transparency support.',
    category: 'format',
    icon: 'image',
    tileColor: 'green',
    abbreviation: 'TIFF → PNG',
    engine: 'tiff',
    accepts: ['.tiff', '.tif'],
    outputs: ['.png'],
    batchable: true,
  },
  {
    path: '/jpg-to-ico',
    title: 'JPG to ICO',
    description: 'Convert JPG images to multi-size Windows ICO favicon files.',
    category: 'format',
    icon: 'image',
    tileColor: 'blue',
    abbreviation: 'JPG → ICO',
    engine: 'ico',
    accepts: ['.jpg', '.jpeg'],
    outputs: ['.ico'],
    batchable: true,
  },
  {
    path: '/png-to-ico',
    title: 'PNG to ICO',
    description: 'Convert PNG images to multi-size Windows ICO favicon files.',
    category: 'format',
    icon: 'image',
    tileColor: 'peach',
    abbreviation: 'PNG → ICO',
    engine: 'ico',
    accepts: ['.png'],
    outputs: ['.ico'],
    batchable: true,
  },
  {
    path: '/svg-to-png',
    title: 'SVG to PNG',
    description: 'Rasterize SVG vector files into PNG images at any size.',
    category: 'format',
    icon: 'image',
    tileColor: 'pink',
    abbreviation: 'SVG → PNG',
    engine: 'svg',
    accepts: ['.svg'],
    outputs: ['.png'],
    batchable: true,
  },
  {
    path: '/video-trim',
    title: 'Trim video',
    description: 'Cut a video to a precise time range. No re-encode when possible.',
    category: 'media-utility',
    icon: 'scissors',
    tileColor: 'pink',
    abbreviation: 'Trim',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv'],
    outputs: ['.mp4'],
  },
  {
    path: '/crop-video',
    title: 'Crop video',
    description: 'Visually crop a video region. Audio is preserved.',
    category: 'media-utility',
    icon: 'crop',
    tileColor: 'purple',
    abbreviation: 'Crop',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv'],
    outputs: ['.mp4'],
  },
  {
    path: '/rotate-video',
    title: 'Rotate video',
    description: 'Rotate a video by 90, 180, or 270 degrees.',
    category: 'media-utility',
    icon: 'rotate',
    tileColor: 'blue',
    abbreviation: 'Rotate',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv'],
    outputs: ['.mp4'],
  },
  {
    path: '/mute-video',
    title: 'Mute video',
    description: 'Remove the audio track from a video. Video stream is copied as-is.',
    category: 'media-utility',
    icon: 'audio',
    tileColor: 'green',
    abbreviation: 'Mute',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv'],
    outputs: ['.mp4'],
  },
  {
    path: '/video-speed',
    title: 'Change video speed',
    description: 'Speed up or slow down a video from 0.25× to 4×.',
    category: 'media-utility',
    icon: 'sliders',
    tileColor: 'yellow',
    abbreviation: 'Speed',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv'],
    outputs: ['.mp4'],
  },
  {
    path: '/resize-video',
    title: 'Resize video',
    description: 'Scale a video to 480p, 720p, 1080p, 1440p, or 4K.',
    category: 'media-utility',
    icon: 'scale',
    tileColor: 'peach',
    abbreviation: 'Resize',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv'],
    outputs: ['.mp4'],
  },
  {
    path: '/extract-frames',
    title: 'Extract video frames',
    description: 'Pull still frames from a video at a fixed interval into a ZIP.',
    category: 'media-utility',
    icon: 'grid',
    tileColor: 'pink',
    abbreviation: 'Frames',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv'],
    outputs: ['.zip'],
  },
  {
    path: '/video-to-webm',
    title: 'Video to WebM',
    description: 'Convert any video to WebM with VP9 + Opus.',
    category: 'video-convert',
    icon: 'video',
    tileColor: 'purple',
    abbreviation: 'WebM',
    engine: 'ffmpeg',
    accepts: ['.mp4', '.mov', '.webm', '.mkv'],
    outputs: ['.webm'],
  },
  {
    path: '/remove-background',
    title: 'Remove Background',
    description: 'Remove the background from any photo. Outputs PNG with transparency. AI runs locally.',
    category: 'ai',
    icon: 'sparkle',
    tileColor: 'pink',
    abbreviation: 'BG REMOVE',
    engine: 'ai-rmbg',
    accepts: ['.jpg', '.jpeg', '.png', '.webp'],
    outputs: ['.png'],
  },
  {
    path: '/upscale-image',
    title: 'Upscale Image',
    description: 'Increase image resolution 2× or 4× with AI super-resolution. Local and private.',
    category: 'ai',
    icon: 'scale',
    tileColor: 'purple',
    abbreviation: 'UPSCALE',
    engine: 'ai-upscale',
    accepts: ['.jpg', '.jpeg', '.png', '.webp'],
    outputs: ['.png'],
  },
  {
    path: '/smart-compress',
    title: 'Smart Compress',
    description: 'Compress to an exact target file size. Quality auto-tuned locally.',
    category: 'ai',
    icon: 'compress',
    tileColor: 'blue',
    abbreviation: 'SMART',
    engine: 'jsquash',
    accepts: ['.jpg', '.jpeg', '.png', '.webp'],
    outputs: ['.jpg', '.png', '.webp'],
  },
];

export const categoryMeta: Record<ToolCategory, { label: string; description: string }> = {
  'image-convert': {
    label: 'Image conversion',
    description: 'Convert between image formats while preserving quality',
  },
  'image-optimize': {
    label: 'Image optimization',
    description: 'Resize, compress, and clean up your images',
  },
  'image-transform': {
    label: 'Image transform',
    description: 'Crop, rotate, flip, and reshape images',
  },
  'image-effect': {
    label: 'Image effects',
    description: 'Filters, blurs, watermarks, and overlays',
  },
  'image-utility': {
    label: 'Image utilities',
    description: 'Inspect, compare, and convert between data representations',
  },
  format: {
    label: 'Specialized formats',
    description: 'AVIF, JXL, TIFF, BMP, ICO, HEIF, and other niche formats',
  },
  'text-in': {
    label: 'Text and codes',
    description: 'Generate images from text, memes, QR, and barcodes',
  },
  'video-convert': {
    label: 'Video conversion',
    description: 'Convert video files between formats and codecs',
  },
  audio: {
    label: 'Audio conversion',
    description: 'Convert and extract audio tracks',
  },
  'media-utility': {
    label: 'Media utilities',
    description: 'Trim, compress, and inspect media files',
  },
  ai: {
    label: 'AI tools',
    description: 'Background removal and image upscaling (runs locally)',
  },
  gif: {
    label: 'Animated images',
    description: 'GIF, APNG, and WebP animation utilities',
  },
  internal: {
    label: 'Internal',
    description: 'Development and testing tools',
  },
};

export const CATEGORY_ORDER: ReadonlyArray<ToolCategory> = [
  'image-convert',
  'image-optimize',
  'image-transform',
  'image-effect',
  'image-utility',
  'format',
  'text-in',
  'video-convert',
  'audio',
  'media-utility',
  'ai',
  'gif',
  'internal',
];

export function getToolByPath(path: string): Tool | undefined {
  return TOOLS.find((t) => t.path === path);
}
