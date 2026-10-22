import pathlib,json,concurrent.futures,subprocess,zipfile,collections
out=pathlib.Path('C:/Users/1/Downloads/Venice_Geodata_20261022_2004'); base='https://idt2.regione.veneto.it/idt/download/layerDownload/'
rows=json.loads((out/'catalog.json').read_text(encoding='utf-8'))['result']['data']
tasks=[]
for r in rows:
 if r['tipo']=='CTRN5000' and r['fuso']=='Fuso Ovest':
  tasks.append((r['agg']+'/'+r['a_codice']+'.zip',base+'downloadCtrn5000_10000_Ctrr10000?dataCtrDtmId='+str(r['dataCtrDtmId'])))
tasks.append(('2006_Laguna_aree_complete.zip',base+'downloadGeoDBT?lotto=LOTTO%20LAGUNA%20DI%20VENEZIA&rif=ETRF2000&type=aree'))
print('TASKS',len(tasks),'YEARS',dict(collections.Counter(n.split('/')[0] for n,u in tasks)),flush=True)
def f(t):
 n,u=t; p=out/n; p.parent.mkdir(exist_ok=True)
 for attempt in range(3):
  r=subprocess.run(['curl','--silent','--show-error','--fail','-L','--http1.1','--connect-timeout','30','--max-time','240','-o',str(p),u],capture_output=True,text=True)
  if r.returncode==0 and zipfile.is_zipfile(p):
   with zipfile.ZipFile(p) as z:
    if z.testzip() is None:
     result={'file':n,'url':u,'bytes':p.stat().st_size,'members':len(z.namelist()),'verified':True}; print('OK',n,result['bytes'],flush=True); return result
  print('RETRY',n,attempt,r.stderr[:150],flush=True)
 return {'file':n,'url':u,'verified':False,'error':r.stderr[:400]}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 results=list(pool.map(f,tasks))
(out/'download_manifest.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print('RESULT',len(results),'OK',sum(r['verified'] for r in results),'FAILED',[r['file'] for r in results if not r['verified']],flush=True)
