// Name-based colouring only: this does not assign a legal heritage status.
export const hasPalazzoName = value => typeof value === 'string' && /\bPalazzo\b/i.test(value);

export function buildPalazzoMask(attrs, config, wiki, names) {
  const count = attrs.byteLength / config.attrStride;
  const mask = new Uint8Array(count);
  for (let gid = 0; gid < count; gid++) {
    const offset = gid * config.attrStride;
    const wi = attrs.getInt32(offset + config.attrFields.wk[0], true);
    const ni = attrs.getInt32(offset + config.attrFields.nm[0], true);
    const item = wiki[wi];
    const labels = [names[ni], item?.label, ...Object.values(item?.la || {}).flat()];
    mask[gid] = labels.some(hasPalazzoName) ? 1 : 0;
  }
  return mask;
}
