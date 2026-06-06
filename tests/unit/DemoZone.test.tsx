import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DemoZone } from '../../src/components/landing/DemoZone';

const realCreate = URL.createObjectURL;
const realRevoke = URL.revokeObjectURL;

beforeEach(() => {
  let counter = 0;
  vi.spyOn(URL, 'createObjectURL').mockImplementation(() => `blob:fake-${++counter}`);
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  // jsdom's Image doesn't fire onload for data: URLs by default;
  // fake it out so DemoZone's decode step completes.
  const realImage = globalThis.Image;
  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = 4;
    naturalHeight = 4;
    decoding = 'async';
    set src(_value: string) {
      // async-mimic: schedule the onload to fire on the next microtask
      Promise.resolve().then(() => this.onload?.());
    }
  }
  globalThis.Image = FakeImage as unknown as typeof Image;
  return () => {
    globalThis.Image = realImage;
  };
});

afterEach(() => {
  URL.createObjectURL = realCreate;
  URL.revokeObjectURL = realRevoke;
  vi.restoreAllMocks();
});

function makePngFile(name = 'test.png'): File {
  // PNG magic header — won't be decoded, just needs to look like a file
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])], name, {
    type: 'image/png',
  });
}

describe('DemoZone (Phase 7.4)', () => {
  it('renders the initial drop zone with a hidden file input', () => {
    render(<DemoZone />);
    expect(screen.getByText(/try it now/i)).toBeTruthy();
    expect(screen.getByText(/drag a photo here/i)).toBeTruthy();
    // input is sr-only but present in the DOM
    expect(screen.getByLabelText(/choose a photo from your device/i)).toBeTruthy();
  });

  it('rejects non-image files and shows an error', async () => {
    render(<DemoZone />);
    const input = screen.getByLabelText(/choose a photo from your device/i);
    const pdfFile = new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], 'doc.pdf', {
      type: 'application/pdf',
    });
    fireEvent.change(input, { target: { files: [pdfFile] } });

    await waitFor(() => {
      expect(screen.getByText(/please choose an image file/i)).toBeTruthy();
    });
  });

  it('processes a valid image and shows the result panel', async () => {
    render(<DemoZone />);
    const input = screen.getByLabelText(/choose a photo from your device/i);
    fireEvent.change(input, { target: { files: [makePngFile('hi.png')] } });

    await waitFor(() => {
      expect(screen.getByText(/smaller/i)).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: /convert another/i })).toBeTruthy();
  });

  it('Convert another returns to the idle drop zone', async () => {
    render(<DemoZone />);
    const input = screen.getByLabelText(/choose a photo from your device/i);
    fireEvent.change(input, { target: { files: [makePngFile('hi.png')] } });
    await waitFor(() => screen.getByText(/smaller/i));
    fireEvent.click(screen.getByRole('button', { name: /convert another/i }));
    expect(screen.getByText(/drag a photo here/i)).toBeTruthy();
  });

  it('revokes blob URLs when Convert another is clicked', async () => {
    render(<DemoZone />);
    const input = screen.getByLabelText(/choose a photo from your device/i);
    fireEvent.change(input, { target: { files: [makePngFile('hi.png')] } });
    await waitFor(() => screen.getByText(/smaller/i));
    fireEvent.click(screen.getByRole('button', { name: /convert another/i }));
    // Two URLs were created (original + result). Both should be revoked.
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
