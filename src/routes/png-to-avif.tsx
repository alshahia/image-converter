import { ToolPage } from '../components/tool/ToolPage';
import { pngToAvif } from '../lib/conversions/image/png-to-avif';

export default function PngToAvifPage() {
  return (
    <ToolPage
      title="PNG to AVIF"
      description="Convert PNG images to AVIF in your browser. No upload, no signup."
      accept={['.png', 'image/png']}
      convert={pngToAvif}
      outputMimeType="image/avif"
      outputExtension="avif"
    />
  );
}
