export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function inferOutputName(inputName: string, outputExtension: string): string {
  const lastDot = inputName.lastIndexOf('.');
  const base = lastDot > 0 ? inputName.slice(0, lastDot) : inputName;
  return `${base}.${outputExtension}`;
}
