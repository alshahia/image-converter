import { ToolPage } from '../components/tool/ToolPage';
import { jpgToIco } from '../lib/conversions/image/jpg-to-ico';

export default function JpgToIcoPage() {
  return (
    <ToolPage
      title="JPG to ICO"
      description="Convert JPG images to multi-size ICO favicon files in your browser. No upload, no signup."
      accept={['.jpg', '.jpeg', 'image/jpeg']}
      convert={jpgToIco}
      outputMimeType="image/x-icon"
      outputExtension="ico"
    />
  );
}
