export function isAcceptedType(file: File, accept: ReadonlyArray<string>): boolean {
  if (accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = file.type.toLowerCase();
  return accept.some((token) => {
    const t = token.toLowerCase();
    if (t.startsWith('.')) {
      return name.endsWith(t);
    }
    if (t.endsWith('/*')) {
      const prefix = t.slice(0, -1);
      return type.startsWith(prefix);
    }
    return type === t;
  });
}

export function humanReadableAccept(accept: ReadonlyArray<string>): string {
  return accept
    .map((t) => {
      if (t.startsWith('.')) return t.toUpperCase();
      return t;
    })
    .join(', ');
}
