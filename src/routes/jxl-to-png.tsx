import { ToolPage } from '../components/tool/ToolPage';
import { jxlToPng } from '../lib/conversions/image/jxl-to-png';

export default function JxlToPngPage() {
  return (
    <ToolPage
      title="JXL to PNG"
      description="Convert JPEG XL images to PNG in your browser. No upload, no signup."
      accept={['.jxl', 'image/jxl']}
      convert={jxlToPng}
      outputMimeType="image/png"
      outputExtension="png"
    />
  );
}
