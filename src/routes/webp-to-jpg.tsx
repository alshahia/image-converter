import { ToolPage } from '../components/tool/ToolPage';
import { webpToJpg } from '../lib/conversions/image/webp-to-jpg';

export default function WebpToJpgPage() {
  return (
    <ToolPage
      title="WebP to JPG"
      description="Convert WebP images to JPG in your browser. No upload, no signup, EXIF stripped by default."
      accept={['.webp', 'image/webp']}
      convert={webpToJpg}
      outputMimeType="image/jpeg"
      outputExtension="jpg"
    />
  );
}
