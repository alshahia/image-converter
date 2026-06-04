import { ToolPage } from '../components/tool/ToolPage';
import { jxlToJpg } from '../lib/conversions/image/jxl-to-jpg';

export default function JxlToJpgPage() {
  return (
    <ToolPage
      title="JXL to JPG"
      description="Convert JPEG XL images to JPG in your browser. No upload, no signup."
      accept={['.jxl', 'image/jxl']}
      convert={jxlToJpg}
      outputMimeType="image/jpeg"
      outputExtension="jpg"
    />
  );
}
