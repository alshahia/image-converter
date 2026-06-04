import { ToolPage } from '../components/tool/ToolPage';
import { avifToPng } from '../lib/conversions/image/avif-to-png';

export default function AvifToPngPage() {
  return (
    <ToolPage
      title="AVIF to PNG"
      description="Convert AVIF images to PNG in your browser. No upload, no signup."
      accept={['.avif', 'image/avif']}
      convert={avifToPng}
      outputMimeType="image/png"
      outputExtension="png"
    />
  );
}
