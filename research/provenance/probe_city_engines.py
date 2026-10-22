import requests,concurrent.futures,pathlib,json,re,urllib.parse
from bs4 import BeautifulSoup
root=pathlib.Path('C:/Users/1/AppData/Local/hermes/cache/scratch/city_engines');root.mkdir(exist_ok=True)
sites={'mexico':'https://cdmx-edificios.vercel.app/','milan':'https://milano-by-building-production.up.railway.app/','italy':'https://italia-by-building-production.up.railway.app/','montpellier':'https://3dcities.ar-go.co/montpellier/','nantes':'https://3dcities.ar-go.co/nantes/?lang=en','helsinki':'https://www.aikamatkakuvia.fi/kruununhaka'}
def probe(item):
 name,url=item;result={'name':name,'url':url,'scripts':[]}
 try:
  r=requests.get(url,timeout=45);r.raise_for_status();r.encoding='utf-8';(root/(name+'.html')).write_text(r.text,encoding='utf-8');s=BeautifulSoup(r.text,'html.parser');result['text']=s.get_text(' ',strip=True)[:14000]
  scripts=[urllib.parse.urljoin(r.url,e['src']) for e in s.select('script[src]')];result['script_urls']=scripts
  for i,u in enumerate(scripts):
   if any(w in u for w in ['google','analytics','vendor','unpkg','jsdelivr','cookie','jquery']):continue
   try:
    a=requests.get(u,timeout=40);a.raise_for_status();p=root/(name+f'_script_{i}.js');p.write_text(a.text,encoding='utf-8');t=a.text
    patterns=['three','maplibre','mapbox','deck.gl','babylon','cesium','pmtiles','.bin','.geojson','.json','.glb','.gltf','Float32Array','Uint32Array','DataView','fetch(','wiki','year_min','year_max','start_date','source_tier','Worker','roof']
    excerpts={}
    for w in patterns:
     hits=list(re.finditer(re.escape(w),t,re.I));
     if hits:excerpts[w]={'count':len(hits),'samples':[t[max(0,m.start()-140):m.end()+230] for m in hits[:3]]}
    result['scripts'].append({'url':u,'path':str(p),'bytes':len(a.content),'evidence':excerpts})
   except Exception as e:result['scripts'].append({'url':u,'error':str(e)})
 except Exception as e:result['error']=str(e)
 (root/(name+'_results.json')).write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
 print(json.dumps(result,ensure_ascii=False),flush=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as e:list(e.map(probe,sites.items()))
