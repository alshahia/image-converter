import { get, set } from 'idb-keyval';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  clear: vi.fn(),
}));

const mockGet = vi.mocked(get);
const mockSet = vi.mocked(set);

describe('settings store', () => {
  beforeEach(() => {
    vi.resetModules();
    mockGet.mockReset();
    mockSet.mockReset();
    mockGet.mockResolvedValue(undefined);
    mockSet.mockResolvedValue(undefined);
  });

  it('exports the expected default JPEG quality constant', async () => {
    const { DEFAULT_JPEG_QUALITY } = await import('../../src/state/settings');
    expect(DEFAULT_JPEG_QUALITY).toBeCloseTo(0.92, 2);
  });

  it('clamps out-of-range quality values', async () => {
    const { clampQuality } = await import('../../src/state/settings');
    expect(clampQuality(-1)).toBeCloseTo(0.3, 2);
    expect(clampQuality(2)).toBe(1);
    expect(clampQuality(Number.NaN)).toBeCloseTo(0.92, 2);
    expect(clampQuality(0.5)).toBeCloseTo(0.5, 5);
  });

  it('persists defaultJpegQuality via idb-keyval', async () => {
    mockGet.mockResolvedValueOnce(
      JSON.stringify({
        state: { defaultJpegQuality: 0.5, recentConversions: [] },
        version: 1,
      }),
    );
    const { useSettings } = await import('../../src/state/settings');
    const setDefaultJpegQuality = useSettings.getState().setDefaultJpegQuality;
    setDefaultJpegQuality(0.75);
    expect(useSettings.getState().defaultJpegQuality).toBeCloseTo(0.75, 2);
  });

  it('records conversions and caps the history at 10 entries', async () => {
    const { useSettings } = await import('../../src/state/settings');
    const record = useSettings.getState().recordConversion;
    for (let i = 0; i < 12; i += 1) {
      record({
        tool: 'jpg-to-png',
        inputName: `in-${i}.jpg`,
        outputName: `out-${i}.png`,
        inputBytes: 1000 + i,
        outputBytes: 2000 + i,
      });
    }
    const recent = useSettings.getState().recentConversions;
    expect(recent).toHaveLength(10);
    expect(recent[0]?.inputName).toBe('in-11.jpg');
    expect(recent[9]?.inputName).toBe('in-2.jpg');
    for (const entry of recent) {
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.at).toBeLessThanOrEqual(Date.now());
    }
  });

  it('clearRecent empties the history', async () => {
    const { useSettings } = await import('../../src/state/settings');
    const { recordConversion, clearRecent } = useSettings.getState();
    recordConversion({
      tool: 'jpg-to-png',
      inputName: 'a.jpg',
      outputName: 'a.png',
      inputBytes: 1,
      outputBytes: 2,
    });
    clearRecent();
    expect(useSettings.getState().recentConversions).toEqual([]);
  });
});
