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
