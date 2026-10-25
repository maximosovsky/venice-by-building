// Name-based colouring only: this does not assign a legal heritage status.
// Палаццо — это «Palazzo …» по названию, а также венецианские «Ca' …» (Ca' d'Oro, Ca' Rezzonico), но
// только те, что задокументированы в Викиданных и не названы службой или мостом: отель, библиотека,
// апартаменты, «ponte de Ca' …» — не палаццо. Владелец атласа: глина #7a675e остаётся только у палаццо,
// всё остальное носит цвет своего века, а до-1800-я масса без века — старую терракоту.
export const PALAZZO_NAME = /\bPalazzo\b/i;
export const CA_NAME = /\bCa['’]/i;
export const NOT_A_PALAZZO = /hotel|hostel|b&b|bibliotec|appartament|apartment|\bponte\b|oratorio|residence|guest|foresteria|private bridge/i;

export const hasPalazzoName = value => typeof value === 'string' && (PALAZZO_NAME.test(value) || CA_NAME.test(value));

export function isPalazzo(labels, item) {
  const strings = labels.filter(value => typeof value === 'string');
  if (strings.some(value => PALAZZO_NAME.test(value))) return true;
  if (!strings.some(value => CA_NAME.test(value))) return false;
  if (strings.some(value => NOT_A_PALAZZO.test(value))) return false;
  return Boolean(item?.qid);
}

export function buildPalazzoMask(attrs, config, wiki, names) {
  const count = attrs.byteLength / config.attrStride;
  const mask = new Uint8Array(count);
  for (let gid = 0; gid < count; gid++) {
    const offset = gid * config.attrStride;
    const wi = attrs.getInt32(offset + config.attrFields.wk[0], true);
    const ni = attrs.getInt32(offset + config.attrFields.nm[0], true);
    const item = wiki[wi];
    const labels = [names[ni], item?.label, ...Object.values(item?.la || {}).flat()];
    mask[gid] = isPalazzo(labels, item) ? 1 : 0;
  }
  return mask;
}
