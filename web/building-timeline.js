// One equal-area brick per building. Positions inside an interval are packing,
// never inferred construction years. Keep raw bounds, including inconsistent ones.
const READ = {'<i2':'getInt16','|u1':'getUint8','<u4':'getUint32'};
export function readTimelineBuildings(attrs, config) {
  const buildings = [], counts = {exact:0,interval:0,unknown:0};
  let excludedBridges = 0;
  for (let gid=0; gid<attrs.byteLength/config.attrStride; gid++) {
    const b={gid};
    for (const k of ['src','flag','year','yfrom','yto','sp','lay0','lay1']) {
      const [off,type]=config.attrFields[k];
      b[k]=attrs[READ[type]](gid*config.attrStride+off,true);
    }
    if (b.src===1) {excludedBridges++;continue;}
    b.kind=b.flag===0?'exact':b.flag===1?'interval':'unknown';
    b.date=b.kind==='exact'?b.year:null;
    counts[b.kind]++;buildings.push(b);
  }
  return {buildings,counts,excludedBridges};
}

export function layoutTimeline(model, {min,max,scale=1}) {
  const left=12, w=8, h=6, dx=10, dy=8;
  const width=Math.ceil(left+(max-min)*scale+20), bricks=[], sections=[];
  let y=30;
  const exact=model.buildings.filter(b=>b.kind==='exact').sort((a,b)=>a.date-b.date||a.gid-b.gid);
  const ends=[];
  for (const b of exact) {
    const x=left+(b.date-min)*scale;
    let row=ends.findIndex(end=>end+2<=x);
    if(row<0) row=ends.length;
    ends[row]=x+w;
    bricks.push({...b,x,y:y+row*dy,w,h});
  }
  sections.push({kind:'exact',label:'Exact year',y:8,bottom:y+Math.max(1,ends.length)*dy});
  y+=Math.max(1,ends.length)*dy+34;
  const intervals=new Map();
  for(const b of model.buildings.filter(b=>b.kind==='interval')) {
    const key=`${b.yfrom}:${b.yto}`;
    if(!intervals.has(key)) intervals.set(key,[]);
    intervals.get(key).push(b);
  }
  const groups=[...intervals.values()].sort((a,b)=>a[0].yfrom-b[0].yfrom||a[0].yto-b[0].yto);
  for(const group of groups) {
    const b=group[0], valid=b.yfrom<=b.yto && b.yto>=min && b.yfrom<max;
    const x0=valid?left+(Math.max(min,b.yfrom)-min)*scale:left;
    const x1=valid?left+(Math.min(max,b.yto+1)-min)*scale:width-12;
    const columns=Math.max(1,Math.floor((x1-x0)/dx));
    const label=b.yfrom===0?`≤${b.yto}`:`${b.yfrom}–${b.yto}`;
    const section={kind:'interval',label:label+(valid?'':' · inconsistent bounds'),y,x0,x1,rawFrom:b.yfrom,rawTo:b.yto,valid,count:group.length};
    y+=22;
    group.forEach((b,i)=>bricks.push({...b,x:x0+(i%columns)*dx,y:y+Math.floor(i/columns)*dy,w,h}));
    y+=Math.ceil(group.length/columns)*dy+18;
    section.bottom=y;sections.push(section);
  }
  const unknown=model.buildings.filter(b=>b.kind==='unknown'), columns=Math.floor((width-left-12)/dx);
  sections.push({kind:'unknown',label:'Unknown date · no position on the year axis',y,count:unknown.length});
  y+=24;
  unknown.forEach((b,i)=>bricks.push({...b,x:left+(i%columns)*dx,y:y+Math.floor(i/columns)*dy,w,h}));
  y+=Math.ceil(unknown.length/columns)*dy+12;
  return {bricks,sections,width,height:y,left,scale,min,max};
}
