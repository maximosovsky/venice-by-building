# Bridge-route audit / Аудит маршрута / Audit del percorso — 2026-10-23

## English

**Generated and independently tested:** continuous closed walking route from the original OSM node **1851468090**, Piazzale Roma (12.318467, 45.4382129), back to the same node. **371 accepted physical bridge groups, 464 crossings, 93 repeats, 65,140.306 m, 6,159 original-node coordinates.** This is an audited OSM-derived candidate inventory, **not an assertion of a complete official inventory**.

### Scope and source

- Uses `config.OSM_POLYGONS['island']`, the existing Nominatim polygon of **OSM relation 4817103**, strictly retaining walking ways entirely covered by the main-island polygon. Does not use the historic-centre polygon, Giudecca, San Giorgio or outer islands. The configured main-island boundary also includes western transport/port areas; no six separate administrative district polygons are used. Entire-way clipping can omit a bridge straddling that boundary.
- Original input: `data/raw/osm/venezia_island.osm.pbf`, extracted from <https://download.openstreetmap.fr/extracts/europe/italy/veneto.osm.pbf>. Local acquisition date: **2026-10-22**. The PBF header lacks a snapshot timestamp; that date is **not a proven OSM snapshot date**.
- PBF SHA-256: `5246d846ba5a0aeb169f9bf2fa6dc0e474da8345921c1ea4d776a34d91ce9969`.
- Attribution: **© OpenStreetMap contributors, ODbL 1.0**. Preserve attribution and applicable database share-alike obligations when redistributing the derived data.

### Inventory reconciliation

| Item | Count |
|---|---:|
| Scoped mapped deck polygons | 411 |
| Scoped highway bridge candidates, before access filtering | 1,522 |
| Physical groups after merging | 416 |
| Required and covered groups | 371 |
| Excluded groups | 44 |
| Group without a complete crossing, unresolved | 1 |
| Decks without an associated mapped highway, separate unresolved candidates | 6 |
| Multi-portal groups using an audited crossing-selection heuristic | 45 |

**416 = 371 + 44 + 1.** The six unmatched deck polygons are not additional confirmed public pedestrian bridges. They include Ponte dei Sospiri, Ponte Compagnia della Vela and four unnamed decks; the script does not invent paths or assume tourist/museum structures are public thoroughfares. The unresolved highway group is `w44523054` (Ferrovia), with one portal and no complete traversable crossing.

Of the 44 excluded groups, **40 have private access, one has access=no, and three are disconnected from Piazzale Roma** in the filtered original-node graph. Disconnected IDs: `d556029873`, `w597743874` (Ciclabile Mestre - Venezia), `d1232707313`. Partial way restrictions inside an otherwise accessible bridge are listed separately in `audit.partial_restrictions`.

### Concrete unresolved/disconnected source evidence

The JSON publishes all ten records under `audit.unresolved_details`, with original way tags and, for unmatched decks, every highway within 10 m plus measured overlap and strict scope result. Nearby geometry is diagnostic evidence, **not** a routing connection.

