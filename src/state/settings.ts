import { del, get, set } from 'idb-keyval';
import { create } from 'zustand';
import { type StateStorage, createJSONStorage, persist } from 'zustand/middleware';

export interface RecentConversion {
  id: string;
  tool: string;
  inputName: string;
  outputName: string;
  inputBytes: number;
  outputBytes: number;
  at: number;
}

export interface SettingsState {
  defaultJpegQuality: number;
  recentConversions: RecentConversion[];
  setDefaultJpegQuality: (q: number) => void;
  recordConversion: (entry: Omit<RecentConversion, 'id' | 'at'>) => void;
  clearRecent: () => void;
  reset: () => void;
}

const STORAGE_KEY = 'image-converter:settings:v1';

const idbStorage: StateStorage = {
  getItem: async (name) => {
    const value = await get(name);
    return typeof value === 'string' ? value : null;
  },
  setItem: async (name, value) => {
    await set(name, value);
  },
  removeItem: async (name) => {
    await del(name);
  },
};

const RECENT_LIMIT = 10;

export const useSettings = create<SettingsState>()(
  persist(
    (setState) => ({
      defaultJpegQuality: 0.92,
      recentConversions: [],
      setDefaultJpegQuality: (q) => setState({ defaultJpegQuality: clampQuality(q) }),
      recordConversion: (entry) =>
        setState((s) => ({
          recentConversions: [
            {
              ...entry,
              id:
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                  ? crypto.randomUUID()
                  : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
              at: Date.now(),
            },
            ...s.recentConversions,
          ].slice(0, RECENT_LIMIT),
        })),
      clearRecent: () => setState({ recentConversions: [] }),
      reset: () =>
        setState({
          defaultJpegQuality: 0.92,
          recentConversions: [],
        }),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => idbStorage),
      version: 1,
      partialize: (state) => ({
        defaultJpegQuality: state.defaultJpegQuality,
        recentConversions: state.recentConversions,
      }),
    },
  ),
);

export function clampQuality(q: number): number {
  if (Number.isNaN(q)) return 0.92;
  if (q < 0.3) return 0.3;
  if (q > 1) return 1;
  return q;
}

export const DEFAULT_JPEG_QUALITY = 0.92;
