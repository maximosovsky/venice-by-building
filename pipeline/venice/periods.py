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