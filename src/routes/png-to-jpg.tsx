import { ToolPage } from '../components/tool/ToolPage';
import { pngToJpg } from '../lib/conversions/image/png-to-jpg';

export default function PngToJpgPage() {
  return (
    <ToolPage
      title="PNG to JPG"
      description="Convert PNG images to JPG in your browser. No upload, no signup, EXIF stripped by default."
      accept={['.png', 'image/png']}
      convert={pngToJpg}
      outputMimeType="image/jpeg"
      outputExtension="jpg"
    />
  );
}
