import requests, json, concurrent.futures, collections, math, pathlib, os
ROOT=pathlib.Path(os.environ['TMPDIR'])/'venice_probe'; ROOT.mkdir(exist_ok=True)
base='https://raw.githubusercontent.com/epfl-timemachine/venice-data-week-data/main/'
urls={
'1808':'https://zenodo.org/records/20715172/files/venice_1808_landregister_geometries.geojson?download=1',
'dorigo':base+'946_1408-dorigo/geometries/geometries_generalized.geojson',
'1740':'https://raw.githubusercontent.com/epfl-timemachine/venice-1740-landregister/main/1740_Catastici_2026-05-12_crs84.geojson',
'data-venice':'https://api.github.com/repos/epfl-timemachine/data-venice',
'git-search':'https://api.github.com/search/repositories?q=timemachineatlas',
'search-data':'https://timemachineatlas.eu/build/search.json',
}
def f(item):
 name,u=item
 try:
  r=requests.get(u,timeout=90);print(name,'URL',u,'STATUS',r.status_code)
  if r.status_code!=200:print(r.text[:200]);return
  (ROOT/(name+'.json')).write_text(r.text,encoding='utf-8')
  d=r.json()
  if isinstance(d,dict) and 'features' in d:
   fs=d['features'];ks=sorted(set(k for x in fs for k in x['properties']));print(name,'COUNT',len(fs),'TYPES',dict(collections.Counter(x['geometry']['type'] if x.get('geometry') else None for x in fs)),'FIELDS',ks,'SAMPLE',fs[0]['properties'],'CRS',d.get('crs'))
   if name=='1808':print('1808 parcel types',dict(collections.Counter(x['properties'].get('parcel_type') for x in fs)))
   if name=='dorigo':
    for k in ['start_date','end_date']:
     vals=[x['properties'][k] for x in fs if isinstance(x['properties'].get(k),(int,float))];print(k,min(vals),max(vals))
  else: print(name,str(d)[:3000])
 except Exception as e:print(name,repr(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as ex:list(ex.map(f,urls.items()))
