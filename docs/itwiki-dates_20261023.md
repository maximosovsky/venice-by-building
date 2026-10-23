# Construction dates from Italian Wikipedia

The atlas takes dates from three sources: an OSM tag, the municipal VPRG classification, and Wikidata.
Wikidata carries a date for 278 of the 1 536 objects we matched, and this step asks whether the Italian
articles of those same buildings can fill part of the gap. They can — but only if read narrowly, because
most numbers in an article are not the building's construction date.

## What was measured first

On the 711 Italian articles belonging to our objects:

| reading | hits | verdict |
|---|---|---|
| infobox field `anno` | 403 | **not a date of construction** — gives «Arsenale 1929», «San Marco 2006», «Frari 2010» |
| infobox field `data` | 190 | likewise unrelated events |
| infobox fields `costruzione`, `inizio costruzione`, `inizio`, `completamento` | 27 | real construction dates: Marciana 1537–1588, Lido airport 1909–1915, Biennale pavilions 1932/1951/1952 |
| infobox `fondazione`, `consacrazione` | 8 | founding or consecration of an institution, not the building |
| prose «costruita nel 1457» | 72 | often about a part: the Arsenale's 1457 is its Porta Magna, the Frari's 1672 is an altar, Ca' Foscari's 1936 is a window |

Of the 72 prose turns, 41 were rejected by the subject filter alone; requiring the item's own class to be
a building removed 8 more (streets, canals, districts and gardens whose articles state a neighbour's
year), leaving 21.

## The rules that are used

* **infobox**: only construction fields (`costruzione`, `data di costruzione`, `anno di costruzione`,
  `anno costruzione`, `inizio costruzione`, `inizio`, `completamento`). A range «1537-1588» gives its
  earliest year, as Wikidata's campaign rule does.
* **prose**: the turn must name a building within sixty characters before the verb and must not mention
  an altar, a chapel, a facade, a doorway, an apse, a sacristy, a cloister, a bell tower or a restoration.
* **the item must be a building**: its Wikidata class has to name one (church, palace, bridge, pavilion,
  fortress…). Streets, canals, squares, districts, gardens and landings are skipped entirely.
* **founding is not building**: `fondazione` and `consacrazione` are recorded but never drawn.
* **a disagreement is not resolved by guessing**: where the article and Wikidata differ by more than five
  years, the value is not exported. It goes to the review list, because neither source is automatically
  right — San Pantalon is «1000» in Wikidata and 1744 in the article; the Marciana library is 1468 in
  Wikidata (the collection) and 1537 in the article (the building).
* Every exported value keeps the phrase it came from, cleaned of wiki markup.

## Result

| | |
|---|---|
| articles read | 711 |
| construction dates found | 27 (15 infobox, 21 prose, overlapping) |
| **accepted** (Wikidata is silent) | **11** |
| confirm Wikidata within five years | 11 |
| sent to review (disagree by more than five years) | 5 |
| founding/consecration only, not drawn | 8 |
| prose turns rejected by the filters | 31 |

On the map these eleven carry `dsrc = 4`: the dating note reads «Год указан в статье итальянской
Википедии», the card of those that have an article adds the phrase itself under «Год по статье», and the
notes explain that such a phrase may describe a part of a complex rather than the whole building.

## Limits

* Eleven objects is a small gain, and the review list shows why: the articles' numbers often describe a
  part, a rebuild, or an institution inside the building.
* The extraction is a heuristic over prose. Its yields are reported above rather than presented as a
  complete reading of the articles.
* Italian Wikipedia is CC BY-SA 4.0: the atlas quotes single phrases and links to the article it took
  them from.

## Reproducing

```bash
cd pipeline
python -m venice.s10_itwiki centro      # read the articles and keep the defensible dates
python -m venice.s06_export centro      # years, notes and cards
```

Wikitext is cached in `data/processed/api_cache/itwiki`; with the cache warm the step runs offline.