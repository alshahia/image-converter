import { ToolPage } from '../components/tool/ToolPage';
import { pngToIco } from '../lib/conversions/image/png-to-ico';

export default function PngToIcoPage() {
  return (
    <ToolPage
      title="PNG to ICO"
      description="Convert PNG images to multi-size ICO favicon files in your browser. No upload, no signup."
      accept={['.png', 'image/png']}
      convert={pngToIco}
      outputMimeType="image/x-icon"
      outputExtension="ico"
    />
  );
}
