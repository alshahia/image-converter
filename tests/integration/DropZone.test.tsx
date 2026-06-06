import { act, fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DropZone } from '../../src/components/upload/DropZone';

describe('DropZone paste (M-2)', () => {
  it('calls onFile when files are pasted onto the drop zone', () => {
    const onFile = vi.fn();
    const { container } = render(
      <DropZone accept={['.jpg']} onFile={onFile} prompt="Drop or choose" />,
    );
    const dropZone = container.firstElementChild as HTMLElement;
    expect(dropZone).not.toBeNull();
    const file = new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], 'clip.jpg', {
      type: 'image/jpeg',
    });
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(paste, 'clipboardData', {
      value: { files: [file], items: [] },
    });
    act(() => {
      fireEvent(dropZone, paste);
    });
    expect(onFile).toHaveBeenCalledTimes(1);
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('does not call onFile when paste has no files (text paste)', () => {
    const onFile = vi.fn();
    const { container } = render(
      <DropZone accept={['.jpg']} onFile={onFile} prompt="Drop or choose" />,
    );
    const dropZone = container.firstElementChild as HTMLElement;
    const paste = new Event('paste', { bubbles: true, cancelable: true });
    Object.defineProperty(paste, 'clipboardData', {
      value: { files: [], items: [] },
    });
    act(() => {
      fireEvent(dropZone, paste);
    });
    expect(onFile).not.toHaveBeenCalled();
  });

  it('has a visible button (the existing prompt) covering the drop area', () => {
    const { getByRole } = render(
      <DropZone accept={['.jpg']} onFile={() => {}} prompt="Drop or choose a JPG" />,
    );
    const button = getByRole('button', { name: /drop or choose a jpg/i });
    expect(button).toBeInTheDocument();
  });
});
