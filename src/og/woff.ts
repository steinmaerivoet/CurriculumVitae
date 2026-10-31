import { inflateSync } from "node:zlib";

/**
 * Turns a WOFF (1.0) font into the plain TrueType/OpenType file it wraps.
 *
 * The share card is drawn with resvg, which only reads TTF/OTF. The site's
 * fonts ship as WOFF in @fontsource, so this unwraps them at build time
 * instead of keeping a second copy of every font in the repository.
 * Spec: https://www.w3.org/TR/WOFF/
 */
export function woffToSfnt(woff: Uint8Array): Uint8Array {
  const src = new DataView(woff.buffer, woff.byteOffset, woff.byteLength);
  if (src.getUint32(0) !== 0x774f4646) throw new Error("Not a WOFF 1.0 file");
  const flavor = src.getUint32(4);
  const numTables = src.getUint16(12);

  const tables = Array.from({ length: numTables }, (_, i) => {
    const at = 44 + i * 20;
    const offset = src.getUint32(at + 4);
    const compLength = src.getUint32(at + 8);
    const origLength = src.getUint32(at + 12);
    const raw = woff.subarray(offset, offset + compLength);
    return {
      tag: src.getUint32(at),
      checksum: src.getUint32(at + 16),
      data: compLength < origLength ? new Uint8Array(inflateSync(raw)) : raw,
    };
  });

  const pad4 = (n: number) => (n + 3) & ~3;
  const headerSize = 12 + numTables * 16;
  const size = tables.reduce((sum, t) => sum + pad4(t.data.length), headerSize);
  const out = new Uint8Array(size);
  const dst = new DataView(out.buffer);

  // Offset table: binary-search hints as the OpenType spec defines them.
  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = 2 ** entrySelector * 16;
  dst.setUint32(0, flavor);
  dst.setUint16(4, numTables);
  dst.setUint16(6, searchRange);
  dst.setUint16(8, entrySelector);
  dst.setUint16(10, numTables * 16 - searchRange);

  let offset = headerSize;
  tables.forEach((t, i) => {
    const at = 12 + i * 16;
    dst.setUint32(at, t.tag);
    dst.setUint32(at + 4, t.checksum);
    dst.setUint32(at + 8, offset);
    dst.setUint32(at + 12, t.data.length);
    out.set(t.data, offset);
    offset += pad4(t.data.length);
  });
  return out;
}
