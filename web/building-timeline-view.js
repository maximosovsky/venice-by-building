import {readTimelineBuildings,layoutTimeline} from './building-timeline.js';

export function installBuildingTimeline({attrs,config,host,presentation,lang}) {
  const model=readTimelineBuildings(attrs,config);
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('./building-timeline.css',import.meta.url).href;document.head.append(css);
  const panel=document.createElement('section');panel.className='building-timeline';
  panel.innerHTML='<div class="building-timeline-tools"><span class="building-timeline-summary"></span><label><span class="building-timeline-zoom-label"></span> <select class="building-timeline-zoom"><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label></div><div class="building-timeline-scroll" tabindex="0"><div class="building-timeline-space"><canvas></canvas></div></div><div class="building-timeline-help"></div>';
  host.prepend(panel);
  const scroll=panel.querySelector('.building-timeline-scroll'),space=panel.querySelector('.building-timeline-space'),canvas=panel.querySelector('canvas'),ctx=canvas.getContext('2d'),zoom=panel.querySelector('select');
  let layout,scale=1,lastKey='',raf=0;
  const stats={counts:model.counts,total:model.buildings.length,excludedBridges:model.excludedBridges,lastPaint:{exact:0,interval:0,unknown:0}};
  const words=()=>lang()==='ru'?{exact:'Точный год',interval:'Интервал',unknown:'Год неизвестен',invalid:'противоречивые границы',summary:`${model.buildings.length.toLocaleString('ru')} зданий · ${model.counts.exact} точных · ${model.counts.interval} интервальных · ${model.counts.unknown} без даты`,zoom:'Масштаб',help:'1 кирпич = 1 здание · сплошной: точный год · штрих: интервал (позиция внутри — не год) · серый: без даты. Прокрутите ↕ ↔; год выбирается на нижней шкале.'}:lang()==='it'?{exact:'Anno esatto',interval:'Intervallo',unknown:'Data ignota',invalid:'limiti incoerenti',summary:`${model.buildings.length.toLocaleString('it')} edifici · ${model.counts.exact} esatti · ${model.counts.interval} intervalli · ${model.counts.unknown} ignoti`,zoom:'Scala',help:'1 mattone = 1 edificio · pieno: anno esatto · tratteggio: intervallo (posizione interna ≠ anno) · grigio: ignoto. Scorri ↕ ↔; scegli l’anno sulla linea sotto.'}:{exact:'Exact year',interval:'Interval',unknown:'Unknown date',invalid:'inconsistent bounds',summary:`${model.buildings.length.toLocaleString('en')} buildings · ${model.counts.exact} exact · ${model.counts.interval} intervals · ${model.counts.unknown} unknown`,zoom:'Zoom',help:'1 brick = 1 building · solid: exact year · slash: interval (position inside ≠ year) · grey: unknown. Scroll ↕ ↔; choose the year on the line below.'};
  function rebuild() {
    scale=Math.max(Number(zoom.value),(scroll.clientWidth-32)/(config.yearMax+1-config.yearMin));
    layout=layoutTimeline(model,{min:config.yearMin,max:config.yearMax+1,scale});
    space.style.width=`${layout.width}px`;space.style.height=`${layout.height}px`;
    paint();
  }
  function paint() {
    if(!layout||!scroll.clientWidth)return;
    const dpr=Math.min(devicePixelRatio,2),w=scroll.clientWidth,h=scroll.clientHeight,sx=scroll.scrollLeft,sy=scroll.scrollTop;
    if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
    canvas.style.width=`${w}px`;canvas.style.height=`${h}px`;canvas.style.transform=`translate(${sx}px,${sy}px)`;
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.translate(-sx,-sy);
    const text=words();panel.querySelector('.building-timeline-summary').textContent=text.summary;panel.querySelector('.building-timeline-zoom-label').textContent=text.zoom;panel.querySelector('.building-timeline-help').textContent=text.help;
    canvas.setAttribute('role','img');canvas.setAttribute('aria-label',text.summary);scroll.setAttribute('aria-label',text.help);
    ctx.font='11px system-ui';ctx.textBaseline='top';
    for(const s of layout.sections) {
      if(s.y<sy-22||s.y>sy+h)continue;
      ctx.fillStyle='#5f625c';
      const label=s.kind==='exact'?text.exact:s.kind==='unknown'?`${text.unknown} · ${s.count}`:`${text.interval} ${s.rawFrom===0?'≤'+s.rawTo:s.rawFrom+'–'+s.rawTo}${s.valid?'':' · '+text.invalid} · ${s.count}`;
      ctx.fillText(label,sx+12,s.y);
      if(s.kind==='interval'&&s.valid){ctx.strokeStyle='#aaa59c';ctx.beginPath();ctx.moveTo(s.x0,s.y+16);ctx.lineTo(s.x1,s.y+16);ctx.stroke();}
    }
    stats.lastPaint={exact:0,interval:0,unknown:0};
    for(const b of layout.bricks) {
      if(b.x+b.w<sx||b.x>sx+w||b.y+b.h<sy||b.y>sy+h)continue;
      const p=presentation(b);ctx.globalAlpha=p.alpha;ctx.fillStyle=p.color;
      ctx.fillRect(b.x,b.y,b.w,b.h);
      if(b.kind==='interval'){ctx.strokeStyle='#fff';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(b.x+2,b.y+b.h-1);ctx.lineTo(b.x+5,b.y+1);ctx.stroke();}
      stats.lastPaint[b.kind]++;
    }
    ctx.globalAlpha=1;
    // The actual year marker belongs to the exact-date lane only.
    const year=presentation(null).year;
    ctx.strokeStyle='#b04f3e';ctx.beginPath();ctx.moveTo(layout.left+(year-layout.min)*scale,25);ctx.lineTo(layout.left+(year-layout.min)*scale,layout.sections[0].bottom);ctx.stroke();
    ctx.fillStyle='#ffffffee';ctx.fillRect(sx,sy,w,20);ctx.fillStyle='#5f625c';
    const step=scale>=2?50:100;
    for(let y=Math.ceil(layout.min/step)*step;y<=layout.max;y+=step){const x=layout.left+(y-layout.min)*scale;if(x>=sx&&x<sx+w)ctx.fillText(String(y),x,sy+3);}
    if(sy>layout.sections[0].bottom){ctx.fillStyle='#fff';ctx.fillRect(sx,sy,w,20);ctx.fillStyle='#5f625c';const s=[...layout.sections].reverse().find(s=>s.y<=sy+20);ctx.fillText(s?.kind==='unknown'?text.unknown:text.interval,sx+12,sy+3);}
  }
  function refresh() {const key=`${lang()} ${scroll.clientWidth} ${zoom.value}`;if(key!==lastKey){lastKey=key;rebuild();}else paint();}
  scroll.addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;paint();});});
  zoom.addEventListener('change',()=>{lastKey='';scroll.scrollLeft=0;refresh();});
  canvas.addEventListener('pointermove',e=>{const x=e.offsetX+scroll.scrollLeft,y=e.offsetY+scroll.scrollTop,b=layout.bricks.find(b=>x>=b.x&&x<=b.x+b.w&&y>=b.y&&y<=b.y+b.h),t=words();canvas.title=b?`GID ${b.gid} · ${b.kind==='exact'?t.exact+' '+b.date:b.kind==='interval'?t.interval+' '+(b.yfrom===0?'≤'+b.yto:b.yfrom+'–'+b.yto):t.unknown}`:'';});
  new ResizeObserver(refresh).observe(scroll);
  refresh();
  return {refresh,stats,get layout(){return layout;}};
}
