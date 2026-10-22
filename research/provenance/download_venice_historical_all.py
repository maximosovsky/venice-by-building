import requests,pathlib,datetime,json,hashlib,zipfile,concurrent.futures,math,time,sqlite3,gzip
ROOT=pathlib.Path('C:/Users/1/Downloads')/('Venice_Historical_'+datetime.datetime.now().strftime('%Y%m%d_%H%M'))
ROOT.mkdir(parents=True,exist_ok=True)
manifest=[]
def save_meta(name,data):
 p=ROOT/name;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def fetch(task):
 name,url,kind,expected=task;p=ROOT/name;p.parent.mkdir(parents=True,exist_ok=True)
 result={'file':name,'url':url,'kind':kind,'verified':False}
 for attempt in range(3):
  try:
   r=requests.get(url,timeout=(30,180));r.raise_for_status();b=r.content
   if kind=='pdf':
    assert b.startswith(b'%PDF'), 'Not PDF'
    import pymupdf
    d=pymupdf.open(stream=b,filetype='pdf');result['pages']=len(d);d.close()
   elif kind=='zip':
    import io
    with zipfile.ZipFile(io.BytesIO(b)) as z:
     assert z.testzip() is None;result['members']=len(z.namelist())
   elif kind=='json':
    j=r.json();result['records']=len(j.get('features',[])) if isinstance(j,dict) and 'features' in j else len(j) if isinstance(j,list) else None
   elif kind=='pbf':
    assert b and not b.lstrip().startswith((b'<',b'{')), 'Not protobuf'
   else:
    assert 'Incapsula incident' not in r.text and 'Request unsuccessful' not in r.text,'WAF response'
   if expected: assert hashlib.md5(b).hexdigest()==expected.split(':')[-1], 'Checksum mismatch'
   p.write_bytes(b);result.update(verified=True,bytes=len(b),sha256=hashlib.sha256(b).hexdigest());print('OK',name,len(b),flush=True);return result
  except Exception as e:
   result['error']=str(e)
   if attempt==2: print('FAILED',name,str(e),flush=True)
 return result
print('ROOT',ROOT,flush=True)
zen=requests.get('https://zenodo.org/api/records/20715172',timeout=60).json();save_meta('1808/zenodo_record.json',zen)
tasks=[('1808/'+f['key'],f['links']['self'],'json' if f['key'].endswith(('.json','.geojson')) else 'text',f['checksum']) for f in zen['files']]
for repo in ['venice-1740-landregister','venice-1808-landregister','venice-data-week-data']:
 tasks.append(('repositories/'+repo+'.zip','https://codeload.github.com/epfl-timemachine/'+repo+'/zip/refs/heads/main','zip',None))
municipal={
'NTA_Citta_Antica.pdf':'https://www.comune.venezia.it/sites/default/files/cartanet/VPRG_Citta_Antica/NTA_CA.pdf',
'NTA_Appendice_1.pdf':'https://www.comune.venezia.it/sites/default/files/cartanet/VPRG_Citta_Antica/NTA_Appendice_1.pdf',
'San_Servolo_A5_ages.pdf':'https://www.comune.venezia.it/sites/comune.venezia.it/files/page/files/Tavola%20A.5%20tipologie%20edilizie%20e%20classi%20di%20et%C3%A0_Redatto_OCR.pdf',
'elaborati_di_analisi.pdf':'https://www.comune.venezia.it/sites/comune.venezia.it/files/page/files/elaborati_di_analisi.pdf'}
for n,u in municipal.items():tasks.append(('municipal/'+n,u,'pdf',None))
tasks.extend([('atlas/search.json','https://timemachineatlas.eu/build/search.json','json',None),('atlas/index.html','https://timemachineatlas.eu/','text',None)])
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as e:
 for result in e.map(fetch,tasks):manifest.append(result);save_meta('manifest.json',manifest)
# Download every zoom and tile covering the published bounds.
u='https://api.maptiler.com/tiles/40c9608f-bd20-4fb4-90ea-fbded066d866/tiles.json?key=laTrAUbj896UpFd2TvvV'
tilejson=requests.get(u,timeout=60).json();save_meta('atlas/tilejson.json',tilejson)
def xy(lon,lat,z):
 return int((lon+180)/360*(2**z)),int((1-math.asinh(math.tan(math.radians(lat)))/math.pi)/2*(2**z))
west,south,east,north=tilejson['bounds'];tt=[]
for z in range(tilejson['minzoom'],tilejson['maxzoom']+1):
 x0,y0=xy(west,north,z);x1,y1=xy(east,south,z)
 for x in range(x0,x1+1):
  for y in range(y0,y1+1):tt.append((f'atlas/tiles/{z}/{x}/{y}.pbf',tilejson['tiles'][0].format(z=z,x=x,y=y),'pbf',None))
print('TILE_TASKS',len(tt),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as e:
 for result in e.map(fetch,tt):manifest.append(result);save_meta('manifest.json',manifest)
# Preserve source metadata; never treat WAF HTML as downloaded geodata.
for n,u in [('classification_schema','https://geoportale.comune.venezia.it/Geocortex/Essentials/REST/sites/GeoUrbanistica/map/mapservices/146/layers/14?f=json'),('classification_query','https://arcgis-prd.comune.venezia.it/server/rest/services/URBANISTICA/VPRG_Citta_Antica_WGS84_15_01_2021/MapServer/14/query?where=1%3D1&outFields=*&f=geojson'),('analysis_page','https://www.comune.venezia.it/it/content/clone-vprg-venezia-analisi')]:
 result=fetch(('municipal/'+n+('.json' if n!='analysis_page' else '.html'),u,'json' if n!='analysis_page' else 'text',None));manifest.append(result);save_meta('manifest.json',manifest)
print('SUMMARY',len(manifest),'OK',sum(x['verified'] for x in manifest),'FAILED',[x['file'] for x in manifest if not x['verified']],flush=True)
(ROOT/'download_root.txt').write_text(str(ROOT),encoding='utf-8')
