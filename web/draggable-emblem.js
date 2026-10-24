/* Делает эмблему .venice-arms перетаскиваемой, как магнит на холодильнике.
   Позицию запоминаем в localStorage. Подключается после app.js или в любом HTML с эмблемой. */
(function () {
  const el = document.querySelector('.venice-arms');
  if (!el) return;

  // Вынимаем эмблему из masthead, чтобы она могла летать свободно.
  document.body.appendChild(el);
  el.style.position = 'fixed';
  el.style.zIndex = '10';
  el.style.cursor = 'grab';
  el.style.userSelect = 'none';
  el.style.touchAction = 'none';
  el.style.margin = '0';

  // Начальная позиция: там, где раньше был masthead.
  const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 16;
  const safeTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sat')) || 0;
  let x = gutter;
  let y = Math.max(gutter, safeTop + gutter);

  const saved = localStorage.getItem('venice-emblem-pos');
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
  apply();

  let dragging = false, startX, startY, startLeft, startTop;

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  const client = e => {
    const t = e.touches && e.touches[0];
    return t ? { x: t.clientX, y: t.clientY } : { x: e.clientX, y: e.clientY };
  };

  const onDown = e => {
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
    const w = el.offsetWidth || 112;
    const h = el.offsetHeight || 218;
    x = clamp(startLeft + c.x - startX, 0, window.innerWidth - w);
    y = clamp(startTop + c.y - startY, 0, window.innerHeight - h);
    apply();
    if (e.cancelable) e.preventDefault();
  };

  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    el.style.cursor = 'grab';
    localStorage.setItem('venice-emblem-pos', JSON.stringify({ x, y }));
  };

  el.addEventListener('mousedown', onDown);
  el.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
  window.addEventListener('touchcancel', onUp);
})();
