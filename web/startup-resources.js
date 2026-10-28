// Shared early fetches. Mutable data URLs keep revalidatable server policies.
// Catch speculative failures immediately; required consumers still see rejection.
import { GROUND_ASSET } from './ground-asset.js';
const bytes = new Map(), json = new Map();
function shared(cache, url, read) {
  if (!cache.has(url)) {
    const promise = fetch(url).then(response => {
      if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
      return read(response);
    });
    promise.catch(() => {});
    cache.set(url, promise);
  }
  return cache.get(url);
}
export function fetchBytes(url) { return shared(bytes, url, r => r.arrayBuffer()); }
const binary = new Map();
export function fetchBin(url) {
  if (!binary.has(url)) {
    const promise = fetchBytes(url).then(buf => {
      const head = new Uint8Array(buf, 0, Math.min(2, buf.byteLength));
      if (head[0] !== 0x1f || head[1] !== 0x8b) return buf;
      return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
    });
    promise.catch(() => {});
    binary.set(url, promise);
  }
  return binary.get(url);
}
export function fetchJSON(url) { return shared(json, url, r => r.json()); }
export function preloadShips(urls) { urls.forEach(fetchBytes); }
fetchBin(GROUND_ASSET);
['attrs','suburbs','land','water','context','suburbs-land'].forEach(n => fetchBin(`data/${n}.bin`));
['layers','suburbs','church-buildings','church-turquoise','labels','wiki','names','heritage','quests'].forEach(n => fetchJSON(`data/${n}.json`));
fetchJSON('data/venezia.json').then(config => config.packs.forEach(name => fetchBin(`data/${name}`))).catch(() => {});
