import { ToolPage } from '../components/tool/ToolPage';
import { jpgToPng } from '../lib/conversions/image/jpg-to-png';

export default function JpgToPngPage() {
  return (
    <ToolPage
      title="JPG to PNG"
      description="Convert JPG images to PNG in your browser. No upload, no signup."
      accept={['.jpg', '.jpeg', 'image/jpeg']}
      convert={jpgToPng}
      outputMimeType="image/png"
      outputExtension="png"
    />
  );
}
