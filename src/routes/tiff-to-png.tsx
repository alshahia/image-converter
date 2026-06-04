import { ToolPage } from '../components/tool/ToolPage';
import { tiffToPng } from '../lib/conversions/image/tiff-to-png';

export default function TiffToPngPage() {
  return (
    <ToolPage
      title="TIFF to PNG"
      description="Convert TIFF images to PNG in your browser. No upload, no signup."
      accept={['.tiff', '.tif', 'image/tiff']}
      convert={tiffToPng}
      outputMimeType="image/png"
      outputExtension="png"
    />
  );
}
