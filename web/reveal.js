/* Сборка города после заставки.
   Дома приходят своим ходом: каждый падает в карту с неба — сбоку и сверху, на 260–500 метров, и садится на
   место за 0,9 секунды. Начало падения — uBorn, момент, когда тайл был разобран; порядок внутри тайла задаёт
   seed дома. Пока идёт заставка, часть города успевает упасть незаметно: к первому кадру дома уже стоят.

   Здесь это переигрывается: часы приложения отводятся назад к самому раннему uBorn и идут медленнее
   настоящего времени, так что поток падающих домов растягивается на SIGHT_MS. Когда последний дом сел, часы
   возвращаются к настоящему времени, подписи возвращаются на место. Зритель тронул карту — сборка кончается.

   Часы подменяются на уровне requestAnimationFrame — это единственная точка, через которую Three.js отдаёт
   время приложения. Файлы app.js и styles.css не трогаются. */
(function () {
  const SIGHT_MS = 10000;      // сколько длится видимый поток падающих домов
  const SLOWEST = 1 / 14;      // предел замедления: ниже время почти стоит и карта перестаёт отвечать
  const realRAF = window.requestAnimationFrame.bind(window);
  let mode = 'run';            // run — обычное время, slow — замедленное во время сборки
  let base = 0;                // показание часов при переходе
  let t0 = 0;                  // настоящее время в момент перехода
  let speed = 1;
  // An accepted play has a pending label prelude, not a completed reveal.
  let state = 'idle';
  let duration = SIGHT_MS;
  let cancelPlay = null;

  function vt(t) {
    if (mode === 'run') return t;
    return base + (t - t0) * speed;          // во время сборки часы идут своим, более медленным ходом
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

    if (cancelPlay) cancelPlay();
    state = 'pending';
    const labels = window.__dbg && window.__dbg.labelGroup;
    if (labels) labels.visible = true;
    const timers = [];
    const inputs = ['pointerdown', 'wheel', 'keydown', 'touchstart'];
    const stop = (completed = false) => {
      timers.forEach(clearTimeout);
      inputs.forEach(name => removeEventListener(name, cancel));
      mode = 'run';
      state = completed ? 'completed' : 'cancelled';
      cancelPlay = null;
    };
    const cancel = () => stop(false);
    cancelPlay = cancel;
    inputs.forEach(name => addEventListener(name, cancel, { passive: true }));

    // Keep normal RAF time during the label prelude. Cancellation clears this
    // timer as well as the completion timers: input must never restart slow time.
    timers.push(setTimeout(() => {
      base = (first - 0.05) * 1000;
      t0 = performance.now();
      const span = ((last + 0.9) - first + 0.05) * 1000;
      speed = Math.min(6, Math.max(SLOWEST, span / SIGHT_MS));
      duration = ((last + 1.0) * 1000 - base) / speed;
      mode = 'slow';
      state = 'running';
      timers.push(setTimeout(() => stop(true), duration));
      timers.push(setTimeout(() => stop(true), 30000));
    }, 520));
    return true;
  }

  window.__veniceReveal = { play, get mode() { return mode; }, get state() { return state; },
                            get speed() { return speed; },
                            get progress() { return state === 'pending' ? 0 : mode === 'slow'
                              ? Math.min(1, (performance.now() - t0) / duration) : 1; } };
})();