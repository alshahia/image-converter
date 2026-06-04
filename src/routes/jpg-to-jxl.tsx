import { ToolPage } from '../components/tool/ToolPage';
import { jpgToJxl } from '../lib/conversions/image/jpg-to-jxl';

export default function JpgToJxlPage() {
  return (
    <ToolPage
      title="JPG to JXL"
      description="Convert JPG images to JPEG XL in your browser. No upload, no signup."
      accept={['.jpg', '.jpeg', 'image/jpeg']}
      convert={jpgToJxl}
      outputMimeType="image/jxl"
      outputExtension="jxl"
    />
  );
}
