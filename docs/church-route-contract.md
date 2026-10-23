# Church route data contract

Generator: `pipeline/venice/s11_church_route.py`; outputs `web/data/church-route.json` and `.gpx`.

JSON root: `id: "churches-lagoon"`, `title` and `summary` dictionaries with `ru`, `it`, `en`, `status: "ready"`, ordered `stops`, `segments`, `sources`, `audit`.

Each stop: unique stable `id`, `name` dictionary (`ru/it/en`), numeric `lon`, `lat`, `local: [x,z]`, `wikipedia` article URL, `area`, `access_note` dictionary. Extra provenance fields allowed. Coordinates WGS84; local coordinates use EPSG:32633, origin lon=12.3387 lat=45.4340: x=easting-origin easting, z=-(northing-origin northing).

Each segment: `from`, `to` stop ids, `mode`, `geometry` array of WGS84 [lon,lat], `geometry_semantics`. Modes `walk` (only real routable pedestrian network geometry), `boat` (only verified navigable/service geometry), or `schematic` (non-navigational connector). Schematic segments have no length/duration and must not be styled/described as actual walking or boat paths. A `suggested_transport` and access note may describe a transfer without fabricating geometry. GPX uses waypoints and separate schematic routes, not a navigational walking track.

Scope: surviving Wikipedia-mentioned churches/temples of all confessions in historic island Venice and lagoon islands, including San Lazzaro, excluding mainland Mestre/Marghera and demolished buildings. Exterior stops allowed. Restricted/private islands remain in inventory with explicit non-routine access warning, not fictional ACTV services. One ordering, no day splits. Completeness is backed by a candidate reconciliation audit; unknown candidates must be reported rather than silently dropped.
