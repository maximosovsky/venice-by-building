import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const module = await import('../web/building-timeline.js').catch(() => ({}));
assert.equal(typeof module.readTimelineBuildings, 'function', 'per-building timeline reader must exist');
const {readTimelineBuildings, layoutTimeline} = module;
const config = JSON.parse(readFileSync('web/data/venezia.json'));
let bytes = readFileSync('web/data/attrs.bin');
if (bytes[0] === 31 && bytes[1] === 139) bytes = gunzipSync(bytes);
const model = readTimelineBuildings(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), config);
assert.equal(model.buildings.length, config.stats.buildings);
assert.equal(new Set(model.buildings.map(b => b.gid)).size, config.stats.buildings);
assert.deepEqual(model.counts, {exact:188, interval:5802, unknown:5147});
assert.equal(model.excludedBridges, 465);
for (const b of model.buildings) {
 assert.notEqual(b.src, 1);
 if (b.flag === 0) { assert.equal(b.kind, 'exact'); assert.equal(b.date, b.year); }
 if (b.flag === 1) { assert.equal(b.kind, 'interval'); assert.equal(b.date, null); }
 if (b.flag === 2) { assert.equal(b.kind, 'unknown'); assert.equal(b.date, null); }
}
for (const scale of [1, 4]) {
 const layout = layoutTimeline(model, {min:1000,max:2027,scale});
 assert.equal(layout.bricks.length,11137);
 assert.equal(new Set(layout.bricks.map(b=>b.gid)).size,11137);
 const rows = new Map();
 for (const b of layout.bricks) {
  assert.equal(b.w*b.h,48,'every building has equal area');
  assert.ok(b.x>=0 && b.y>=0 && b.x+b.w<=layout.width && b.y+b.h<=layout.height);
  if (b.kind==='exact') assert.equal(b.x,layout.left+(b.date-1000)*scale,'exact date uses actual year');
  const row=rows.get(b.y)||[];row.push(b);rows.set(b.y,row);
 }
 for (const row of rows.values()) {
  row.sort((a,b)=>a.x-b.x);
  for(let i=1;i<row.length;i++) assert.ok(row[i].x>=row[i-1].x+row[i-1].w+1,'bricks have distinct gaps');
 }
 assert.ok(layout.sections.some(s=>s.kind==='unknown'));
 assert.ok(layout.sections.some(s=>s.label.includes('1000–899')),'inconsistent original bounds are marked, not repaired');
 assert.ok(layout.sections.some(s=>s.label.includes('≤1800')),'zero lower bound means open interval, not fabricated year');
}
console.log(JSON.stringify({counts:model.counts,buildings:model.buildings.length,excludedBridges:model.excludedBridges,scales:[1,4],equalArea:true,noOverlap:true}));
