import { ToolPage } from '../components/tool/ToolPage';
import { svgToPngConvert } from '../lib/conversions/image/svg-to-png';

export default function SvgToPngPage() {
  return (
    <ToolPage
      title="SVG to PNG"
      description="Rasterize SVG vector files to PNG images in your browser. No upload, no signup."
      accept={['.svg', 'image/svg+xml']}
      convert={svgToPngConvert}
      outputMimeType="image/png"
      outputExtension="png"
    />
  );
}
