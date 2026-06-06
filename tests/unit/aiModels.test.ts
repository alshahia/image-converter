import { describe, expect, it } from 'vitest';
import { AI_MODELS, getModel } from '../../src/lib/engines/aiModels';

describe('aiModels', () => {
  it('exports the 3 Wave 8 models with correct metadata', () => {
    expect(AI_MODELS).toHaveLength(3);
    const silueta = getModel('silueta');
    expect(silueta.path).toBe('/models/silueta.onnx');
    expect(silueta.bytes).toBeGreaterThan(40 * 1024 * 1024);
    expect(silueta.license).toBe('Apache-2.0');

    const x2 = getModel('realesrgan-x2plus');
    expect(x2.path).toBe('/models/realesrgan-x2plus.fp16.onnx');
    expect(x2.license).toBe('BSD-3-Clause');

    const x4 = getModel('realesrgan-x4plus');
    expect(x4.path).toBe('/models/realesrgan-x4plus.fp16.onnx');
    expect(x4.license).toBe('BSD-3-Clause');
  });

  it('throws on unknown model id', () => {
    expect(() => getModel('nope' as never)).toThrow();
  });

  it('every model has a non-empty displayName and attributionUrl', () => {
    for (const m of AI_MODELS) {
      expect(m.displayName.length).toBeGreaterThan(0);
      expect(m.attributionUrl).toMatch(/^https?:\/\//);
    }
  });
});
