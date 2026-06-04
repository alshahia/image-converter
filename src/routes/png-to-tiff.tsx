import { ToolPage } from '../components/tool/ToolPage';
import { pngToTiff } from '../lib/conversions/image/png-to-tiff';

export default function PngToTiffPage() {
  return (
    <ToolPage
      title="PNG to TIFF"
      description="Convert PNG images to TIFF in your browser. No upload, no signup."
      accept={['.png', 'image/png']}
      convert={pngToTiff}
      outputMimeType="image/tiff"
      outputExtension="tiff"
    />
  );
}
