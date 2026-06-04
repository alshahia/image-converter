import { ToolPage } from '../components/tool/ToolPage';
import { jpgToAvif } from '../lib/conversions/image/jpg-to-avif';

export default function JpgToAvifPage() {
  return (
    <ToolPage
      title="JPG to AVIF"
      description="Convert JPG images to AVIF in your browser. No upload, no signup."
      accept={['.jpg', '.jpeg', 'image/jpeg']}
      convert={jpgToAvif}
      outputMimeType="image/avif"
      outputExtension="avif"
    />
  );
}
