// Name-based colouring only: this does not assign a legal heritage status.
// Владелец атласа просил включить и венецианские Ca' (Ca' d'Oro, Ca' Rezzonico) и Casa: это те же
// палаццо, только названные по-венециански. Тест пересчитывает набор по этому же правилу.
export const PALAZZO_NAME = /\bPalazzo\b|\bCa['’]|\bCasa\b/i;
export const hasPalazzoName = value => typeof value === 'string' && PALAZZO_NAME.test(value);

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
