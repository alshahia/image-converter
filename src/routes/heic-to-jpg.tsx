import { ToolPage } from '../components/tool/ToolPage';
import { heicToJpg } from '../lib/conversions/image/heic-to-jpg';
import { terminateWorker } from '../lib/engines/jsquash';

export default function HeicToJpgPage() {
  return (
    <ToolPage
      title="HEIC to JPG"
      description="Convert iPhone HEIC photos to JPG in your browser. No upload, no signup, EXIF stripped by default."
      accept={['.heic', '.heif', 'image/heic', 'image/heif']}
      convert={(file) => heicToJpg(file)}
      outputMimeType="image/jpeg"
      outputExtension="jpg"
      onCancel={terminateWorker}
    />
  );
}
