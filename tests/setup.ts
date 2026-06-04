import '@testing-library/jest-dom/vitest';

if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = function arrayBuffer(this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) resolve(reader.result);
        else reject(new Error('FileReader result was not an ArrayBuffer'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
      reader.readAsArrayBuffer(this);
    });
  };
}

if (typeof globalThis.ImageData === 'undefined') {
  class TestImageData {
    public readonly data: Uint8ClampedArray;
    public readonly width: number;
    public readonly height: number;
    constructor(data: Uint8ClampedArray, width: number, height?: number) {
      this.data = data;
      this.width = width;
      this.height = height ?? data.length / (width * 4);
    }
  }
  (globalThis as { ImageData: typeof TestImageData }).ImageData =
    TestImageData as unknown as typeof globalThis.ImageData;
}
