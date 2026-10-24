/* Добавляет на страницу перетаскиваемую лодку boat2.png, как магнит на холодильнике.
   Позиция сохраняется в localStorage. Подключается в HTML после app.js. */
(function () {
  const src = 'img/boat2.png';
  const id = 'draggable-boat';
  if (document.getElementById(id)) return;

  const img = document.createElement('img');
  img.id = id;
  img.src = src;
  img.alt = '';
  img.setAttribute('aria-hidden', 'true');
  img.style.cssText = 'position:fixed;z-index:11;width:clamp(64px,9vw,110px);height:auto;cursor:grab;user-select:none;touch-action:none;';
  document.body.appendChild(img);

  const size = { w: img.offsetWidth || 80, h: img.offsetHeight || 80 };
  const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 16;
  let x = window.innerWidth - gutter - size.w;
  let y = window.innerHeight - gutter - size.h;

  const saved = localStorage.getItem('venice-boat-pos');
  if (saved) {
    try {
      const p = JSON.parse(saved);
      if (typeof p.x === 'number' && typeof p.y === 'number') { x = p.x; y = p.y; }
    } catch (e) { /* ignore broken save */ }
  }

  const apply = () => {
    img.style.left = x + 'px';
    img.style.top = y + 'px';
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
    img.style.cursor = 'grabbing';
    if (e.cancelable) e.preventDefault();
  };
  const onMove = e => {
    if (!dragging) return;
    const c = client(e);
    const w = img.offsetWidth || 80;
    const h = img.offsetHeight || 80;
    x = clamp(startLeft + c.x - startX, 0, window.innerWidth - w);
    y = clamp(startTop + c.y - startY, 0, window.innerHeight - h);
    apply();
    if (e.cancelable) e.preventDefault();
  };
  const onUp = () => {
    if (!dragging) return;
    dragging = false;
    img.style.cursor = 'grab';
    localStorage.setItem('venice-boat-pos', JSON.stringify({ x, y }));
  };

  img.addEventListener('mousedown', onDown);
  img.addEventListener('touchstart', onDown, { passive: false });
  window.addEventListener('mousemove', onMove);
  window.addEventListener('touchmove', onMove, { passive: false });
  window.addEventListener('mouseup', onUp);
  window.addEventListener('touchend', onUp);
  window.addEventListener('touchcancel', onUp);
})();
