import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const highlight=readFileSync('web/church-building-highlight.js','utf8');
const app=readFileSync('web/app.js','utf8');
assert.ok(highlight.includes("color: '#436817'"),'church full volumes must use Venezia green');
// Владелец атласа: на вкладке «Мосты» цвет храмов должен остаться как на главной. Значит, вкладка
// больше не включает зелёный оверлей храмовых зданий, а сам шейдер задаёт им бирюзу и там.
assert.ok(!app.includes("setSourceVisible('bridges-tab'"),'Bridges tab must not repaint churches');
assert.ok(!app.includes("setSourceVisible('bridge',"),'bridge route must not repaint churches');
assert.match(app,/uMode < 3\.5[\s\S]{0,400}vec3\(0\.380, 0\.576, 0\.580\)/,'the Bridges lens keeps the church turquoise of the main map');
assert.ok(app.includes("const GROUP_COLORS = ['#c62828'"),'the Bridges lens paints the bridges themselves red');
console.log('Venezia green and Bridges tab wiring PASS');
