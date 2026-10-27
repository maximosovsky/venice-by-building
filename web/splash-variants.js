/* Логика для вариантов заставки со старой картой.
   Загружается вместо splash.js; поддерживает три режима по классу body. */
(function () {
  const T = {
    ru: {
      title: 'Венеция, дом за домом',
      place: 'Исторический центр: здания, мосты, дворы и улицы — по эпохам застройки',
      count: 'собрано объектов',
      of: 'из',
      src: 'Источники: геоданные · классификация единиц застройки VPRG · Викиданные · Wikimedia Commons · муниципальная съёмка 2010',
      slow: 'Город большой — первые объекты показываются по мере готовности.',
      files: 'файлы карты',
      progress: 'Раскладываем город',
      caption: 'Венеция. Маттеус Мериан, 1642',
    },
    it: {
      title: 'Venezia, edificio per edificio',
      place: 'Centro storico: edifici, ponti, corti e calli, per epoca di costruzione',
      count: 'oggetti disposti',
      of: 'su',
      src: 'Fonti: dati geografici · classificazione VPRG · Wikidata · Wikimedia Commons · rilievo comunale 2010',
      slow: 'La città è grande: i primi oggetti compaiono appena pronti.',
      files: 'file della mappa',
      progress: 'Disponiamo la città',
      caption: 'Venezia. Matthäus Merian, 1642',
    },
    en: {
      title: 'Venice, building by building',
      place: 'The historic centre: buildings, bridges, courtyards and streets, by era of construction',
      count: 'objects placed',
      of: 'of',
      src: 'Sources: geographical data · VPRG building-unit classification · Wikidata · Wikimedia Commons · municipal survey 2010',
      slow: 'The city is large — the first objects appear as they are ready.',
      files: 'map files',
      progress: 'Laying out the city',
      caption: 'Venice. Matthäus Merian, 1642',
    },
  };

  function lang() {
    return window.__veniceInterfaceLanguage?.get() || 'en';
  }

  const t = T[lang()];
  const variant = document.body.classList.contains('splash-variant-3') ? 3
                : document.body.classList.contains('splash-variant-2') ? 2 : 1;

  const box = document.createElement('div');
  box.id = 'splash';
  box.setAttribute('role', 'status');
  box.setAttribute('aria-live', 'polite');
  box.innerHTML =
    '<h1 class="mark">' + t.title + '</h1>' +
    '<p class="place">' + t.place + '</p>' +
    '<div class="track"><div class="fill" id="splash-fill"></div></div>' +
    '<div class="count" id="splash-count"></div>' +
    '<p class="src">' + t.src + '</p>' +
    '<p class="slow" id="splash-slow" hidden>' + t.slow + '</p>';

  const mapLayer = document.createElement('div');
  mapLayer.id = 'map-layer';
  mapLayer.innerHTML = '<img src="img/venice-merian-1642-2560.jpg" ' +
    'srcset="img/venice-merian-1642-800.jpg 800w, img/venice-merian-1642-2560.jpg 2560w" ' +
    'sizes="100vw" alt="" loading="eager">' +
    '<p class="map-caption">' + t.caption + '</p>';
  if (variant !== 1) document.body.appendChild(mapLayer);
  const handoff = variant === 3 && window.__splash3Emblem;
  if (handoff) handoff.attach(mapLayer);

  const start = () => {
    document.body.appendChild(box);
    document.body.classList.add('splash-on');
    const line = document.getElementById('loading');
    if (line && !line.textContent.trim()) line.textContent = t.progress + ' ';
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });

  const fill = box.querySelector('#splash-fill');
  const countEl = box.querySelector('#splash-count');
  const slowEl = box.querySelector('#splash-slow');
  let total = 0;

  const NEEDED = ['data/venezia.json', 'data/layers.json', 'data/attrs.bin', 'data/pack0.bin', 'data/pack1.bin',
                  'data/land.bin', 'data/water.bin', 'data/context.bin', 'data/labels.json', 'data/names.json',
                  'data/wiki.json', 'data/heritage.json', 'data/quests.json'];
  const got = new Set();
  const realFetch = window.fetch;
  window.fetch = function (input, init) {
    const url = (typeof input === 'string') ? input : (input && input.url) || '';
    const key = NEEDED.find(n => url.split('?')[0].endsWith(n));
    const p = realFetch.apply(this, arguments);
    if (key) p.then(() => got.add(key), () => got.add(key));
    return p;
  };

  fetch('data/venezia.json').then(r => r.ok ? r.json() : null).then(cfg => {
    if (cfg && cfg.stats && cfg.stats.objects) {
      total = cfg.stats.objects;
      countEl.textContent = '0 ' + t.of + ' ' + total.toLocaleString('ru-RU') + ' — ' + t.count;
    }
  }).catch(() => { /* без числа тоже понятно */ });

  let fontsReady = false;
  if (document.fonts) document.fonts.ready.then(() => { fontsReady = true; }, () => { fontsReady = true; });
  else fontsReady = true;
  const sceneReady = () => {
    const d = window.__dbg;
    return !!(d && d.labelGroup && d.labelGroup.parent && d.uniforms);
  };

  let done = false, revealStarted = false;
  const finish = () => {
    if (done) return;
    done = true;
    document.body.classList.remove('splash-on');
    box.classList.add('gone');
    setTimeout(() => box.remove(), 650);
  };

  // Вариант 2: карта уходит с задержкой после splash.
  function fadeMapAfter(delay) {
    setTimeout(() => {
      document.body.classList.add('map-fade');
      setTimeout(() => mapLayer.remove(), 950);
    }, delay);
  }

  // Вариант 3: карта синхронно с reveal, сразу видна под splash.
  function syncMapToReveal() {
    function tick() {
      if (!document.body.contains(mapLayer)) return;
      const r = window.__veniceReveal;
      const p = r ? r.progress : 1;
      if (handoff) {
        handoff.render(p);
        if (p < 1) requestAnimationFrame(tick);
        return;
      }
      mapLayer.style.opacity = Math.max(0, 1 - p).toFixed(3);
      const scale = 1 + 0.12 * (1 - p);
      mapLayer.style.transform = 'scale(' + scale.toFixed(4) + ')';
      if (p >= 0.999) {
        document.body.classList.add('map-fade');
        setTimeout(() => mapLayer.remove(), 950);
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }

  let last = 0;
  setInterval(() => {
    if (done) return;
    const p = document.getElementById('progress');
    const pct = p ? Math.max(0, Math.min(100, parseInt(p.textContent, 10) || 0)) : 0;
    if (pct > last) last = pct;
    const share = got.size / NEEDED.length;
    const shown = Math.round(Math.min(100, share * 55 + last * 0.45));
    fill.style.width = shown + '%';
    if (total) countEl.textContent = Math.round(total * shown / 100).toLocaleString('ru-RU') +
      ' ' + t.of + ' ' + total.toLocaleString('ru-RU') + ' — ' + t.count +
      ' · ' + t.files + ' ' + got.size + '/' + NEEDED.length;
    if (performance.now() > 12000) slowEl.hidden = false;
    const line = document.getElementById('loading');
    const fatal = !!line && line.classList.contains('fatal');
    if (fatal) { finish(); if (handoff) handoff.render(1); mapLayer.remove(); return; }
    const filesDone = got.size >= NEEDED.length;
    const tilesDone = !line || line.hidden || document.body.dataset.ready === '1';
    const shipsReady = window.__veniceShipsReady?.status === 'ready';
    const ready = filesDone && tilesDone && fontsReady && sceneReady() && shipsReady;
    if (ready && !revealStarted) {
      revealStarted = true;
      setTimeout(() => {
        const r = window.__veniceReveal;
        if (r && r.play()) {
          if (variant === 2) fadeMapAfter(1200);
          if (variant === 3) syncMapToReveal();
          setTimeout(finish, 420);
        } else {
          finish();
          if (handoff) handoff.render(1);
          else if (variant !== 1) {
            document.body.classList.add('map-fade');
            setTimeout(() => mapLayer.remove(), 950);
          }
        }
      }, 140);
    }
    // A late-ready scene still gets the original handoff. A wall-clock hold
    // limit must not release the engraving/emblem before reveal.play starts.
    // Completion and reduced-motion/error paths above already finish it.
  }, 150);

  setTimeout(() => {
    const line = document.getElementById('loading');
    if (!line || !line.classList.contains('fatal')) return;
    finish();
    if (handoff) handoff.render(1);
    if (!document.body.classList.contains('map-fade')) {
      document.body.classList.add('map-fade');
      setTimeout(() => mapLayer && mapLayer.remove(), 950);
    }
  }, 60000);
})();
