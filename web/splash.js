/* Заставка на время сборки города.
   Проценты берём у самого приложения (оно пишет их в #progress по мере разбора тайлов) — своих
   выдуманных чисел не показываем. Уходим сразу, как только карта готова: приложение прячет #loading
   или включает экран ошибки. Ничего не перекрываем: заставка не ловит щелчки. */
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
    },
  };

  function lang() {
    return window.__veniceInterfaceLanguage?.get() || 'en';
  }

  const t = T[lang()];
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

  const start = () => {
    document.body.appendChild(box);
    // Строку приложения сдвигаем вверх: она дублирует процент, но остаётся видимой.
    document.body.classList.add('splash-on');
    const line = document.getElementById('loading');
    if (line && !line.textContent.trim()) line.textContent = t.progress + ' ';
  };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start, { once: true });

  const fill = box.querySelector('#splash-fill');
  const countEl = box.querySelector('#splash-count');
  const slowEl = box.querySelector('#splash-slow');
  let total = 0;

  // Самый ранний счётчик: сколько файлов карты уже скачано. Приложение отдаёт прогресс разбора тайлов
  // одним скачком в конце, поэтому до него полоса ведёт себя мертво — ведём её по файлам, а после
  // подмешиваем число приложения.
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

  // Сколько объектов всего — из конфигурации приложения (одно число, тот же файл, что оно уже качает).
  fetch('data/venezia.json').then(r => r.ok ? r.json() : null).then(cfg => {
    if (cfg && cfg.stats && cfg.stats.objects) {
      total = cfg.stats.objects;
      countEl.textContent = '0 ' + t.of + ' ' + total.toLocaleString('ru-RU') + ' — ' + t.count;
    }
  }).catch(() => { /* без числа тоже понятно */ });

  // Полная готовность: файлы карты, разобранные тайлы (приложение прячет свою строку), шрифты и собранная сцена.
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

  let last = 0;
  setInterval(() => {
    if (done) return;
    const p = document.getElementById('progress');
    const pct = p ? Math.max(0, Math.min(100, parseInt(p.textContent, 10) || 0)) : 0;
    if (pct > last) last = pct;
    // Полоса: файлы карты дают первые 55 %, разбор тайлов приложением — остальное.
    const share = got.size / NEEDED.length;
    const shown = Math.round(Math.min(100, share * 55 + last * 0.45));
    fill.style.width = shown + '%';
    if (total) countEl.textContent = Math.round(total * shown / 100).toLocaleString('ru-RU') +
      ' ' + t.of + ' ' + total.toLocaleString('ru-RU') + ' — ' + t.count +
      ' · ' + t.files + ' ' + got.size + '/' + NEEDED.length;
    if (performance.now() > 12000) slowEl.hidden = false;
    const line = document.getElementById('loading');
    const fatal = !!line && line.classList.contains('fatal');
    if (fatal) { finish(); return; }                         // ошибка важнее заставки
    const filesDone = got.size >= NEEDED.length;
    const tilesDone = !line || line.hidden || document.body.dataset.ready === '1';
    const shipsReady = window.__veniceShipsReady?.status === 'ready';
    const ready = filesDone && tilesDone && fontsReady && sceneReady() && shipsReady;
    if (ready && !revealStarted) {
      revealStarted = true;
      // Сборка: часы приложения отводятся назад, город вырастает заново — уже на глазах.
      setTimeout(() => {
        const r = window.__veniceReveal;
        if (r && r.play()) setTimeout(finish, 420);          // заставка тает, пока дома растут
        else finish();
      }, 140);
    }
    // Декоративная задержка не обходит полную готовность кораблей и карты.
    if (!done && ready && performance.now() > 22000) finish();
  }, 150);

  // Ошибка приложения важнее заставки; незавершённую загрузку успехом не считаем.
  setTimeout(() => { const line = document.getElementById('loading');
    if (line && line.classList.contains('fatal')) finish(); }, 60000);
})();