| Candidate / OSM ID | Actual extract evidence and disposition |
|---|---|
| Ferrovia `w44523054` | Ways **44523054, 172380678, 172380679, 172380680, 172380696** carry `man_made=pier`, `highway=footway`, `bridge=yes`; no access prohibition. This is a mapped landing/pier network, not a verified bank-to-bank bridge. Only portal **2456700265** survives; no complete crossing is invented. |
| Ponte dei Sospiri `d138803225` | Deck has `man_made=bridge`, `tourism=attraction`, `wheelchair=no`; no `highway`, `foot`, or `access` permission. No highway within 10 m in this extract. Attraction tags do **not** prove a public through-walk or prove private status. |
| Ponte Compagnia della Vela `d555802970` | Named humpback deck; no access/highway tags. Nearby bridge-footway **175820926** is **4.618 m** away with **zero overlap**. Pedestrian-area boundary **175820932** overlaps **2.590 m**, but is not a bridge and does not satisfy the deck-overlap identity threshold. Public quay geometry is not evidence of a complete crossing of this deck. |
| Unnamed `d555841273` | `man_made=bridge`, humpback. Bridge-steps **218723109** overlap **40.856 m** but the complete way lies partly outside the configured island polygon; nearby pedestrian ways **207546164, 217912310** also fail entire-way clipping. No private/access prohibition is tagged. This is a concrete **scope omission**, not evidence of nonpublic access. |
| Unnamed `d569427400` | Beam deck without highway/access tags. Nearby sidewalk bridge **1164239372** is **4.065 m** away; no overlap. Nearby roads **176184205, 315662191** have `access=private` **and `foot=yes`**, so pedestrians are explicitly allowed by the foot override; that permission does not attach them to this deck. |
| Unnamed `d1232060432` | Deck has only `layer=1`, `man_made=bridge`; no highway within 10 m. Public/nonpublic status unknown. |
| Unnamed `d1232707316` | Beam deck with no highway/access tags; no highway within 10 m. Public/nonpublic status unknown. |
| Disconnected unnamed `d556029873` | Steps **53578129, 447052599** and footway **447052603** are explicitly `access=private`. Untagged footway stub **447052606** remains but cannot be reached without those private approaches. Not a complete public through-crossing. |
| Disconnected Ciclabile Mestre - Venezia `w597743874` | `highway=cycleway`, **`foot=yes`**, `motor_vehicle=no`; explicit pedestrian permission. The scoped segment has no filtered original-node path from the start. Disconnection is **not** private status; no invented link. |
| Disconnected unnamed `d1232707313` | Associated way **1232707314** is `highway=footway`, `bridge=yes`, no access restriction; allowed by default policy, but isolated in original-node topology. Public through-access remains unverified. |

### Access and physical bridge identification

Foot-specific permission overrides generic access. Private/no/customers/permit/destination/delivery and other nonpublic values are excluded. Ferries, rail-only ways, motorways/trunks, construction, indoor routes, unpermitted cycleways, restricted nodes/locked gates, unresolved foot one-way restrictions, conditional access and non-24/7 opening hours are not routed. Time-conditional rules are handled conservatively rather than evaluated for a fictional departure time. Untagged pedestrian access is assumed public; untagged barriers may still be unusable in reality. Current closures and safety have not been checked on site. Steps are retained, so this is **not a step-free route**.

Deck polygons provide identity evidence for parallel walking ways. Otherwise only connected bridge-tagged ways with compatible names merge. Distinct mapped decks do not merge merely because they share a landing node. Nodes are never geometrically snapped; every route segment is an actual adjacent original OSM node pair. Rialto's connected bridge ways form one physical group; its relation metadata is included in the audit, not separately double-counted.

For **45 multi-portal groups**, the script chooses a complete existing path preferentially between the most connected land banks, then the farthest portals, then the shortest bridge path. Side ramps/branches are not separate bridges. This is a reproducible **heuristic requiring review**, particularly for genuine multi-bank structures such as Tre Ponti. It establishes coverage of one full crossing per accepted physical group, not of every alternative staircase or branch. Other parallel paths also use one representative full crossing.

### Once each: mathematical result and fallback

Bridge-free walking connectivity is contracted into **1,340 land components**, including isolated original bridge nodes. The accepted bridge multigraph is connected. **106 of its land vertices have odd degree**; their original node IDs, coordinates and degrees appear in `audit.odd_components`. A closed Euler traversal of the **chosen representative bridge model** is therefore impossible: entering and leaving a vertex in a closed circuit uses edges in pairs, while an odd-degree vertex cannot use every incident required edge once.

Shortest-path closure and exact minimum-weight perfect matching of odd vertices produce **93 added bridge crossings**. Edge cost is lexicographic: one crossing has a scale greater than any possible matching's aggregate bridge-deck length, then deck length breaks ties. Consequently this minimizes **repeat crossing count in the chosen connected undirected model**. An Euler circuit is expanded using real bridge paths and shortest bridge-free walking transfers for its selected order.

**No proof of globally shortest walking length, nor of minimum repeats over every alternative multi-portal choice, is claimed.** Parity describes this accepted model; unresolved/disconnected candidates independently prevent a promise to traverse every real public bridge exactly once. The output remains `ready` because a verified continuous route covering the accepted reachable inventory exists.

### Walking-order improvement (same minimum-repeat model)

The former NetworkX Euler iteration expanded to **99,305.230 m**. A distance-aware **Fleury** traversal now picks the nearest entry portal by **real bridge-free shortest-path distance**, avoiding cut edges of the remaining augmented multigraph unless forced. Parallel repeated copies are not mistaken for graph cuts; self-loops are supported. All original required and repeated edge copies remain exactly the same, so **371 bridges / 464 crossings / 93 minimum repeats / 106 odd components** are unchanged.

