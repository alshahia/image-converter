import { ToolPage } from '../components/tool/ToolPage';
import { bmpToJpg } from '../lib/conversions/image/bmp-to-jpg';

export default function BmpToJpgPage() {
  return (
    <ToolPage
      title="BMP to JPG"
      description="Convert BMP images to JPG in your browser. No upload, no signup."
      accept={['.bmp', 'image/bmp']}
      convert={bmpToJpg}
      outputMimeType="image/jpeg"
      outputExtension="jpg"
    />
  );
}
