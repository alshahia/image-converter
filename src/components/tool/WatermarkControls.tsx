import type { ChangeEvent } from 'react';
import type { WatermarkPosition } from '../../lib/conversions/image/watermark';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';

export interface WatermarkControlsState {
  mode: 'text' | 'image';
  text: string;
  position: WatermarkPosition;
  opacity: number;
  fontSize: number;
  color: string;
  imageFile: File | null;
  imageScale: number;
}

export interface WatermarkControlsProps {
  value: WatermarkControlsState;
  onChange: (next: WatermarkControlsState) => void;
  disabled?: boolean;
}

const POSITIONS: ReadonlyArray<{
  value: WatermarkPosition;
  label: string;
  row: number;
  col: number;
}> = [
  { value: 'top-left', label: 'Top left', row: 0, col: 0 },
  { value: 'top', label: 'Top', row: 0, col: 1 },
  { value: 'top-right', label: 'Top right', row: 0, col: 2 },
  { value: 'left', label: 'Left', row: 1, col: 0 },
  { value: 'center', label: 'Center', row: 1, col: 1 },
  { value: 'right', label: 'Right', row: 1, col: 2 },
  { value: 'bottom-left', label: 'Bottom left', row: 2, col: 0 },
  { value: 'bottom', label: 'Bottom', row: 2, col: 1 },
  { value: 'bottom-right', label: 'Bottom right', row: 2, col: 2 },
];

export function WatermarkControls({ value, onChange, disabled = false }: WatermarkControlsProps) {
  const update = (patch: Partial<WatermarkControlsState>) => {
    onChange({ ...value, ...patch });
  };

  const handleImagePick = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    update({ imageFile: file });
  };

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Watermark type" className="flex gap-2">
        <Button
          type="button"
          variant={value.mode === 'text' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => update({ mode: 'text' })}
          disabled={disabled}
          aria-pressed={value.mode === 'text'}
        >
          Text
        </Button>
        <Button
          type="button"
          variant={value.mode === 'image' ? 'primary' : 'secondary'}
          size="md"
          onClick={() => update({ mode: 'image' })}
          disabled={disabled}
          aria-pressed={value.mode === 'image'}
        >
          Image
        </Button>
      </div>

      {value.mode === 'text' ? (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="watermark-text"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Watermark text
          </label>
          <textarea
            id="watermark-text"
            value={value.text}
            onChange={(e) => update({ text: e.target.value })}
            disabled={disabled}
            rows={2}
            placeholder="© Your name 2026"
            className="w-full resize-y rounded-lg border border-white/60 bg-glass-soft px-3 py-2 text-sm text-ink shadow-glass-inset backdrop-blur-glass-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-inverse"
          />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <label
            htmlFor="watermark-image"
            className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
          >
            Watermark image
          </label>
          <input
            id="watermark-image"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            onChange={handleImagePick}
            disabled={disabled}
            className="block w-full text-sm text-ink file:mr-3 file:rounded-pill file:border-0 file:bg-drift-cta file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:scale-[1.02] dark:text-ink-inverse"
          />
          {value.imageFile && (
            <p className="text-xs text-ink-muted dark:text-neutral-400">
              {value.imageFile.name} · {(value.imageFile.size / 1024).toFixed(1)} KB
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Position</span>
        <div role="radiogroup" aria-label="Watermark position" className="grid grid-cols-3 gap-1.5">
          {POSITIONS.map((pos) => {
            const active = value.position === pos.value;
            return (
              <label
                key={pos.value}
                className={`flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border text-xs font-semibold transition-all duration-200 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-2 ${
                  active
                    ? 'border-accent bg-accent text-white shadow-drift-card dark:bg-accent dark:text-white'
                    : 'border-white/60 bg-glass-soft text-ink hover:bg-glass-strong dark:border-white/10 dark:bg-white/[0.04] dark:text-ink-inverse dark:hover:bg-white/[0.08]'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <input
                  type="radio"
                  name="watermark-position"
                  value={pos.value}
                  checked={active}
                  onChange={() => update({ position: pos.value })}
                  disabled={disabled}
                  className="sr-only"
                />
                <span aria-hidden="true" className="block h-2 w-2 rounded-full bg-current" />
                <span className="sr-only">{pos.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      <Slider
        id="watermark-opacity"
        label="Opacity"
        value={Math.round(value.opacity * 100)}
        onChange={(v) => update({ opacity: v / 100 })}
        min={5}
        max={100}
        step={1}
        disabled={disabled}
      />

      {value.mode === 'text' ? (
        <>
          <Slider
            id="watermark-font-size"
            label="Font size"
            value={value.fontSize}
            onChange={(v) => update({ fontSize: v })}
            min={12}
            max={200}
            step={1}
            disabled={disabled}
          />
          <div className="flex flex-col gap-2">
            <label
              htmlFor="watermark-color"
              className="text-sm font-medium text-neutral-700 dark:text-neutral-300"
            >
              Color
            </label>
            <input
              id="watermark-color"
              type="color"
              value={value.color}
              onChange={(e) => update({ color: e.target.value })}
              disabled={disabled}
              className="h-10 w-20 cursor-pointer rounded-lg border border-white/60 bg-glass-soft dark:border-white/10 dark:bg-white/[0.04]"
            />
          </div>
        </>
      ) : (
        <Slider
          id="watermark-image-scale"
          label="Image size"
          value={Math.round(value.imageScale * 100)}
          onChange={(v) => update({ imageScale: v / 100 })}
          min={5}
          max={100}
          step={1}
          disabled={disabled}
        />
      )}
    </div>
  );
}
