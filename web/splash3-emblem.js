/* /splash3 only: the same PNG takes over its printed source, never a clone.
   SIFT/RANSAC on opaque cutout features: 12/18 inliers, median residual
   0.72 source px. PNG->2560x1104 map similarity transform below includes
   the PNG's transparent insets (alpha bbox 23,3..447,527), not just its shield. */
(function () {
  if (!document.body.classList.contains('splash-variant-3')) return;
  const el = document.querySelector('.venice-arms');
  if (!el) return;
  // Use the owner's original PNG unchanged; the public copy is byte-identical
  // to D:/100_star/venice/Venice-1642.png. Keep the map registration for placement.
  el.src = 'img/Venice-1642.png';
  const source = { a: .6277699827, b: .0048072373, x: 2153.8452382, y: 220.5698330,
                   width: 455, height: 549, mapWidth: 2560, mapHeight: 1104 };
  const s = Math.hypot(source.a, source.b), angle = Math.atan2(source.b, source.a);
  const corners = [[0,0],[455,0],[0,549],[455,549]].map(([x,y]) =>
    [source.x + source.a*x-source.b*y, source.y+source.b*x+source.a*y]);
  const bounds = { left: Math.min(...corners.map(p=>p[0])), top: Math.min(...corners.map(p=>p[1])),
    right: Math.max(...corners.map(p=>p[0])), bottom: Math.max(...corners.map(p=>p[1])) };
  let map, image, progress = 0, geometry, released = false, moved = false;
  document.body.appendChild(el);
  Object.assign(el.style, {position:'fixed',zIndex:'36',margin:'0',opacity:'0',pointerEvents:'none',
    objectFit:'fill',transformOrigin:'0 0',filter:'none'});
  const clamp = (v,lo,hi) => Math.max(lo,Math.min(hi,v));
  function layout() {
    if (!image) return;
    if (moved) {
      const margin = Math.min(12, innerWidth*.02, innerHeight*.02);
      let rect = el.getBoundingClientRect();
      const fit = Math.min(1, (innerWidth-2*margin)/rect.width, (innerHeight-2*margin)/rect.height);
      if (fit < 1) {
        el.style.width = parseFloat(el.style.width)*fit+'px';
        el.style.height = parseFloat(el.style.height)*fit+'px';
        rect = el.getBoundingClientRect();
      }
      const x = parseFloat(el.style.left)+clamp(rect.left,margin,innerWidth-margin-rect.width)-rect.left;
      const y = parseFloat(el.style.top)+clamp(rect.top,margin,innerHeight-margin-rect.height)-rect.top;
      el.style.left=x+'px';el.style.top=y+'px';
      window.__veniceEmblemDrag?.place(x,y);
      return;
    }
    const w=innerWidth,h=innerHeight,L=1+.12*(1-progress),margin=Math.min(12,w*.02,h*.02);
    // True cover, with a uniform source-scale cap only when the entire emblem
    // would exceed the viewport. Paper fills any exposed strips on extreme ratios.
    const k=Math.min(Math.max(w/2560,h/1104),
      (w-2*margin)/((bounds.right-bounds.left)*L),
      (h-2*margin)/((bounds.bottom-bounds.top)*L));
    // Start at center 42%; constrain source translation, never the emblem alone.
    const ox=clamp((w-2560*k)*.5,(margin-w/2)/L+w/2-k*bounds.left,
      (w-margin-w/2)/L+w/2-k*bounds.right);
    const oy=clamp((h-1104*k)*.42,(margin-h/2)/L+h/2-k*bounds.top,
      (h-margin-h/2)/L+h/2-k*bounds.bottom);
    Object.assign(image.style,{position:'absolute',left:ox+'px',top:oy+'px',width:2560*k+'px',height:1104*k+'px',maxWidth:'none',objectFit:'fill'});
    const tx=w/2+L*(ox+k*source.x-w/2),ty=h/2+L*(oy+k*source.y-h/2),q=k*L;
    Object.assign(el.style,{left:tx+'px',top:ty+'px',width:455*s*q+'px',height:549*s*q+'px',transform:`rotate(${angle}rad)`});
    geometry={left:w/2+L*(ox+k*bounds.left-w/2),top:h/2+L*(oy+k*bounds.top-h/2),
      width:(bounds.right-bounds.left)*q,height:(bounds.bottom-bounds.top)*q,
      originX:tx,originY:ty,k,layerScale:L,offsetX:ox,offsetY:oy,source,bounds};
    window.__veniceEmblemDrag?.place(tx,ty);
  }
  function render(p) {
    progress=clamp(p,0,1);
    if (map?.isConnected) Object.assign(map.style,{opacity:String(1-progress),transform:`scale(${1+.12*(1-progress)})`});
    el.style.opacity=String(progress);
    layout();
    if (progress === 1 && !released) {
      released=true;
      el.style.pointerEvents='auto';
      window.__veniceEmblemDrag?.resume();
      map?.remove();
    }
  }
  window.__splash3Emblem={attach(layer){map=layer;image=layer.querySelector('img');render(0);},render,
    get geometry(){return geometry;}, get released(){return released;},
    get ownsPosition(){return !moved;}, moved(){moved=true;}, source};
  addEventListener('resize',layout);
})();
