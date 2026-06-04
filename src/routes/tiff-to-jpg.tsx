import { ToolPage } from '../components/tool/ToolPage';
import { tiffToJpg } from '../lib/conversions/image/tiff-to-jpg';

export default function TiffToJpgPage() {
  return (
    <ToolPage
      title="TIFF to JPG"
      description="Convert TIFF images to JPG in your browser. No upload, no signup."
      accept={['.tiff', '.tif', 'image/tiff']}
      convert={tiffToJpg}
      outputMimeType="image/jpeg"
      outputExtension="jpg"
    />
  );
}
