"""Wikipedia church/temple inventory and honest mixed-mode lagoon route.

Run: PYTHONPATH=pipeline python -m venice.s11_church_route
Research evidence is persisted under data/processed/church_research (ignored).
Never turn a connector into a walking track. Building coordinates are not entrances.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re
import time
import urllib.parse
import xml.etree.ElementTree as ET

import networkx as nx
from pyproj import Transformer
import requests

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'data/processed/church_research'
PROJECT = Transformer.from_crs(4326, 32633, always_xy=True)
ORIGIN = PROJECT.transform(12.3387, 45.4340)
AREA_ORDER = ['Cannaregio','Santa Croce','San Polo','Dorsoduro','San Marco','Castello',
              'Sacca Fisola','Giudecca','San Giorgio Maggiore','Isola di San Giorgio Maggiore',
              'San Michele','Murano','Mazzorbo','Burano','Torcello','San Francesco del Deserto',
              "Sant'Erasmo",'Vignole',"Sant'Andrea",'Lido','San Lazzaro degli Armeni',
              'San Servolo','Pellestrina','San Clemente','Sacca Sessola','Santa Maria delle Grazie']


def parse_list(text, lang):
    rows, area, region, demolished = [], '', '', False
    for line in text.splitlines():
        heading = re.match(r'^(={2,})\s*(.*?)\s*\1\s*$', line)
        if heading:
            depth, title = len(heading[1]), heading[2].strip()
            if re.search(r'Chiese (demolite|distrutte)', title, re.I):
                demolished = True
            elif re.search(r'Chiese (sconsacrate|di altri culti)', title, re.I):
                demolished = False
            else:
                demolished = False
                if lang == 'it' and depth == 2:
                    region = title
                else:
                    area = title
            continue
        if not re.match(r'^\s*(?:\*+|:\*|\|\s*(?:\[\[|\{\{ill))', line):
            continue
        if area in ('External links','Bibliografia','Note','Altri progetti'):
            continue
        ill = re.search(r'\{\{ill\|([^|}]+)\|it\|([^|}]+)', line, re.I)
        links = re.findall(r'\[\[([^\]]+)\]\]',line)
        if ill:
            title, label, rowlang = ill[2], ill[1], 'it'
        elif links:
            parts = links[0].split('|')
            title, label, rowlang = parts[0], parts[-1], lang
            if title.lower().lstrip(':').startswith(('file:','image:','immagine:')):
                continue
        else:
            label = re.sub(r'^\s*[:*]+\s*','',line).strip()
            title, rowlang = re.sub(r'\s*\(.*','',label).strip(), lang
        rows.append({'title':title.strip(),'label':label.strip(),'lang':rowlang,'area':area,
                     'mainland':'Terraferma' in region,
                     'listed_demolished':demolished or bool(re.search(r'\((?:Demolished|destroyed)\)',line,re.I)),
                     'sources':[lang+'_list'], 'list_evidence':line.strip()})
    return rows


def merge_candidates(rows):
    merged = {}
    for row in rows:
        key = row.get('qid') or (row.get('lang','it'),row['title'])
        if key in merged:
            merged[key]['sources'] = sorted(set(merged[key]['sources'] + row.get('sources',[])))
        else:
            merged[key] = {**row,'sources':sorted(set(row.get('sources',[])))}
    return list(merged.values())


def local_coordinates(lon, lat):
    x,y = PROJECT.transform(lon,lat)
    return [round(x-ORIGIN[0],3),round(-(y-ORIGIN[1]),3)]


def order_stops(rows):
    groups = defaultdict(list)
    for row in rows:
        groups[row['area']].append(row)
    result, current = [], PROJECT.transform(12.32,45.44)
    for area in sorted(groups, key=lambda a:(AREA_ORDER.index(a) if a in AREA_ORDER else 999,a)):
        pool = sorted(groups[area],key=lambda s:s['id'])
        while pool:
            next_stop = min(pool,key=lambda s:((PROJECT.transform(s['lon'],s['lat'])[0]-current[0])**2+
                                             (PROJECT.transform(s['lon'],s['lat'])[1]-current[1])**2,s['id']))
            pool.remove(next_stop)
            result.append(next_stop)
            current = PROJECT.transform(next_stop['lon'],next_stop['lat'])
    return result


def make_segments(stops, graph, nodes):
    segments=[]
    for a,b in zip(stops,stops[1:]):
        segment={'from':a['id'],'to':b['id']}
        start,end=a.get('node'),b.get('node')
        path=None
        if start in graph and end in graph and a.get('access_class') != 'restricted' and b.get('access_class') != 'restricted':
            try:
                path=nx.shortest_path(graph,start,end,weight='weight')
            except nx.NetworkXNoPath:
                pass
        if path and len(path)>1:
            segment.update(mode='walk',geometry=[list(nodes[n]) for n in path],
                           geometry_semantics='verified_osm_adjacent_node_shortest_path',
                           length_m=round(sum(graph[u][v]['weight'] for u,v in zip(path,path[1:])),2),
                           osm_nodes=path,
                           endpoint_semantics='nearby_network_nodes_not_verified_entrances')
        else:
            segment.update(mode='schematic',geometry=[[a['lon'],a['lat']],[b['lon'],b['lat']]],
                           geometry_semantics='schematic_non_navigational_connector',
                           suggested_transport=translated('Check the walking connection on site.', 'Verificare il collegamento pedonale sul posto.', 'Проверьте пешеходное соединение на месте.') if a['area']==b['area'] else translated('Transfer: check operator, landing and access.', 'Trasferimento: verificare operatore, approdo e accesso.', 'Переезд: проверьте перевозчика, причал и доступ.'),
                           note=translated('Not navigation; no route or length verified.', 'Non navigabile; percorso e distanza non verificati.', 'Не для навигации; путь и расстояние не подтверждены.'))
        segments.append(segment)
    return segments


def validate_route(route, allow_incomplete=False):
    if route['audit'].get('unresolved') and not allow_incomplete:
        raise ValueError('unresolved inventory candidates')
    ids=[s['id'] for s in route['stops']]
    if len(ids)!=len(set(ids)):
        raise ValueError('duplicate stop identity')
    for seg in route['segments']:
        if seg['mode']=='walk' and seg['geometry_semantics']!='verified_osm_adjacent_node_shortest_path':
            raise ValueError('walk geometry must be a real OSM path')
        if seg['mode']=='schematic' and any(k in seg for k in ('length_m','duration','duration_minutes')):
            raise ValueError('schematic connector cannot claim length/time')
    if len(route['segments']) != max(0,len(ids)-1):
        raise ValueError('route segment continuity')
    if [(s['from'],s['to']) for s in route['segments']] != list(zip(ids,ids[1:])):
        raise ValueError('route segment order')


def cache_key(url, params):
    return hashlib.sha256((url+json.dumps(params,sort_keys=True,ensure_ascii=False)).encode()).hexdigest()+'.json'


def cached_api(url, params, cache=CACHE):
    cache.mkdir(parents=True,exist_ok=True)
    file=cache/cache_key(url,params)
    if file.exists():
        return json.loads(file.read_text(encoding='utf-8'))
    for attempt in range(4):
        try:
            response=requests.get(url,params=params,headers={'User-Agent':'VeniceByBuildingResearch/1.0 (https://github.com/maximosovsky/venice-by-building; Wikipedia inventory)'},timeout=60)
            response.raise_for_status()
            result=response.json()
            if 'error' in result:
                raise ValueError(result['error'])
            file.write_text(json.dumps(result,ensure_ascii=False),encoding='utf-8')
            time.sleep(.12)
            return result
        except (requests.RequestException,ValueError):
            if attempt==3:
                raise
            time.sleep(2**attempt)


def category_inventory(lang, roots, fetch):
    queue=list(roots); seen=set(); rows=[]
    while queue:
        category=queue.pop(0)
        if category in seen:
            continue
        seen.add(category); cont=None
        while True:
            data=fetch(category,cont)
            for member in data.get('query',{}).get('categorymembers',[]):
                if member['ns']==14:
                    queue.append(member['title'])
                elif member['ns']==0:
                    rows.append({'title':member['title'],'lang':lang,'sources':[lang+'_category'],'category':category})
            cont=data.get('continue',{}).get('cmcontinue')
            if not cont:
                break
    return rows, sorted(seen)


def gpx_document(route):
    ET.register_namespace('', 'http://www.topografix.com/GPX/1/1')
    tag=lambda s:'{http://www.topografix.com/GPX/1/1}'+s
    root=ET.Element(tag('gpx'),version='1.1',creator='Venice by Building church route')
    metadata = ET.SubElement(root,tag('metadata'))
    ET.SubElement(metadata,tag('name')).text = route.get('title',{}).get('en','Venice churches')
    ET.SubElement(metadata,tag('desc')).text = ('INVENTORY INCOMPLETE: ' + str(len(route.get('audit',{}).get('unresolved',[]))) + ' unresolved identities. ' if route.get('audit',{}).get('unresolved') else '') + 'Exterior waypoints, not verified entrances. Only tracks follow the OSM pedestrian network. SCHEMATIC routes are NOT NAVIGATION and assert no length or boat service.'
    for i,s in enumerate(route['stops'],1):
        el=ET.SubElement(root,tag('wpt'),lon=str(s['lon']),lat=str(s['lat']))
        ET.SubElement(el,tag('name')).text=f"{i:03d} {s['name']['en']}"
        ET.SubElement(el,tag('desc')).text=s['access_note']['en']
        ET.SubElement(el,tag('link'),href=s['wikipedia'])
    for i,s in enumerate(route['segments'],1):
        if s['mode']=='walk':
            el=ET.SubElement(root,tag('trk'))
            ET.SubElement(el,tag('name')).text=f'{i:03d} OSM walking path (nearby nodes, not entrances)'
            points=ET.SubElement(el,tag('trkseg')); pointtag='trkpt'
        else:
            el=ET.SubElement(root,tag('rte'))
            ET.SubElement(el,tag('name')).text=f'{i:03d} SCHEMATIC — NOT NAVIGATION'
            ET.SubElement(el,tag('desc')).text='Unrouted connector; no navigable boat/walking geometry or length asserted.'
            points=el; pointtag='rtept'
        for lon,lat in s['geometry']:
            ET.SubElement(points,tag(pointtag),lon=str(lon),lat=str(lat))
    return ET.tostring(root,encoding='unicode',xml_declaration=True)


def translated(en, it, ru):
    return {'ru':ru, 'it':it, 'en':en}


# Explicit reconciliation of list redlinks and misleading parent entities.
# These are building identities, never proximity-based merges.
MENTION_IDENTITIES = {
    "Scuola dell'Angelo custode": ('Q55599854', 'Cannaregio', 'Chiese di Venezia'),
    'Chiesa di San Gerardo Sagredo': ('Q122152456', 'Sacca Fisola', 'Sacca Fisola'),
    "Chiesa di Sant'Eurosia (Vignole)": ('Q122152492', 'Vignole', 'Vignole'),
    "Chiesa di Cristo Re (Sant'Erasmo)": ('Q121598793', "Sant'Erasmo", "Sant'Erasmo (Venezia)"),
    'Chiesa di San Servolo': ('Q98781254', 'San Servolo', 'Chiese di Venezia'),
    'Chiesa di Santa Maria della Salute (Alberoni)': ('Q122152488', 'Lido', 'Alberoni (Venezia)'),
    'oratorio di San Marco in Vinea': ('Q122152502', 'Castello', 'Chiese di Venezia'),
    'Oratorio di San Marco (Torcello)': ('Q122152501', 'Torcello', 'Chiese di Venezia'),
    'Oratorio dei Santi Giuseppe e Teresa': ('Q70112034', 'Murano', 'Murano'),
}
ALIASES = {
    "Sant'Agnese di Venezia": 'Q2929832', 'Spirito Santo di Venezia':'Q2931177',
    'Le Terese':'Q3669279', 'Santa Croce di Venezia':'Q3673008',
    'San Gerardo Sagredo':'Q122152456', 'Le Cappuccine':'Q3585897',
    'San Leonardo (Venice)':'Q3585356', 'Chiesa Luterana (Venice)':'Q55599854',
    "Sant'Anna (Venice)":'Q3585391', "Sant'Antonin":'Q3585394',
    'San Giovanni Nuovo':'Q3585345', 'San Giuseppe di Castello':'Q938556',
    'Santa Caterina di Mazzorbo':'Q27116950', 'Santa Fosca di Torcello':'Q3585411',
    'Santa Maria Elisabetta':'Q107301282', 'Santa Maria dei Servi (Venice)':'Q3585424',
    "Chiesa di Sant'Angelo degli Zoppi":'Q3355126',
    'Chiesa di San Francesco del Deserto':'Q281139',
}
# Exact OSM buildings supported by cached list/island articles. Ignore wrong
# OSM chapel-to-campanile QID instead of merging that identity.
MENTION_OSM = {
    'Oratorio di Santa Barbara (Burano)': ('mention-santa-barbara-burano','Burano','Burano',176657686),
    'Chiesa di Sacca Sessola': ('mention-chiesa-sacca-sessola','Sacca Sessola','Sacca Sessola',140873400),
    'Santi Rocco e Margherita': ('mention-santi-rocco-margherita','Dorsoduro','Chiese di Venezia',1103897422),
    'Oratorio di San Gioacchino (Venezia)': ('mention-san-gioacchino','Castello','Chiese di Venezia',1081020184),
}
ALIASES.update({'Santa Maria Ausiliatrice, Venice':'mention-san-gioacchino'})
MENTION_OSM.update({
    'oratorio di Cristo Re': ('mention-cristo-re-celestia','Castello','Chiese di Venezia',582322560),
    'Chiesa di Santa Maria delle Grazie (Burano)': ('mention-grazie-burano','Burano','Burano',176657496),
})
ALIASES.update({'Cristo Re, Venice':'mention-cristo-re-celestia',
                'Santa Maria del Soccorso, Venice':'mention-soccorso-dorsoduro'})
REVIEWED_COORDINATES = {
    'Chiesa di Santa Maria del Soccorso (Venezia)': (
        'mention-soccorso-dorsoduro','Dorsoduro','Chiese di Venezia',
        12.320225,45.433225,'GCatholic 63813 encoded map coordinate; not entrance'),
}
FOLLOWUP_EVIDENCE = {
    'mention-cristo-re-celestia': 'https://gcatholic.org/churches/italia/47596 — Cristo Re alla Celestia; Italian list identifies the Franciscan oratory in Castello. OSM way/582322560 is the named church building; its QID is not adopted without independent validation.',
    'mention-grazie-burano': 'https://it.wikipedia.org/wiki/Burano — Santa Maria delle Grazie/Cappuccine, closed in 1806, restored and reopened as an exhibition space in 2006; exact named OSM way/176657496.',
    'mention-soccorso-dorsoduro': 'https://labiennale.org/en/noticeboard/2196 — renovated surviving seventeenth-century former church at Fondamenta del Soccorso, Dorsoduro. https://gcatholic.org/churches/italia/63813 — map token KgbnTM89I decodes using published gcmap.js to 45.433225,12.320225.',
}
REVIEWED_EXCLUSIONS = {
    'mention-san-vitale-poveglia': ('demolished','https://it.wikipedia.org/wiki/Poveglia — Dell’antica pieve di San Vitale resta solo il campanile. Q18427208 is a disambiguation page, not the church.'),
    'mention-san-cristoforo-pace': ('demolished','https://www.comune.venezia.it/it/content/cimitero-smichele — existing San Cristoforo della Pace monastery was demolished and terrain levelled for the cemetery in 1807; not San Michele in Isola.'),
}
SURVIVING_PARTS = {
    'Q119156487': ('Cappella di San Teodoro', 'surviving_chapel', 'https://it.wikipedia.org/wiki/Chiesa_di_San_Teodoro_(Venezia) — distinct Renaissance chapel begun in 1486 behind the basilica apses, restored in 1961; access through the canonica and San Pietro chapel. Not the demolished medieval predecessor.'),
    'Q3585424': ('Cappella del Volto Santo', 'surviving_chapel', 'The Servi church was demolished; the Volto Santo chapel survives.'),
    'Q3585448': ('Oratorio di Santo Stefano (Murano)', 'surviving_chapel', 'The parent church was demolished; the Sacrament chapel survives as an oratory.'),
    'Q3585413': ('Ex chiesa di Santa Giustina', 'adapted_building', 'Partial demolition and conversion to a school; substantial adapted building survives.'),
}
ISLAND_DEMOLISHED = {
    'Chiesa di Santa Maria delle Grazie (Venezia)': ('Santa Maria della Grazia (isola)', 'Church exploded in 1849.'),
    'Santo spirito': ('Santo Spirito (isola)', 'Church and monastery demolished for military buildings.'),
    'Secondo (martire legione tebea)': ('San Secondo (isola)', 'Island church demolished by 1824; saint article is not the building.'),
}


def article_url(title, lang='it'):
    return f'https://{lang}.wikipedia.org/wiki/' + urllib.parse.quote(title.replace(' ', '_'), safe="()'_")


USER_EXCLUDED_NO_ATLAS_GEOMETRY = {
    'Q379102', 'Q86664730', 'Q107301282', 'Q3585395', 'Q122152493',
    'Q585738', 'Q122152488', 'Q109466368', 'Q109466355', 'Q109466379',
    'Q109466385', 'Q109466393',
    'Q3585411', 'Q1149886', 'Q122152501',
    'Q3585324', 'mention-chiesa-sacca-sessola',
    'Q27116950', 'mention-grazie-burano', 'mention-santa-barbara-burano',
    'Q3585364', 'Q281139', 'Q121598793', 'Q122152492',
    'Q1449262', 'Q3585409', 'Q70112034', 'Q3585377', 'Q3585448',
    'Q2545358', 'Q3585423', 'Q1791020', 'Q98781254',
}


def build_inventory(records, entities, osm_elements=()):
    """Reconcile every input row; unknown survival/location stays unresolved."""
    groups = defaultdict(list)
    for original in records:
        row = dict(original)
        title = row['title']
        if title == 'San Vitale' and row.get('area') == 'Poveglia':
            row['qid'] = 'mention-san-vitale-poveglia'
        elif title in ('Santa Maria Nascente','San Giuseppe') and row.get('area') == 'Lido':
            row['qid'] = 'mention-nascente-lido' if title == 'Santa Maria Nascente' else 'mention-san-giuseppe-lido'
            row.update(entity={}, coordinate=[], text='', description='', missing=True)
        elif title == 'San Cristoforo di Venezia':
            row['qid'] = 'mention-san-cristoforo-pace'
        elif title in REVIEWED_COORDINATES:
            sid, area, article, lon, lat, source = REVIEWED_COORDINATES[title]
            row.update(qid=sid, area=area, mention_article=article, reviewed_mention=True,
                       reviewed_coordinate={'lon':lon,'lat':lat}, reviewed_coordinate_source=source)
        elif title in MENTION_IDENTITIES:
            row['qid'], row['area'], row['mention_article'] = MENTION_IDENTITIES[title]
            row['reviewed_mention'] = True
        elif title in ALIASES:
            row['qid'] = ALIASES[title]
            row['identity_alias'] = True
        elif title in MENTION_OSM:
            row['qid'], row['area'], row['mention_article'], row['osm_building'] = MENTION_OSM[title]
            row['reviewed_mention'] = True
        groups[row.get('qid') or (row.get('lang','it'), title)].append(row)
    osm_by_qid = defaultdict(list)
    osm_by_id = {}
    for element in osm_elements:
        osm_by_id[(element['type'], element['id'])] = element
        qid = element.get('tags',{}).get('wikidata')
        if qid:
            osm_by_qid[qid].append(element)
    inventory, excluded, unresolved, reconciliation = [], [], [], []
    duplicates = 0
    for key, group in groups.items():
        row = max(group, key=lambda r:(not r.get('missing',False), r.get('lang')=='it',len(r.get('text',''))))
        qid = row.get('qid')
        entity = entities.get(qid, row.get('entity',{}))
        title = row.get('canonical_title') or row['title']
        listed = [r for r in group if 'it_list' in r.get('sources',[]) and not r.get('listed_demolished')]
        area = next((r.get('area') for r in listed if r.get('area')), next((r.get('area') for r in group if r.get('area')), ''))
        source_kinds = sorted({s for r in group for s in r.get('sources',[])})
        text = row.get('text','')
        description = row.get('description','') or ' '.join(v['value'] for k,v in entity.get('descriptions',{}).items() if k in ('it','en'))
        reviewed = next((r for r in group if r.get('reviewed_mention')), None)
        reason, evidence = None, None
        part = SURVIVING_PARTS.get(qid)
        if qid in REVIEWED_EXCLUSIONS:
            reason, evidence = REVIEWED_EXCLUSIONS[qid]
        if qid in USER_EXCLUDED_NO_ATLAS_GEOMETRY:
            reason = 'user_excluded_no_atlas_geometry'
            evidence = 'User-approved route exclusion: Lido/Pellestrina temple lacks a verified building footprint in the current atlas; source geometry is unchanged.'
        elif title in ISLAND_DEMOLISHED:
            parent, evidence = ISLAND_DEMOLISHED[title]
            reason = 'demolished'; evidence = article_url(parent) + ' — ' + evidence
        elif qid in ('Q9592','Q60995','Q64842') or title.startswith('{{'):
            reason = 'parser_non_building_link'; evidence = 'Source row linked a confession/bibliographic template rather than a building.'
        elif any(r.get('mainland') for r in group) and qid != 'Q281139':
            reason = 'mainland'; evidence = 'Italian list places this mention in mainland section.'
        elif re.search(r'\b(?:Mestre|Carpenedo|Marghera|Favaro|Zelarino|Campalto|Malcontenta|Trivignano|Dese|Tessera|Chirignago)\b', title+' '+description+' '+' '.join(r.get('category','') for r in group), re.I):
            reason = 'mainland'; evidence = 'Article title/description/category identifies mainland location.'
        elif qid == 'Q3886656':
            reason = 'former_church_not_surviving_building'; evidence = article_url(title) + ' — Article preserves only the original Gothic portal; the hospital institution is not a surviving temple.'
        elif not part and not reviewed and (any(r.get('listed_demolished') for r in group) or re.search(r'demolit|scomparso|scomparsa|destroyed',description,re.I) or re.search(r'^\|[ \t]*Demolizione[ \t]*=[ \t]*[^\s|}][^\n]*',text,re.M)):
            reason = 'demolished'; evidence = 'Explicit demolished-list, description or non-empty demolition field.'
        elif not listed and not reviewed and not part and not row.get('missing') and qid not in ('Q1791020','Q281139') and not re.search(r'chiesa|church|synagog|sinagog|oratorio|chapel|cappella|edificio religioso',description,re.I) and not title.startswith(('Chiesa','Oratorio','Duomo','Basilica','Cattedrale','Scola','Scuola Canton')):
            reason = 'non_temple_category_member'; evidence = 'Category member is not a church/temple building (artwork, person, institution or other object).'
        if reason:
            rec = {'identity':str(key), 'title':title, 'decision':'excluded','reason':reason,'evidence':evidence,'source_rows':len(group),'sources':source_kinds}
            excluded.append(rec); reconciliation.append(rec); duplicates += len(group)-1
            continue
        coords = row.get('coordinate',[])
        coord_source = 'Wikipedia article coordinate'
        if reviewed or not coords:
            coords = [c['mainsnak']['datavalue']['value'] for c in entity.get('claims',{}).get('P625',[]) if c['mainsnak'].get('datavalue') and c.get('rank')!='deprecated']
            coord_source = 'Wikidata P625; not a verified entrance'
        if reviewed and reviewed.get('reviewed_coordinate'):
            coords = [reviewed['reviewed_coordinate']]
            coord_source = reviewed['reviewed_coordinate_source']
        # Only known, explicitly identified surviving chapel supersedes its parent.
        if reviewed and reviewed.get('osm_building'):
            el = osm_by_id.get(('way',reviewed['osm_building']))
            coords = [el['center']] if el else []
            coord_source = f"OSM way/{reviewed['osm_building']} exact named building centroid; not entrance"
        if qid == 'Q281139':
            el = osm_by_id.get(('way',75935317))
            coords = [el['center']] if el else []
            coord_source = 'OSM way/75935317 church building; not island centroid or entrance'
        if reviewed:
            area = reviewed['area']
        if qid == 'Q3585424' and entities.get('Q55596276'):
            coords = [c['mainsnak']['datavalue']['value'] for c in entities['Q55596276'].get('claims',{}).get('P625',[]) if c['mainsnak'].get('datavalue')]
            coord_source = 'Wikidata Q55596276 P625 (surviving chapel)'
        if qid == 'Q1791020' and entities.get('Q116056745'):
            coords = [c['mainsnak']['datavalue']['value'] for c in entities['Q116056745'].get('claims',{}).get('P625',[]) if c['mainsnak'].get('datavalue')]
            coord_source = 'Wikidata Q116056745 P625 (church, not island centre)'
        if not coords and osm_by_qid.get(qid):
            el = osm_by_qid[qid][0]; coords = [el.get('center',el)]
            coord_source = f"OSM {el['type']}/{el['id']} building centroid; not entrance"
        mention_article = reviewed.get('mention_article') if reviewed else None
        if qid == 'Q281139':
            area = 'San Francesco del Deserto'
        if not coords or (row.get('missing') and not reviewed and not any(not r.get('missing') for r in group)):
            rec = {'identity':str(key), 'title':title, 'decision':'unresolved','reason':'survival_or_building_location_not_verified','area':area,'source_rows':len(group),'sources':source_kinds,'wikipedia':article_url(mention_article or 'Chiese di Venezia')}
            unresolved.append(rec); reconciliation.append(rec); duplicates += len(group)-1
            continue
        coord = coords[0]; lon = coord.get('lon',coord.get('longitude')); lat = coord.get('lat',coord.get('latitude'))
        if not isinstance(lon,(int,float)) or not isinstance(lat,(int,float)):
            raise ValueError(f'Invalid source coordinate: {key}')
        if not (12.29 < lon < 12.44 and 45.23 < lat < 45.51):
            rec = {'identity':str(key),'title':title,'decision':'excluded','reason':'outside_island_scope','evidence':f'Coordinate {lon}, {lat} lies outside historic Venice/lagoon island scope.','source_rows':len(group),'sources':source_kinds}
            excluded.append(rec); reconciliation.append(rec); duplicates += len(group)-1; continue
        if area.startswith('Pellestrina'):
            area = 'Pellestrina'
        elif area == 'Giudecca e Sacca Fisola':
            area = 'Giudecca'
        elif area == 'Isola di San Giorgio Maggiore':
            area = 'San Giorgio Maggiore'
        if not area:
            context = ' '.join(r.get('category','') for r in group) + ' ' + text
            area = next((a for a in AREA_ORDER if a in context),'')
        if re.search('synagog|sinagog|Scola|Scuola Canton',title+' '+description,re.I):
            area = 'Cannaregio'
        if not area:
            rec = {'identity':str(key),'title':title,'decision':'unresolved','reason':'island_or_sestiere_not_verified','source_rows':len(group),'sources':source_kinds}
            unresolved.append(rec); reconciliation.append(rec); duplicates += len(group)-1; continue
        name_it = part[0] if part else (reviewed['title'] if reviewed else title)
        labels = entity.get('labels',{})
        names = {lang:labels.get(lang,{}).get('value') or name_it for lang in ('ru','it','en')}
        if part:
            names = {lang:name_it for lang in ('ru','it','en')}
        if qid == 'Q1791020':
            names = translated('Church of San Lazzaro degli Armeni','Chiesa di San Lazzaro degli Armeni','Церковь Сан-Ладзаро-дельи-Армени')
        elif qid == 'Q281139':
            names = translated('Church of San Francesco del Deserto','Chiesa di San Francesco del Deserto','Церковь Сан-Франческо-дель-Дезерто')
        confession = 'Jewish' if re.search('synagog|sinagog|Scola|Scuola Canton',title+' '+description,re.I) else ('Lutheran' if qid=='Q55599854' else 'Christian')
        if qid == 'Q1784082': confession = 'Greek Orthodox'
        if qid == 'Q1080619': confession = 'Russian Orthodox'
        if qid == 'Q2929845': confession = 'Anglican'
        if qid in ('Q1791020','Q3585410'): confession = 'Armenian Catholic'
        restricted = area in ('San Clemente','Sacca Sessola',"Sant'Andrea") or qid in ('Q57981283','Q119156487')
        access = translated('Exterior reference only. Opening, worship, entrance and step-free access must be checked locally.', 'Riferimento esterno. Verificare sul posto apertura, culto, ingresso e accessibilità.', 'Внешняя точка. Уточните часы работы, богослужения, вход и безбарьерный доступ на месте.')
        if restricted:
            access = translated('Restricted/private site. Permission and a separately arranged landing/access may be required; no routine public visit or ferry is asserted.', 'Sito privato o limitato. Possono servire autorizzazione e approdo/accesso concordati; nessuna visita pubblica o linea regolare è garantita.', 'Частный объект или ограниченный доступ. Возможны разрешение и отдельно согласованный причал/вход; публичное посещение и регулярный паром не гарантируются.')
        elif area == 'San Francesco del Deserto':
            access = translated('Monastery visit and private boat/landing must be arranged; no regular ACTV service is asserted.', 'Concordare visita al convento e barca/approdo privati; nessuna linea ACTV regolare dichiarata.', 'Согласуйте посещение монастыря и частную лодку/высадку; регулярная линия ACTV не заявляется.')
        elif area in ('San Lazzaro degli Armeni','San Servolo'):
            access = translated('ACTV line 20 serves this island; check current timetable and admission/monastery tour separately.', 'Isola servita dalla linea ACTV 20; verificare orario attuale e accesso/visita al monastero.', 'Остров обслуживает линия ACTV 20; отдельно проверьте актуальное расписание и вход/экскурсию в монастырь.')
        status = part[1] if part else ('adapted_building' if re.search('sconsacrat|former church|ex edificio',text[:1800]+' '+description,re.I) else 'surviving_building')
        wikipedia = article_url(mention_article or title, 'it' if mention_article else row.get('lang','it'))
        sid = (qid or 'mention-'+hashlib.sha256((area+'|'+name_it).encode()).hexdigest()[:12]) + ('-volto-santo' if qid=='Q3585424' else '')
        stop = {'id':sid, 'name':names, 'lon':lon, 'lat':lat,'local':local_coordinates(lon,lat), 'wikipedia':wikipedia,'area':area,'access_note':access,'access_class':'restricted' if restricted else 'check_opening','confession':confession,'survival_status':status,'coordinate_source':coord_source,'sources':source_kinds,'qid':qid,'source_rows':len(group)}
        if part: stop['survival_evidence'] = part[2]
        if qid in FOLLOWUP_EVIDENCE:
            stop['survival_evidence'] = FOLLOWUP_EVIDENCE[qid]
            if qid != 'mention-cristo-re-celestia': stop['survival_status'] = 'adapted_building'
        if reviewed: stop['mention_only'] = True
        inventory.append(stop)
        rec = {'identity':str(key),'title':title,'stop_id':sid,'decision':'included','evidence':wikipedia,'source_rows':len(group),'sources':source_kinds}
        reconciliation.append(rec); duplicates += len(group)-1
    audit = {'candidate_count':len(records),'identity_group_count':len(groups),'included_count':len(inventory),'excluded_count':len(excluded),'duplicate_count':duplicates,'unresolved':unresolved,'excluded':excluded,'reconciliation':reconciliation,'inventory_complete':not unresolved}
    assert len(records) == len(inventory)+len(excluded)+duplicates+len(unresolved)
    return inventory, audit


def load_pedestrian_network(cache=CACHE):
    """Reuse PBF-derived network; reject restricted ways and nodes, no snapping."""
    from venice.s10_bridge_route import access_reason, restriction
    import math
    data = json.loads((cache/'network.json').read_text(encoding='utf-8'))
    nodes = {int(k):tuple(v) for k,v in data['nodes'].items()}
    metric = {n:PROJECT.transform(*ll) for n,ll in nodes.items()}
    blocked = {int(k) for k,t in data.get('node_tags',{}).items() if restriction(t)}
    graph = nx.Graph(); rejected = Counter()
    for way in data['ways']:
        reason = access_reason(way['tags'])
        if reason:
            rejected[reason] += 1; continue
        for u,v in zip(way['nodes'],way['nodes'][1:]):
            if u==v or u not in nodes or v not in nodes or u in blocked or v in blocked:
                continue
            length = math.dist(metric[u],metric[v])
            if not graph.has_edge(u,v) or graph[u][v]['weight'] > length:
                graph.add_edge(u,v,weight=length,osm_way=way['id'])
    return graph, nodes, {'source':'cached Veneto OSM PBF network','nodes':len(graph),'edges':graph.number_of_edges(),'rejected_ways':dict(rejected),'blocked_nodes':len(blocked)}


def expand_monasteries(stops, candidates):
    """Add reviewed premises or group an explicitly identified church complex."""
    stops = [dict(s) for s in stops]
    by_id = {s['id']:s for s in stops}
    allowed = set(AREA_ORDER[:10])
    audit = {'candidate_count':len(candidates), 'new_stop_count':0,
             'merged_complex_count':0, 'merged_member_count':0, 'excluded':[], 'included':[]}
    for original in sorted(candidates, key=lambda r:r['id']):
        row = dict(original)
        church = row.get('church_stop_id')
        reason = row.get('reason') if row.get('decision') != 'include' else None
        if row.get('qid') in USER_EXCLUDED_NO_ATLAS_GEOMETRY or church in USER_EXCLUDED_NO_ATLAS_GEOMETRY:
            reason = 'user_excluded_no_atlas_geometry'
        elif row.get('decision') == 'include' and row.get('area') not in allowed:
            reason = 'outside_monastery_scope'
        if reason:
            audit['excluded'].append({**row,'reason':reason}); continue
        if not row.get('survival_evidence'):
            raise ValueError('monastery survival evidence required')
        if church:
            if church not in by_id:
                raise ValueError(f'Monastery complex references missing church: {church}')
            stop = by_id[church]
            stop.setdefault('monasteries',[]).append(row)
            stop['monastery_qids'] = sorted({r['qid'] for r in stop['monasteries'] if r.get('qid')})
            stop.setdefault('osm_buildings',[]).extend(row.get('osm_buildings',[]))
            stop['kind'] = 'church_and_monastery_complex'
            audit['merged_member_count'] += 1
        else:
            stop = {**row,'local':local_coordinates(row['lon'],row['lat']),
                    'kind':'monastery','confession':'Christian','sources':['reviewed_wikipedia_monastery_inventory'],
                    'source_rows':1,'access_class':row.get('access_class','check_opening'),
                    'access_note':translated('Exterior reference; opening and access require local verification.','Riferimento esterno; verificare apertura e accesso.','Внешняя точка; уточните часы работы и доступ.')}
            if stop['access_class']=='restricted':
                stop['access_note'] = translated('Restricted/private premises; exterior only, no public admission asserted.','Sede privata o limitata; solo esterno, accesso pubblico non garantito.','Ограниченный или частный объект; только внешняя точка, публичный вход не гарантируется.')
            stops.append(stop); by_id[stop['id']] = stop
            audit['new_stop_count'] += 1
        for lang in ('en','it','ru'):
            stop['access_note'][lang] += ' ' + row['name'][lang] + ': ' + row['survival_evidence']
        audit['included'].append({'id':row['id'],'stop_id':stop['id'],'wikipedia':row['wikipedia']})
    audit['merged_complex_count'] = len({r['church_stop_id'] for r in candidates if r.get('church_stop_id') in by_id and r.get('decision') == 'include'})
    return stops, audit


def main():
    import argparse
    import math

    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache',type=Path,default=CACHE)
    parser.add_argument('--output',type=Path,default=ROOT/'web/data/church-route.json')
    parser.add_argument('--report',type=Path)
    args = parser.parse_args()
    records = json.loads((args.cache/'resolved.json').read_text(encoding='utf-8'))
    entities = json.loads((args.cache/'entities.json').read_text(encoding='utf-8'))
    osm = {(el['type'],el['id']):el for name in ('overpass_worship.json','overpass_buildings.json','overpass_chapels.json') for el in json.loads((args.cache/name).read_text(encoding='utf-8'))['elements']}
    stops,audit = build_inventory(records, entities, list(osm.values()))
    monastery_inventory = json.loads((ROOT/'web/data/monastery-inventory.json').read_text(encoding='utf-8'))
    stops, monastery_audit = expand_monasteries(stops, monastery_inventory['candidates'])
    monastery_audit['discovery'] = monastery_inventory['discovery']
    audit['church_inventory_included_count'] = audit['included_count']
    audit['monasteries'] = monastery_audit
    # Separate source observations remain explicit in the unified accounting.
    audit['candidate_count'] += monastery_audit['candidate_count']
    audit['included_count'] = len(stops)
    audit['excluded_count'] += len(monastery_audit['excluded'])
    audit['duplicate_count'] += monastery_audit['merged_member_count']
    for r in monastery_audit['included']:
        audit['reconciliation'].append({'identity':r['id'],'title':r['id'],'stop_id':r['stop_id'],'decision':'included_complex_member','source_rows':1,'sources':['reviewed_wikipedia_monastery_inventory'],'evidence':r['wikipedia']})
    for r in monastery_audit['excluded']:
        rec={'identity':r['id'],'title':r['name']['it'],'decision':'excluded','reason':r['reason'],'evidence':r['wikipedia']+' — '+r['survival_evidence'],'source_rows':1,'sources':['reviewed_wikipedia_monastery_inventory']}
        audit['reconciliation'].append(rec); audit['excluded'].append(rec)
    assert audit['candidate_count'] == len(stops)+audit['excluded_count']+audit['duplicate_count']+len(audit['unresolved'])
    graph,nodes,network_audit = load_pedestrian_network(args.cache)
    metric_nodes = {n:PROJECT.transform(*nodes[n]) for n in graph}
    for stop in stops:
        point = PROJECT.transform(stop['lon'],stop['lat'])
        nearest = min(metric_nodes,key=lambda n:math.dist(point,metric_nodes[n]))
        distance = math.dist(point,metric_nodes[nearest])
        stop['network_distance_m'] = round(float(distance),2)
        if distance <= 120 and stop['access_class']!='restricted': stop['node'] = nearest
    stops = order_stops(stops)
    segments = make_segments(stops,graph,nodes)
    for segment in segments:
        if segment['mode']=='walk':
            path = segment['osm_nodes']
            segment['osm_way_ids'] = sorted({graph[u][v]['osm_way'] for u,v in zip(path,path[1:])})
            assert all(graph.has_edge(u,v) for u,v in zip(path,path[1:]))
            assert math.isclose(segment['length_m'],sum(graph[u][v]['weight'] for u,v in zip(path,path[1:])),abs_tol=.011)
    generated = datetime.now(timezone.utc).isoformat()
    audit['network'] = network_audit
    audit['limitations'] = [
        translated('Monasteries include surviving/adapted premises in the historic sestieri, Giudecca and San Giorgio Maggiore. Explicit prior island exclusions remain. Reviewed unverified monastery mentions are not added; exhaustive coverage is not claimed.', 'I monasteri comprendono edifici conservati o riutilizzati nei sestieri storici, alla Giudecca e a San Giorgio Maggiore. Restano le precedenti esclusioni delle isole. Menzioni non verificate non sono aggiunte; la completezza non è dichiarata.', 'Монастыри включают сохранившиеся или переоборудованные здания исторических сестьере, Джудекки и Сан-Джорджо-Маджоре. Прежние исключения островов сохранены. Неподтверждённые упоминания не добавлены; исчерпывающая полнота не заявляется.'),
        translated('Inventory is reconciled against cached Italian/English Wikipedia lists, categories and Wikidata. Unresolved mentions remain below; this is not a claim of exhaustive coverage.', 'Inventario riconciliato con liste e categorie Wikipedia italiana/inglese e Wikidata in cache. Le menzioni irrisolte sono riportate; non si dichiara una copertura esaustiva.', 'Инвентарь сверён с сохранёнными итальянскими/английскими списками и категориями Википедии и Wikidata. Неразрешённые упоминания перечислены; исчерпывающая полнота не заявляется.'),
        translated(f"{len(audit['unresolved'])} unresolved candidate identities; see the published audit/report before treating the inventory as complete.", f"{len(audit['unresolved'])} identità candidate irrisolte; consultare audit e rapporto prima di considerare completo l'inventario.", f"Неразрешённых кандидатов: {len(audit['unresolved'])}. Перед использованием как полного списка изучите аудит и отчёт."),
        translated('Walking geometry is a shortest path between nearby mapped OSM nodes, not verified church entrances. Off-network approaches and ferry transfers are not navigable geometry.', 'La geometria pedonale segue percorsi minimi tra nodi OSM vicini, non ingressi verificati. Accessi fuori rete e traghetti non sono geometrie navigabili.', 'Пешеходная геометрия — кратчайшие пути между ближайшими узлами OSM, не проверенные входы. Подходы вне сети и паромные переезды не являются навигационными путями.'),
    ]
    route = {'id':'churches-lagoon','title':translated('Churches, temples and monasteries, synagogues of Venice','Chiese, templi e monasteri, sinagoghe di Venezia','Церкви, храмы, монастыри и синагоги Венеции'), 'summary':translated(f"{len(stops)} located church/temple and monastery stops, all confessions; one ordering, no day splits.",f"{len(stops)} tappe di chiese, templi e monasteri, tutti i culti; un solo ordine, senza giornate.",f"{len(stops)} точек церквей, храмов и монастырей разных конфессий; единая последовательность без разбивки по дням."),'status':'ready','generated_at':generated,'stops':stops,'segments':segments,'audit':audit,'sources':[{'url':article_url('Chiese di Venezia'),'role':'Italian list including unlinked mentions'}, {'url':article_url('List of churches in Venice','en'),'role':'English list'}, {'url':'https://www.wikidata.org/','role':'Identity/coordinate corroboration'}, {'url':'https://www.openstreetmap.org/copyright','role':'ODbL pedestrian-network geometry'}, {'url':article_url('San Servolo'),'role':'ACTV line 20 contextual source; no boat geometry asserted'}]}
    validate_route(route,allow_incomplete=True)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(route,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    gpx_path = args.output.with_suffix('.gpx')
    gpx_path.write_text(gpx_document(route)+'\n',encoding='utf-8')
    report = args.report or ROOT/'docs'/('church-route-audit-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')+'.md')
    mode_counts = Counter(s['mode'] for s in segments)
    lines = ['# Church route audit', '',f'Generated UTC: {generated}', '', '**INVENTORY REVIEW INCOMPLETE — not an exhaustive-completeness claim.**', '',f"Source rows: {len(records)}; identity groups: {audit['identity_group_count']}; included: {len(stops)}; excluded identities: {audit['excluded_count']}; duplicate rows: {audit['duplicate_count']}; unresolved identities: {len(audit['unresolved'])}.",f"Segments: {dict(mode_counts)}. Verified network length only: {sum(s.get('length_m',0) for s in segments):.2f} m (not total trip length).", '', '## Method and access', '', '- Offline reproducible build from the existing evidence cache; no new network collection.', '- QID/canonical identity aliases, not distance, determine deduplication.', '- Empty demolition fields never mean demolished; bibliography references never classify the building.', '- Volto Santo and Santo Stefano Murano refer to surviving chapels, not demolished parents.', '- San Francesco del Deserto, San Clemente, private sites and prison chapel access are not routine public visits.', '- ACTV line 20 evidence is contextual, not a verified timetable or boat track.', '- Waypoints/nearest network nodes are not entrances. Schematics have no fabricated length/time.', '', '## Areas', '', '| Area | Stops |','|---|---:|']
    lines += [f'| {area} | {count} |' for area,count in sorted(Counter(s['area'] for s in stops).items())]
    lines += ['', '## Unresolved mentions (not excluded as absent)', '', '| Identity | Mention | Area | Reason |','|---|---|---|---|']
    lines += [f"| {r['identity']} | {r['title'].replace('|','/')} | {r.get('area','')} | {r['reason']} |" for r in audit['unresolved']]
    lines += ['', '## Included inventory', '', '| Order | Identity | Building | Area | Coordinate evidence | Wikipedia |','|---:|---|---|---|---|---|']
    lines += [f"| {i} | {s['id']} | {s['name']['it']} | {s['area']} | {s['coordinate_source']} | {s['wikipedia']} |" for i,s in enumerate(stops,1)]
    lines += ['', '## Exclusions', '', '| Identity | Title | Reason | Evidence |','|---|---|---|---|']
    lines += [f"| {r['identity']} | {r['title'].replace('|','/')} | {r['reason']} | {r['evidence']} |" for r in audit['excluded']]
    lines += ['', 'Full per-identity reconciliation, source-row counts and provenance are embedded in church-route.json.','',f'Artifacts: `{args.output}`; `{gpx_path}`.']
    report.parent.mkdir(parents=True,exist_ok=True); report.write_text('\n'.join(lines)+'\n',encoding='utf-8')
    print(json.dumps({'json':str(args.output),'gpx':str(gpx_path),'report':str(report),'stops':len(stops),'segments':dict(mode_counts),'unresolved':len(audit['unresolved']),'inventory_complete':audit['inventory_complete']},ensure_ascii=False))


if __name__ == '__main__':
    main()

