import { ToolPage } from '../components/tool/ToolPage';
import { pngToBmp } from '../lib/conversions/image/png-to-bmp';

export default function PngToBmpPage() {
  return (
    <ToolPage
      title="PNG to BMP"
      description="Convert PNG images to uncompressed BMP in your browser. No upload, no signup."
      accept={['.png', 'image/png']}
      convert={pngToBmp}
      outputMimeType="image/bmp"
      outputExtension="bmp"
    />
  );
}
