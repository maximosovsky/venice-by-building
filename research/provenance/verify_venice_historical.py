import pathlib,json,requests,hashlib,math,sqlite3,gzip,collections,zipfile
import mapbox_vector_tile
root=pathlib.Path('C:/Users/1/Downloads/Venice_Historical_20261022_2025');manifest=json.loads((root/'manifest.json').read_text())
for entry in manifest:
 if entry['kind']=='pbf' and not entry['verified']:
  r=requests.get(entry['url'],timeout=45)
  if r.status_code==204:
   entry.update(verified=True,empty=True,http_status=204,bytes=0);entry.pop('error',None)
  elif r.status_code==400 and r.text.strip()=='Out of bounds':
   entry.update(not_available=True,http_status=400,error='Source returns Out of bounds for this zoom')
# Validate every nonempty MVT by actual decoding; make an offline tile container.
p=root/'atlas/venice_atlas_downloaded.mbtiles'; con=sqlite3.connect(p)
con.executescript('CREATE TABLE metadata (name TEXT,value TEXT);CREATE TABLE tiles (zoom_level INTEGER,tile_column INTEGER,tile_row INTEGER,tile_data BLOB);CREATE UNIQUE INDEX tile_index ON tiles(zoom_level,tile_column,tile_row);')
for n,v in [('name','Venice TimeMachine Atlas downloaded snapshot'),('type','overlay'),('format','pbf'),('minzoom','13'),('maxzoom','16'),('bounds','12.30091,45.41917,12.36785,45.44917'),('description','Historical states. Dates are not necessarily construction/demolition dates; source redistribution license not established.')]:con.execute('INSERT INTO metadata VALUES (?,?)',(n,v))
counts=collections.Counter();layers=collections.Counter();features14=[]
for entry in manifest:
 if entry['kind']!='pbf' or not entry['verified']:continue
 _,_,z,x,yfile=entry['file'].split('/');z=int(z);x=int(x);y=int(yfile[:-4]);counts[z]+=1
 if entry.get('empty'):
  con.execute('INSERT INTO tiles VALUES (?,?,?,?)',(z,x,2**z-1-y,b''));continue
 b=(root/entry['file']).read_bytes();dec=mapbox_vector_tile.decode(b);entry['decoded']=True
 for n,l in dec.items():layers[(z,n)]+=len(l['features'])
 con.execute('INSERT INTO tiles VALUES (?,?,?,?)',(z,x,2**z-1-y,gzip.compress(b)))
 if z==14:
  for n,l in dec.items():
   extent=l['extent']
   def transform(c):
    if c and isinstance(c[0],(int,float)):
     wx=(x+c[0]/extent)/2**z;wy=(y+1-c[1]/extent)/2**z
     return [wx*360-180,math.degrees(math.atan(math.sinh(math.pi*(1-2*wy))))]
    return [transform(v) for v in c]
   for f in l['features']:
    f['geometry']['coordinates']=transform(f['geometry']['coordinates']);f['properties']['_source_layer']=n;f['properties']['_source_tile']=f'{z}/{x}/{y}';features14.append(f)
con.commit();assert con.execute('PRAGMA integrity_check').fetchone()[0]=='ok';tile_count=con.execute('SELECT count(*) FROM tiles').fetchone()[0];con.close()
(root/'atlas/decoded_z14_all_layers.geojson').write_text(json.dumps({'type':'FeatureCollection','features':features14},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
(root/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
summary={'requests':len(manifest),'verified_downloads':sum(e['verified'] for e in manifest),'tile_counts_by_zoom':dict(counts),'mbtiles_tile_count':tile_count,'z14_feature_count':len(features14),'layer_feature_counts':{f'{z}/{n}':c for (z,n),c in layers.items()},'blocked':[e for e in manifest if not e['verified'] and not e.get('not_available')],'unavailable_zooms':sorted(set(int(e['file'].split('/')[2]) for e in manifest if e.get('not_available')))}
(root/'verification_summary.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps(summary,ensure_ascii=False,indent=2))
# Extract repository contents without executing any supplied code.
for p in (root/'repositories').glob('*.zip'):
 target=root/'repositories'/p.stem
 with zipfile.ZipFile(p) as z:
  assert z.testzip() is None
  for info in z.infolist():
   dest=target/info.filename
   assert dest.resolve().is_relative_to(target.resolve())
  z.extractall(target)
 print('EXTRACTED',p.name,len(z.namelist()))
