import { ToolPage } from '../components/tool/ToolPage';
import { bmpToPng } from '../lib/conversions/image/bmp-to-png';

export default function BmpToPngPage() {
  return (
    <ToolPage
      title="BMP to PNG"
      description="Convert BMP images to PNG in your browser. No upload, no signup."
      accept={['.bmp', 'image/bmp']}
      convert={bmpToPng}
      outputMimeType="image/png"
      outputExtension="png"
    />
  );
}
