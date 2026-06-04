import { ToolPage } from '../components/tool/ToolPage';
import { jpgToTiff } from '../lib/conversions/image/jpg-to-tiff';

export default function JpgToTiffPage() {
  return (
    <ToolPage
      title="JPG to TIFF"
      description="Convert JPG images to TIFF in your browser. No upload, no signup."
      accept={['.jpg', '.jpeg', 'image/jpeg']}
      convert={jpgToTiff}
      outputMimeType="image/tiff"
      outputExtension="tiff"
    />
  );
}