Complete closed-circuit costs, including the return to Piazzale Roma, are compared against the unchanged baseline. The baseline is retained if the candidate is longer. Here the heuristic is selected: **65,140.306 m**, saving **34,164.924 m (34.404%)**. Bridge-deck distance is invariant (**7,596.823 m**); land transfers fell from **91,708.406 m** to **57,543.482 m**. `audit.walking_order` contains this comparison and the edge-multiset verification. The route is still long because it covers the accepted inventory; **this is not a globally shortest walking route**, and no alternative crossing-model optimum is claimed.

Русский: порядок улучшен эвристикой Флёри по кратчайшим наземным расстояниям без изменения мостового мультиграфа. **99 305,230 → 65 140,306 м; экономия 34 164,924 м (34,404%)**. Есть возврат к исходному варианту при ухудшении. Минимум 93 повторов относится только к выбранной модели. Подробные исходные теги десяти неразрешённых/несвязных кандидатов опубликованы в таблице и JSON; Ferrovia — сеть причалов, а `d555841273` исключён из-за границы, не доказанной приватности.

Italiano: ordine migliorato con euristica di Fleury e distanze pedonali reali senza cambiare il multigrafo. **99.305,230 → 65.140,306 m; risparmio 34.164,924 m (34,404%)**. Ripristino dell’ordine base se la candidata peggiora. Le 93 ripetizioni minime valgono solo nel modello scelto. Tag dei dieci candidati pubblicati nella tabella e nel JSON: Ferrovia è una rete di moli; `d555841273` è omesso per il confine, non per accesso privato dimostrato.

### Execution and independent verification

```bash
# Run from repository root, with the discovered Python environment
PYTHONPATH=pipeline python -m venice.s10_bridge_route
python -m pytest tests/ -q
```

Dependencies: pyosmium (`osmium`), Shapely, NetworkX, pyproj, pytest. The discovered `python` had the geospatial dependencies but no pytest; pytest was installed with `uv pip install --python <actual-python-executable> pytest`, avoiding the mismatched standalone pip.

Strict TDD evidence: initial **18 failing tests** before creating the generator; passing unit tests after implementation; an additional failing portal-selection test before its helper; an additional failing inventory-reconciliation test before exporting inventory. Ordering improvement: two helper tests failed with missing-function errors before implementation, then passed; real artifact evidence failed before integration and nearby-tag evidence failed before export. Final full Python suite: **24 passed, no warnings** (including 30 seeded Euler-multigraph cases exercising self-loops, parallel edges, real entry/exit portals and baseline fallback). The existing `test_viewer_contract.py` defines no pytest tests; its standalone check and browser/UI validation are outside this worker's ownership.

Tests re-extract original PBF adjacency and coordinates independently and verify every emitted segment, node access restrictions, accepted bridge coverage, full crossing node sequences, start/end identity, inventory reconciliation, strict island containment, counts, repeated flags, exact exporter frame and recomputed metric length. GPX is parsed independently and its points equal JSON exactly. Local frame matches `s06_export.py`: **EPSG:32633; x=easting−origin easting; z=−(northing−origin northing); origin lon/lat=(12.3387,45.4340)**. JSON uses full original coordinates, not an approximation or fabricated straight-line connector.

Owned new files:

- `pipeline/venice/s10_bridge_route.py`
- `tests/test_bridge_route.py`
- `web/data/bridge-route.json`
- `web/data/bridge-route.gpx`
- `docs/bridge-route_20261023.md`

Ignored, reproducible intermediates: `data/processed/bridge_route_audit.json`, `data/processed/bridge_route_proof.json`. This update changes only the five owned artifacts listed above, plus regenerates the ignored diagnostics/proof. No UI files, source PBFs, config, or exporter were changed. No commit or push.

## Русский

Создан и независимо проверен непрерывный замкнутый маршрут из Piazzale Roma и обратно: **371 принятая группа мостов, 464 перехода, 93 повтора, 65 140,306 м, 6 159 исходных координат OSM**. Начальный/конечный узел **1851468090** (12.318467, 45.4382129). Использован только настроенный полигон главного острова relation **4817103**, не весь исторический центр. Западная транспортная/портовая зона входит в этот исходный полигон; отдельные административные полигоны шести сестьери не использованы.

