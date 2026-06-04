import { ToolPage } from '../components/tool/ToolPage';
import { avifToJpg } from '../lib/conversions/image/avif-to-jpg';

export default function AvifToJpgPage() {
  return (
    <ToolPage
      title="AVIF to JPG"
      description="Convert AVIF images to JPG in your browser. No upload, no signup."
      accept={['.avif', 'image/avif']}
      convert={avifToJpg}
      outputMimeType="image/jpeg"
      outputExtension="jpg"
    />
  );
}
