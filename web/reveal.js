/* Сборка города после заставки.
   Здания в шейдере растут от своего uBorn (момент, когда тайл был разобран) за 0,9 секунды, и порядок роста —
   порядок загрузки: пока идёт заставка, часть города успевает вырасти незаметно. Здесь мы это переигрываем:
   часы приложения отводятся назад к самому раннему uBorn и идут ускоренно, пока не догонят настоящее время.
   Здания снова собираются, но уже на глазах и за фиксированные 2,5 секунды.

   Часы подменяются на уровне requestAnimationFrame — это единственная точка, через которую Three.js отдаёт
   время приложения. Файлы app.js и styles.css не трогаются. */
(function () {
  const TARGET_MS = 2500;      // сколько должна длиться видимая сборка
  const realRAF = window.requestAnimationFrame.bind(window);
  let mode = 'run';            // run — обычное время, fast — ускоренное после отвода назад
  let base = 0;                // показание часов при переходе
  let t0 = 0;                  // настоящее время в момент перехода
  let speed = 1;

  function vt(t) {
    if (mode === 'run') return t;
    const v = base + (t - t0) * speed;
    if (v >= t) { mode = 'run'; return t; }   // догнали настоящее время: дальше без подмены
    return v;
  }
  window.requestAnimationFrame = cb => realRAF(t => cb(vt(t)));

  function meshes() {
    const d = window.__dbg;
    const scene = d && d.labelGroup && d.labelGroup.parent;
    if (!scene) return [];
    const out = [];
    scene.traverse(o => { if (o.isMesh && o.material && o.material.uniforms) out.push(o); });
    return out;
  }

  function play() {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ms = meshes();
    const borns = ms.map(m => m.material.uniforms.uBorn && m.material.uniforms.uBorn.value)
                    .filter(v => typeof v === 'number');
    if (reduce || borns.length < 10) return false;

    const first = Math.min.apply(null, borns);
    const last = Math.max.apply(null, borns);
    if (!(last > first)) return false;                    // всё выросло разом — переигрывать нечего

    // Спрятать подписи на время сборки: иначе они висят над ещё не выросшими домами.
    const labels = window.__dbg && window.__dbg.labelGroup;
    if (labels) labels.visible = false;

    base = (first - 0.05) * 1000;
    t0 = performance.now();
    // Ускорение такое, чтобы весь рост (от первого рождения до последнего дома) уложился в TARGET_MS.
    // Медленнее настоящего времени не идём: иначе часы никогда не догонят и сборка повиснет.
    const span = ((last + 0.9) - first + 0.05) * 1000;
    speed = Math.max(1, span / TARGET_MS);
    mode = 'fast';

    // Конец сборки — когда последний дом достроился: дальше часы возвращаются к настоящему времени
    // (прыжок вперёд, уже выросшие дома от него не меняются) и подписи возвращаются на место.
    const endAt = ((last + 1.0) * 1000 - base) / speed;
    const stop = () => { mode = 'run'; if (labels) labels.visible = true; };
    setTimeout(stop, endAt);
    setTimeout(() => { if (mode === 'fast') stop(); }, 12000);   // страховка
    return true;
  }

  window.__veniceReveal = { play, get mode() { return mode; },
                            get progress() { return mode === 'fast'
                              ? Math.min(1, (performance.now() - t0) / TARGET_MS) : 1; } };
})();