Аудит: **411 настилов**, **1 522 пути-кандидата**, **416 групп = 371 принятая + 44 исключённые + 1 неразрешённая**. Ещё **6 настилов без привязанного пешеходного пути** остаются отдельными кандидатами, а не подтверждёнными публичными мостами. Исключения: **40 частных, 1 access=no, 3 несвязных с началом**. Ferrovia не имеет полного перехода. Мосты вздохов и Compagnia della Vela не имеют подтверждённого маршрутизируемого пути; переходы через них не выдуманы.

После сжатия связности без мостов получены **1 340 компонент**, из которых **106 имеют нечётную степень** в принятом мостовом графе. Замкнутый обход каждого выбранного перехода ровно один раз невозможен. Точное паросочетание даёт минимум **93 повторов в выбранной модели**. У **45 многопортальных мостов** полный путь выбран эвристически по связности берегов и расстоянию; он требует проверки. Минимум по всем альтернативным ветвям и глобальная оптимальность длины не доказаны. Боковые лестницы не считаются отдельными мостами.

Закрытые, частные, условные, ограниченные по времени, непешеходные пути, паромы и железнодорожные пути исключены. Доступ без тегов предполагается публичным; действующие закрытия не проверены на месте. Ступени включены: маршрут не безбарьерный. Это **аудит исходных данных OSM, не полный официальный реестр**. Дата 2026-10-22 означает локальное получение данных; дата снимка OSM отсутствует в заголовке PBF.

Итог: **24 теста прошли без предупреждений**, включая независимую повторную проверку исходного PBF, каждой смежной пары узлов, полного покрытия принятых переходов, замыкания, доступа, границ, длины, GPX и точного локального кадра экспортёра. Файлы перечислены выше. Изменены только пять перечисленных артефактов маршрута; коммита и push нет.

## Italiano

Generato e verificato indipendentemente un circuito pedonale continuo da Piazzale Roma e ritorno: **371 gruppi di ponti accettati, 464 attraversamenti, 93 ripetizioni, 65.140,306 m, 6.159 coordinate originali OSM**. Nodo iniziale/finale **1851468090** (12.318467, 45.4382129). Usato il poligono configurato dell’isola principale, relazione **4817103**, non l’intero centro storico. Tale poligono include le aree occidentali di trasporto/porto; non sono usati sei poligoni amministrativi distinti.

Audit: **411 impalcati**, **1.522 percorsi candidati**, **416 gruppi = 371 accettati + 44 esclusi + 1 irrisolto**. Altri **6 impalcati senza percorso pedonale associato** restano candidati separati, non ponti pubblici confermati. Esclusi: **40 privati, 1 access=no, 3 scollegati dalla partenza**. Ferrovia non offre un attraversamento completo. Ponte dei Sospiri e Ponte Compagnia della Vela non hanno un percorso instradabile confermato: nessun collegamento inventato.

La contrazione dei percorsi senza ponti dà **1.340 componenti**, con **106 vertici di grado dispari** nel grafo accettato. Un circuito con ogni attraversamento scelto una sola volta è impossibile. L’abbinamento esatto produce un minimo di **93 ripetizioni nel modello scelto**. Per **45 ponti con più portali**, un percorso completo è selezionato mediante euristica sulla connettività delle rive e sulla distanza; richiede revisione. Non sono dimostrati il minimo fra tutte le varianti né la lunghezza pedonale globalmente ottima. Scale laterali non sono ponti distinti.

Esclusi percorsi privati, chiusi, condizionali, a orario, non pedonali, traghetti e binari. Accesso senza tag assunto pubblico; chiusure attuali non controllate sul posto. Sono inclusi gradini: **non è un percorso senza barriere**. È un **audit OSM, non un inventario ufficiale completo**. La data 2026-10-22 indica l’acquisizione locale; l’intestazione PBF non contiene la data dello snapshot OSM.

Esito: **24 test superati senza avvisi**, con lettura indipendente del PBF e verifica di ogni coppia di nodi adiacenti, attraversamenti completi, copertura, chiusura, accessi, confini, distanza, GPX e sistema locale esatto dell’esportatore. File elencati sopra. Modificati solo i cinque artefatti del percorso elencati; nessun commit o push.
