import { ToolPage } from '../components/tool/ToolPage';
import { pngToJxl } from '../lib/conversions/image/png-to-jxl';

export default function PngToJxlPage() {
  return (
    <ToolPage
      title="PNG to JXL"
      description="Convert PNG images to JPEG XL in your browser. No upload, no signup."
      accept={['.png', 'image/png']}
      convert={pngToJxl}
      outputMimeType="image/jxl"
      outputExtension="jxl"
    />
  );
}
