import { ToolPage } from '../components/tool/ToolPage';
import { stripExif } from '../lib/conversions/image/strip-exif';

export default function StripExifPage() {
  return (
    <ToolPage
      title="Strip EXIF from JPG"
      description="Remove EXIF metadata (GPS, camera, timestamps) from a JPG without re-encoding. Lossless. No upload, no signup."
      accept={['.jpg', '.jpeg', 'image/jpeg']}
      convert={stripExif}
      outputMimeType="image/jpeg"
      outputExtension="jpg"
    />
  );
}
