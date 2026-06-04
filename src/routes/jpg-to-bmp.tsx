import { ToolPage } from '../components/tool/ToolPage';
import { jpgToBmp } from '../lib/conversions/image/jpg-to-bmp';

export default function JpgToBmpPage() {
  return (
    <ToolPage
      title="JPG to BMP"
      description="Convert JPG images to uncompressed BMP in your browser. No upload, no signup."
      accept={['.jpg', '.jpeg', 'image/jpeg']}
      convert={jpgToBmp}
      outputMimeType="image/bmp"
      outputExtension="bmp"
    />
  );
}
