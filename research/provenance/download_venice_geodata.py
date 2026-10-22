import requests, pathlib, datetime, json, concurrent.futures, zipfile, collections
base='https://idt2.regione.veneto.it/idt/download/layerDownload/'
out=pathlib.Path('C:/Users/1/Downloads')/('Venice_Geodata_'+datetime.datetime.now().strftime('%Y%m%d_%H%M'))
out.mkdir(parents=True,exist_ok=True)
r=requests.get(base+'getCartaTecnicaByComune',params={'codComune':'27042','formatoFile':'SHAPE'},timeout=90); r.raise_for_status(); j=r.json(); (out/'catalog.json').write_text(json.dumps(j,ensure_ascii=False,indent=2),encoding='utf-8')
rows=j['result']['data']; assert len(rows)==j['result']['recordsTotal']
print('DIRECTORY',out,flush=True); print('CATALOG',len(rows),dict(collections.Counter((x['tipo'],x['agg']) for x in rows)),flush=True)
def download(lotto,year,kind):
 params={'lotto':lotto,'rif':'ETRF2000','type':kind}
 name=f'{year}_{"Venezia" if year==2010 else "Laguna"}_{kind}.zip'; p=out/name
 try:
  with requests.get(base+'downloadGeoDBT',params=params,stream=True,timeout=(30,240)) as resp:
   resp.raise_for_status(); print(name,resp.status_code,resp.headers.get('Content-Type'),resp.headers.get('Content-Disposition'),flush=True)
   with p.open('wb') as f:
    for chunk in resp.iter_content(1024*1024): f.write(chunk)
  if not zipfile.is_zipfile(p): print('NOT ZIP',name,p.read_bytes()[:300],flush=True); return
  with zipfile.ZipFile(p) as z:
   bad=z.testzip(); assert bad is None,bad
   print('VERIFIED',name,p.stat().st_size,'members',len(z.namelist()),'sample',z.namelist()[:15],flush=True)
 except Exception as e: print('ERROR',name,str(e),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 tasks=[('LOTTO COMUNE DI VENEZIA',2010,k) for k in ['aree','doc']]+[('LOTTO LAGUNA DI VENEZIA',2006,k) for k in ['aree','doc']]
 list(pool.map(lambda t:download(*t),tasks))
