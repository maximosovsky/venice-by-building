"""Read an OSM extract into plain Python structures.

pyosmium objects are only valid while the file processor is on that element, so
everything needed later is copied out immediately: nodes as coordinate tuples,
ways as ref lists plus tag dictionaries.
"""
from dataclasses import dataclass, field

import osmium


@dataclass
class OsmData:
    nodes: dict = field(default_factory=dict)          # node id -> (lon, lat)
    node_tags: dict = field(default_factory=dict)      # node id -> {k: v}
    ways: dict = field(default_factory=dict)           # way id -> [node ids]
    way_tags: dict = field(default_factory=dict)       # way id -> {k: v}
    relations: list = field(default_factory=list)      # [{id, tags, members:[(type, ref, role)]}]

    def coordinates(self, way_id):
        return [self.nodes[r] for r in self.ways.get(way_id, []) if r in self.nodes]


def read_osm(path, keep_relations=True) -> OsmData:
    data = OsmData()
    for n in osmium.FileProcessor(str(path), osmium.osm.NODE):
        data.nodes[n.id] = (n.location.lon, n.location.lat)
        if len(n.tags):
            data.node_tags[n.id] = {kv.k: kv.v for kv in n.tags}
    for w in osmium.FileProcessor(str(path), osmium.osm.WAY):
        data.ways[w.id] = [nd.ref for nd in w.nodes]
        if len(w.tags):
            data.way_tags[w.id] = {kv.k: kv.v for kv in w.tags}
    if keep_relations:
        for r in osmium.FileProcessor(str(path), osmium.osm.RELATION):
            data.relations.append({"id": r.id, "tags": {kv.k: kv.v for kv in r.tags},
                                   "members": [(m.type, m.ref, m.role) for m in r.members]})
    return data