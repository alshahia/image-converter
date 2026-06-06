import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = path.resolve(__dirname, '../..');
const HEADERS = readFileSync(path.join(REPO, 'public', '_headers'), 'utf-8');
const VITE_CONFIG = readFileSync(path.join(REPO, 'vite.config.ts'), 'utf-8');

function hasCspEnforce(haystack: string): boolean {
  return /(^|[\s/])Content-Security-Policy\s*:/im.test(haystack);
}

function extractCspEnforceValue(haystack: string): string | null {
  const m = haystack.match(/(^|[\s/])Content-Security-Policy\s*:\s*([^\n]+)/im);
  return m ? (m[2] ?? '').trim() : null;
}

describe('H-4 Content-Security-Policy header is present in both surfaces', () => {
  it('public/_headers has Content-Security-Policy (enforce)', () => {
    expect(hasCspEnforce(HEADERS)).toBe(true);
  });

  it('vite.config.ts server.headers has Content-Security-Policy (enforce)', () => {
    expect(VITE_CONFIG).toMatch(
      /server[\s\S]*?headers[\s\S]*?Content-Security-Policy/,
    );
  });

  it('vite.config.ts preview.headers has Content-Security-Policy (enforce)', () => {
    expect(VITE_CONFIG).toMatch(
      /preview[\s\S]*?headers[\s\S]*?Content-Security-Policy/,
    );
  });

  it('CSP policy includes the directives required by the app', () => {
    const value = extractCspEnforceValue(HEADERS);
    expect(value).not.toBeNull();
    expect(value).toMatch(/default-src\s+'self'/);
    expect(value).toMatch(/script-src[^;]*'self'/);
    expect(value).toMatch(/worker-src[^;]*blob:/);
    expect(value).toMatch(/img-src[^;]*blob:/);
    expect(value).toMatch(/object-src\s+'none'/);
    expect(value).toMatch(/frame-src\s+'none'/);
    expect(value).toMatch(/base-uri\s+'self'/);
  });
});
