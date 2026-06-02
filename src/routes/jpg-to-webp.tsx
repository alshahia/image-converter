import { useCallback, useState } from 'react';
import { ToolOptions } from '../components/tool/ToolOptions';
import { ToolPage } from '../components/tool/ToolPage';
import { Slider } from '../components/ui/slider';
import { jpgToWebp } from '../lib/conversions/image/jpg-to-webp';

export default function JpgToWebpPage() {
  const [quality, setQuality] = useState(80);
  const convert = useCallback((file: File) => jpgToWebp(file, { quality }), [quality]);
  return (
    <ToolPage
      title="JPG to WebP"
      description="Convert JPG images to WebP in your browser. No upload, no signup."
      accept={['.jpg', '.jpeg', 'image/jpeg']}
      convert={convert}
      outputMimeType="image/webp"
      outputExtension="webp"
      optionsComponent={
        <ToolOptions title="Options">
          <Slider
            id="jpg-to-webp-quality"
            label="Quality"
            value={quality}
            onChange={setQuality}
            min={1}
            max={100}
            step={1}
          />
          <p className="text-xs text-neutral-500">
            Higher quality produces larger files. 80 is a good default for the web.
          </p>
        </ToolOptions>
      }
    />
  );
}
