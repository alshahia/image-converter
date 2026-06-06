import { type ChangeEvent, type DragEvent, type ClipboardEvent, useCallback, useRef, useState } from 'react';

export interface UseFileDropResult {
  isDragging: boolean;
  open: () => void;
  onDragOver: (e: DragEvent<HTMLElement>) => void;
  onDragEnter: (e: DragEvent<HTMLElement>) => void;
  onDragLeave: (e: DragEvent<HTMLElement>) => void;
  onDrop: (e: DragEvent<HTMLElement>) => void;
  onPaste: (e: ClipboardEvent<HTMLElement>) => void;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inputProps: {
    ref: React.RefObject<HTMLInputElement>;
    type: 'file';
    accept: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    className: string;
    tabIndex: number;
    'aria-hidden': true;
  };
}

export interface UseFileDropOptions {
  accept: ReadonlyArray<string>;
  onFile: (file: File | File[]) => void;
  multiple?: boolean;
}

export function useFileDrop({
  accept,
  onFile,
  multiple = false,
}: UseFileDropOptions): UseFileDropResult {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const open = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const onDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragging(false);
      const files = e.dataTransfer.files;
      if (!files || files.length === 0) return;
      if (multiple) {
        onFile(Array.from(files));
      } else {
        const file = files[0];
        if (file) onFile(file);
      }
    },
    [multiple, onFile],
  );

  const onInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      if (multiple) {
        onFile(Array.from(files));
      } else {
        const file = files[0];
        if (file) onFile(file);
      }
      e.target.value = '';
    },
    [multiple, onFile],
  );

  const onPaste = useCallback(
    (e: ClipboardEvent<HTMLElement>) => {
      const files = e.clipboardData?.files;
      if (!files || files.length === 0) return;
      e.preventDefault();
      if (multiple) {
        onFile(Array.from(files));
      } else {
        const file = files[0];
        if (file) onFile(file);
      }
    },
    [multiple, onFile],
  );

  return {
    isDragging,
    open,
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop,
    onPaste,
    onInputChange,
    inputProps: {
      ref: inputRef,
      type: 'file',
      accept: accept.join(','),
      onChange: onInputChange,
      className: 'sr-only',
      tabIndex: -1,
      'aria-hidden': true,
    },
  };
}
