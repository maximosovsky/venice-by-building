/* Делает эмблему .venice-arms перетаскиваемой, как магнит на холодильнике.
   Позицию запоминаем в localStorage. Подключается после app.js или в любом HTML с эмблемой. */
(function () {
  const el = document.querySelector('.venice-arms');
  if (!el) return;

  // Вынимаем эмблему из masthead, чтобы она могла летать свободно.
  document.body.appendChild(el);
  el.style.position = 'fixed';
  const owner = window.__splash3Emblem;
  let suspended = !!owner && !owner.released;
  el.style.zIndex = owner ? '36' : '10';
  el.style.cursor = 'grab';
  el.style.userSelect = 'none';
  el.style.touchAction = 'none';
  el.style.margin = '0';

  // Начальная позиция: там, где раньше был masthead.
  const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 16;
  const safeTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0;
  let x = gutter;
  let y = Math.max(gutter, safeTop + gutter);

  let saved = null;
  try { if (!owner) saved = localStorage.getItem('venice-emblem-pos'); } catch (e) { /* storage unavailable */ }
  if (saved) {
    try {
      const p = JSON.parse(saved);
      if (typeof p.x === 'number' && typeof p.y === 'number') { x = p.x; y = p.y; }
    } catch (e) { /* ignore broken save */ }
  }

  const apply = () => {
    el.style.left = x + 'px';
    el.style.top = y + 'px';
  };
  if (owner) {
    x = owner.geometry?.originX ?? x;
    y = owner.geometry?.originY ?? y;
  } else apply();

  let dragging = false, didMove = false, startX, startY, startLeft, startTop;
  window.__veniceEmblemDrag = {
    place(left, top) { if (!dragging) { x = left; y = top; } },
    resume() { suspended = false; }
  };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const client = e => {
    const t = e.touches && e.touches[0];
    return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY };
  };

  const onDown = e => {
    if (suspended) return;
    didMove = false;
    dragging = true;
    const c = client(e);
    startX = c.x; startY = c.y;
    startLeft = x; startTop = y;
    el.style.cursor = 'grabbing';
    if (e.cancelable) e.preventDefault();
  };

  const onMove = e => {
    if (!dragging) return;
    const c = client(e);
    if (c.x !== startX || c.y !== startY) { didMove = true; owner?.moved(); }
    const rect = el.getBoundingClientRect();
    const w = rect.width || 112;
    const h = rect.height || 218;
    const insetX = rect.left - x, insetY = rect.top - y;
    x = clamp(startLeft + c.x - startX, -insetX, window.innerWidth - w - insetX);
    y = clamp(startTop + c.y - startY, -insetY, window.innerHeight - h - insetY);
    apply();
    if (e.cancelable) e.preventDefault();
  };

  let compact = false;
  const compactOnTap = () => {
    if (compact || document.body.dataset.ready !== '1' || !matchMedia('(max-width: 760px)').matches) return;
    compact = true;
    owner?.moved(); // Keep the released decoration independent of map relayout.
    const style = getComputedStyle(el);
    const width = parseFloat(style.width), height = parseFloat(style.height);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.style.transition = reduced ? 'none' : 'width 420ms cubic-bezier(.22,1,.36,1), height 420ms cubic-bezier(.22,1,.36,1)';
    el.style.width = width / 3 + 'px';
    el.style.height = height / 3 + 'px';
  };

  const onUp = e => {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = 'grab';
    if (!didMove && e?.type !== 'touchcancel') compactOnTap();
    try {
      if (!owner || didMove) localStorage.setItem('venice-emblem-pos', JSON.stringify({ x, y }));
    } catch (e) { /* storage unavailable */ }
  };

  el.addEventListener('mousedown', onDown);
  el.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
  window.addEventListener('touchcancel', onUp);
})();
