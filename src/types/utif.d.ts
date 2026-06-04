declare module 'utif' {
  interface TiffIfd {
    t256?: number[];
    t257?: number[];
    t258?: number[];
    t259?: number[];
    t262?: number[];
    t273?: number[];
    t277?: number[];
    t278?: number[];
    t279?: number[];
    t282?: number[];
    t283?: number[];
    t284?: number[];
    t286?: number[];
    t287?: number[];
    t296?: number[];
    t305?: string[];
    t338?: number[];
    width?: number;
    height?: number;
    isLE?: boolean;
    data?: Uint8Array;
  }
  export function encodeImage(
    rgba: Uint8Array,
    w: number,
    h: number,
    metadata?: Record<string, unknown>,
  ): ArrayBuffer;
  export function decode(buff: ArrayBuffer): TiffIfd[];
  export function decodeImage(buff: ArrayBuffer, img: TiffIfd, ifds?: TiffIfd[]): void;
  const _default: {
    encodeImage: typeof encodeImage;
    decode: typeof decode;
    decodeImage: typeof decodeImage;
  };
  export default _default;
}
