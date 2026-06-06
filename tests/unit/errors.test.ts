import { describe, expect, it } from 'vitest';
import { toError } from '../../src/lib/utils/errors';

describe('toError', () => {
  it('returns the same Error instance', () => {
    const e = new Error('x');
    expect(toError(e)).toBe(e);
  });
  it('wraps a string in an Error', () => {
    expect(toError('boom').message).toBe('boom');
  });
  it('wraps a plain object via JSON', () => {
    expect(toError({ code: 1 }).message).toBe('{"code":1}');
  });
  it('falls back for circular objects', () => {
    const o: Record<string, unknown> = {};
    o.self = o;
    expect(toError(o).message).toBe('Unknown error');
  });
  it('falls back for null', () => {
    expect(toError(null).message).toBe('Unknown error');
  });
  it('uses provided fallback for undefined', () => {
    expect(toError(undefined, 'fallback').message).toBe('fallback');
  });
  it('handles numbers', () => {
    expect(toError(42).message).toBe('42');
  });
});
