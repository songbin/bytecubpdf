import re
import struct

pattern_map_r = (
    r"\s+begincidrange\s*"
    r"(?P<cidrange>(<[a-fA-F0-9]+>\s*<[a-fA-F0-9]+>\s*\d+\s*)+)"
    r"\s+endcidrange\s+"
)
pattern_map_c = (
    r"\s+begincidchar\s*"
    r"(?P<cidchar>(<[a-fA-F0-9]+>\s*\d+\s*)+)"
    r"\s+endcidchar\s+"
)
pattern_one_c = (
    r"<(?P<pat>[a-fA-F0-9]+)>"
    r"\s*"
    r"(?P<val>\d+)"
)
pattern_one_r = (
    r"<(?P<pat>[a-fA-F0-9]+)>"
    r"\s*"
    r"<(?P<end>[a-fA-F0-9]+)>"
    r"\s*"
    r"(?P<val>\d+)"
)


def parse_blob_value(text):
    return int(text, 16), len(text) // 2


def parse_cmap_char(text, store):
    for m in re.finditer(pattern_one_c, text):
        pat = m["pat"]
        val = m["val"]
        store.append((pat, int(val)))


def parse_cmap_range(text, store):
    for m in re.finditer(pattern_one_r, text):
        pat = m["pat"]
        end = m["end"]
        val = m["val"]
        store.append((pat, end, int(val)))


def parse_cmap(text):
    usecmap = ""
    if m := re.search(r"/(?P<usecmap>[a-zA-Z0-9-]+)\s+usecmap\s+", text):
        usecmap = m["usecmap"]
    cidrange = []
    for m in re.finditer(pattern_map_r, text):
        parse_cmap_range(m["cidrange"], cidrange)
    cidchar = []
    for m in re.finditer(pattern_map_c, text):
        parse_cmap_char(m["cidchar"], cidchar)
    return usecmap, cidrange, cidchar


_CMAP_CACHE: dict[str, tuple[list, list]] = {}


def _normalize_cmap_name(name: str) -> str:
    """Normalize cmap name for internal cache key."""
    if name.endswith(".json"):
        return name[: -len(".json")]
    return name


def use_cmap(name: str):
    key = _normalize_cmap_name(name)
    if key in _CMAP_CACHE:
        return _CMAP_CACHE[key]

    # Lazy import to avoid circular dependency at import time.
    from babeldoc.assets.assets import get_cmap_data

    data = get_cmap_data(key)
    if not isinstance(data, dict):
        raise TypeError(f"Invalid cmap data type for {key}: {type(data)!r}")

    cid_u = data.get("u") or ""
    cid_r = data.get("r") or []
    cid_c = data.get("c") or []

    store_r: list = []
    store_c: list = []
    if cid_u:
        use_r, use_c = use_cmap(cid_u)
        store_r += use_r
        store_c += use_c
    store_r += cid_r
    store_c += cid_c

    _CMAP_CACHE[key] = (store_r, store_c)
    return store_r, store_c


def propagation(r, c):
    encoding = {}
    len_set = set()
    for one_r in r:
        val_l, len_l = parse_blob_value(one_r[0])
        val_r, len_r = parse_blob_value(one_r[1])
        if len_l != len_r:
            continue
        len_set.add(len_l)
        for i, v in enumerate(range(val_l, val_r + 1)):
            val_b = struct.pack(">L", v)
            fin_b = val_b[4 - len_l :]
            encoding[fin_b] = one_r[2] + i
    for one_c in c:
        encoding[one_c[0]] = one_c[1]
    len_list = list(len_set)
    len_list.sort(reverse=True)
    return encoding, len_list


class CharacterMap:
    def __init__(self, text):
        cid_r = []
        cid_c = []
        usecmap, cidrange, cidchar = parse_cmap(text)
        if usecmap:
            use_r, use_c = use_cmap(usecmap)
            cid_r += use_r
            cid_c += use_c
        cid_r += cidrange
        cid_c += cidchar
        self.encoding, self.len_list = propagation(cid_r, cid_c)

    def decode_one(self, text):
        for l in self.len_list:
            pat = text[:l]
            if pat in self.encoding:
                return self.encoding[pat], l
        return 0, 1

    def decode(self, text):
        index = 0
        size = len(text)
        gstr = []
        while index < size:
            g, l = self.decode_one(text[index:])
            gstr.append(g)
            index += l
        return gstr
