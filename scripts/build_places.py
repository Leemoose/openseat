#!/usr/bin/env python3
"""Merge researched seed files into src/data/places.json, geocoding addresses via
Nominatim (1 req/s, cached in seed/geocache.json). Run from app/:
    python3 scripts/build_places.py
Uses curl because python's urllib lacks certs on this Mac."""
import json, os, re, subprocess, time, urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(os.path.dirname(ROOT), 'seed')
OUT = os.path.join(ROOT, 'src', 'data', 'places.json')
CACHE = os.path.join(SEED, 'geocache.json')
UA = 'OpenSeatPrototype/0.1 (connorito@gmail.com)'

SOURCES = {
    'golf': ['golf_courses.json', 'golf_ranges_sims.json', 'golf_shops_instruction.json'],
}

cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

def geocode(addr):
    if not addr: return None, None
    if addr in cache: return cache[addr]
    # Nominatim chokes on suite/unit fragments and plaza names; strip them first.
    clean = re.sub(r',?\s*(suite|ste\.?|unit|#)\s*[a-z0-9-]+', '', addr, flags=re.I)
    clean = re.sub(r'^[^,]*plaza,\s*', '', clean, flags=re.I)
    q = urllib.parse.urlencode({'q': clean, 'format': 'json', 'limit': 1, 'countrycodes': 'us'})
    r = subprocess.run(['curl', '-sS', '-A', UA, 'https://nominatim.openstreetmap.org/search?' + q], capture_output=True, text=True).stdout
    try:
        j = json.loads(r); ll = (float(j[0]['lat']), float(j[0]['lon'])) if j else (None, None)
    except Exception:
        ll = (None, None)
    if ll == (None, None):
        # retry with street number stripped and just city/state
        parts = [p.strip() for p in addr.split(',')]
        if len(parts) >= 2:
            q2 = urllib.parse.urlencode({'q': ', '.join(parts[-2:]), 'format': 'json', 'limit': 1, 'countrycodes': 'us'})
            time.sleep(1.1)
            r = subprocess.run(['curl', '-sS', '-A', UA, 'https://nominatim.openstreetmap.org/search?' + q2], capture_output=True, text=True).stdout
            try:
                j = json.loads(r); ll = (float(j[0]['lat']), float(j[0]['lon'])) if j else (None, None)
                if ll != (None, None): print('  approx (town centroid):', addr)
            except Exception: pass
    cache[addr] = list(ll)
    json.dump(cache, open(CACHE, 'w'), indent=1)
    time.sleep(1.1)
    return ll

def num(x):
    if isinstance(x, (int, float)): return float(x)
    if isinstance(x, str):
        m = re.search(r'\$?\s*(\d+(?:\.\d+)?)', x)
        return float(m.group(1)) if m else None
    return None

def from_price(fees):
    vals = [num(f.get('price')) for f in (fees or []) if isinstance(f, dict)]
    vals = [v for v in vals if v is not None and v > 0]
    return min(vals) if vals else None

out = {}
for hobby, files in SOURCES.items():
    items = []
    seen = set()
    for fn in files:
        p = os.path.join(SEED, fn)
        if not os.path.exists(p):
            print('missing', fn); continue
        try:
            data = json.load(open(p))
        except Exception as e:
            print('bad json', fn, e); continue
        for it in data:
            if not it.get('name'): continue
            iid = it.get('id') or re.sub(r'[^a-z0-9]+', '-', it['name'].lower()).strip('-')
            # Same venue researched twice (e.g. Five Iron as a sim and as an academy): merge.
            norm = re.sub(r'[^a-z0-9]', '', it['name'].lower().replace('golf', ''))
            dup = next((x for x in items if x['_norm'] == norm), None)
            if dup:
                for k in ('fees', 'pros', 'sessions', 'sources'):
                    have = {json.dumps(v, sort_keys=True) for v in dup[k]}
                    dup[k] += [v for v in (it.get(k) or []) if isinstance(v, (dict, str)) and json.dumps(v, sort_keys=True) not in have and (not isinstance(v, dict) or v.get('label') or v.get('name') or v.get('title'))]
                if not dup['hours'] and it.get('hours'): dup['hours'] = it['hours']
                if not dup['services'] and it.get('services'): dup['services'] = it['services']
                dup['fromPrice'] = from_price(dup['fees'])
                print('  merged', it['name'], 'into', dup['id']); continue
            if iid in seen: iid += '-2'
            seen.add(iid)
            lat, lng = geocode(it.get('address'))
            print(f"{iid}: {lat},{lng}")
            items.append({
                '_norm': norm,
                'id': iid, 'hobby': hobby, 'name': it['name'], 'kind': it.get('kind') or 'place',
                'address': it.get('address'), 'url': it.get('url'), 'phone': it.get('phone'),
                'lat': lat, 'lng': lng,
                'holes': it.get('holes'), 'par': it.get('par'), 'access': it.get('access'),
                'services': it.get('services'),
                'fees': [f for f in (it.get('fees') or []) if isinstance(f, dict) and f.get('label')],
                'fromPrice': from_price(it.get('fees')),
                'hours': it.get('hours'), 'range': it.get('range'), 'rangeNote': it.get('rangeNote'),
                'pros': [p for p in (it.get('pros') or []) if isinstance(p, dict) and p.get('name')],
                'sessions': [s for s in (it.get('sessions') or []) if isinstance(s, dict) and s.get('title')],
                'booking': it.get('booking'), 'notes': it.get('notes'),
                'verified': it.get('verified'), 'sources': it.get('sources') or [],
            })
    for i in items: i.pop('_norm', None)
    out[hobby] = items
    print(hobby, len(items), 'places;', sum(1 for i in items if i['lat']), 'geocoded;', sum(1 for i in items if i['fromPrice']), 'with a price;', sum(len(i['pros']) for i in items), 'pros')

json.dump(out, open(OUT, 'w'), indent=1)
print('wrote', OUT)
