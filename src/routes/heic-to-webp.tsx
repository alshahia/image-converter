import { ToolPage } from '../components/tool/ToolPage';
import { heicToWebp } from '../lib/conversions/image/heic-to-webp';

export default function HeicToWebpPage() {
  return (
    <ToolPage
      title="HEIC to WebP"
      description="Convert iPhone HEIC photos to WebP in your browser. No upload, no signup."
      accept={['.heic', '.heif', 'image/heic', 'image/heif']}
      convert={heicToWebp}
      outputMimeType="image/webp"
      outputExtension="webp"
    />
  );
}
