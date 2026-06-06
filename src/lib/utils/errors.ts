/**
 * Convert any thrown value into a proper `Error` instance.
 *
 * Engines and route code often reject with non-Error values (a string, an
 * object, a code number). `useConversion` and other UI hooks need a real
 * `Error` to display a message and a stack trace consistently. This helper
 * centralizes the conversion so the policy is in one place.
 *
 * Strategy:
 *   1. If it's already an Error, return it unchanged.
 *   2. If it's a string, wrap it.
 *   3. Otherwise try JSON; if that throws (circular structure, BigInt, etc.),
 *      fall back to the provided `fallback` message (default "Unknown error").
 */
export function toError(e: unknown, fallback = 'Unknown error'): Error {
  if (e instanceof Error) return e;
  if (typeof e === 'string') return new Error(e);
  if (typeof e === 'number' || typeof e === 'boolean') return new Error(String(e));
  if (e === null || e === undefined) return new Error(fallback);
  try {
    const json = JSON.stringify(e);
    if (json === undefined) return new Error(fallback);
    return new Error(json);
  } catch {
    return new Error(fallback);
  }
}
