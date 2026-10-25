"""Age classes of the municipal VPRG classification, as the atlas is allowed to use them.

The municipality classifies each unità edilizia by typology and persistence, never by a
construction year. Three coarse epochs are all that can be read from it, so they are
carried as intervals with open ends, plus a state flag for units that were transformed,
merged or rebuilt. Nothing here may be turned into a single year.
"""

EPOCHS = {
    "preottocentesche": {"label": "до 1800", "label_en": "before 1800", "year_min": None, "year_max": 1800},
    "ottocentesche": {"label": "1800–1899", "label_en": "19th century", "year_min": 1800, "year_max": 1899},
    "novecentesche": {"label": "1900–", "label_en": "20th century", "year_min": 1900, "year_max": None},
    "неклассифицировано": {"label": "неизвестно", "label_en": "unknown", "year_min": None, "year_max": None},
}

STATE_FLAGS = (
    ("originarie", "orig"),
    ("parzialmente trasformate", "partial"),
    ("oggetto di fusione", "merged"),
    ("di ristrutturazione", "rebuilt"),
    ("capannone", "shed"),
)


def epoch_of(cls_code, description):
    d = (description or "").lower()
    if not cls_code:
        return "неклассифицировано"
    if "preottocentesche" in d:
        return "preottocentesche"
    if "ottocentesche" in d:
        return "ottocentesche"
    if "novecentesche" in d:
        return "novecentesche"
    return "неклассифицировано"


def state_flags(description):
    d = (description or "").lower()
    return "|".join(flag for word, flag in STATE_FLAGS if word in d)


def interval(epoch):
    e = EPOCHS.get(epoch, EPOCHS["неклассифицировано"])
    return e["year_min"], e["year_max"], e["label"]

# ---- Шкала атласа: по одному слоту на век, плюс два ярлыка, которые стоят вне времени --------
# Владелец атласа потребовал век вместо трёх грубых эпох и начало шкалы с 500 года. Век берётся из
# доказательства (год Викиданных/OSM/статьи, век или десятилетие Викиданных): классификация VPRG
# века не называет, поэтому здание только с классом «до 1800» остаётся отдельным ярлыком, а не
# размазывается по векам.

YEAR_FLOOR = 500            # начало шкалы; всё старше прижимается к первому слоту
SLOT_PRE1800 = 16           # «до 1800 года» — класс без века
SLOT_UNKNOWN = 17           # ни даты, ни класса

ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII',
         'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
ORDINAL = {i: f'{i}th' for i in range(4, 21)}
ORDINAL.update({21: '21st'})


def century_names(c):
    n = c // 100 + 1
    return {'ru': f'{ROMAN[n]} век', 'it': f'{ROMAN[n]} secolo', 'en': f'{ORDINAL[n]} century'}


def slot_table():
    """18 записей: 16 веков на оси (axis=True) и два ярлыка вне её. Порядок задаёт номер слота."""
    out = []
    for i, c in enumerate(range(YEAR_FLOOR, 2000, 100)):
        names = century_names(c)
        if i == 0:
            label = {'ru': 'до 600 — VI век и старше', 'it': 'prima del 600 — VI secolo e oltre',
                     'en': 'before 600 — 6th century and earlier'}
            out.append({'key': 'upto600', 'label': label, 'dates': {'ru': 'до 600', 'it': 'prima del 600', 'en': 'before 600'},
                        'name': {k: v.replace(' — ', '') for k, v in
                                 {'ru': 'VI век и старше', 'it': 'VI secolo e oltre', 'en': '6th century and earlier'}.items()},
                        'from': c, 'to': c + 99, 'axis': True})
        else:
            dates = f'{c}–{c + 99}'
            out.append({'key': f'c{c}', 'label': {k: f'{dates} — {v}' for k, v in names.items()},
                        'dates': {k: dates for k in names}, 'name': names,
                        'from': c, 'to': c + 99, 'axis': True})
    # 2000-е заканчиваются текущим годом
    names = century_names(2000)
    dates = '2000–2026'
    out.append({'key': 'c2000', 'label': {k: f'{dates} — {v}' for k, v in names.items()},
                'dates': {k: dates for k in names}, 'name': names, 'from': 2000, 'to': 2026, 'axis': True})
    out.append({'key': 'pre1800', 'label': {'ru': 'до 1800 года', 'it': 'prima del 1800', 'en': 'before 1800'},
                'dates': None, 'name': None, 'from': -1, 'to': -1, 'axis': False})
    out.append({'key': 'unknown', 'label': {'ru': 'неизвестен', 'it': 'sconosciuto', 'en': 'unknown'},
                'dates': None, 'name': None, 'from': -2, 'to': -2, 'axis': False})
    return out


# Цвета: одна тёплая шкала с шагом по светлоте (самая безопасная для дальтонизма), а XX век —
# два синих тона: светлый до 1945 года и тёмный после него, как потребовал владелец.
SLOT_COLORS = [
    '#4a2b26', '#57332b', '#643b30', '#714335',   # VI–IX века
    '#7d4b39', '#8a553d', '#966041', '#a26b46',   # X–XIII века
    '#ae764b', '#ba8250', '#c58d55', '#cf9a5b',   # XIV–XVII века
    '#d6a865', '#d9b478', '#4a5c8f', '#2f3f6b',   # XVIII, XIX, XX, XXI
    '#8e3634', '#6f7276',                          # до 1800 без века · неизвестно
]
POSTWAR_COLOR = '#2f3f6b'
POSTWAR_FROM = 1946


def century_slot(year):
    """Номер века на оси для года; старше начала шкалы — первый слот."""
    i = (int(year) - YEAR_FLOOR) // 100
    return max(0, min(15, i))


def slot_of(flag, yfrom, yto, year):
    """Слот по доказательству: узкий интервал и год — свой век, широкий до-1800-й — ярлык."""
    if flag == 2:
        return SLOT_UNKNOWN
    if flag == 0:
        return century_slot(year)
    span = int(yto) - int(yfrom)
    if span <= 99:
        return century_slot(yfrom)
    if int(yfrom) <= 1799 and int(yto) >= 1800:
        return SLOT_PRE1800
    return century_slot(yfrom)

