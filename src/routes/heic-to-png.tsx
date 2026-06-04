import { ToolPage } from '../components/tool/ToolPage';
import { heicToPng } from '../lib/conversions/image/heic-to-png';

export default function HeicToPngPage() {
  return (
    <ToolPage
      title="HEIC to PNG"
      description="Convert iPhone HEIC photos to PNG in your browser. No upload, no signup."
      accept={['.heic', '.heif', 'image/heic', 'image/heif']}
      convert={heicToPng}
      outputMimeType="image/png"
      outputExtension="png"
    />
  );
}
