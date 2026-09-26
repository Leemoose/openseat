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

# A bare filename resolves inside seed/. A name containing "/" resolves against
# the project root, so a research folder can be read directly and there is no
# copy step to forget after re-running an agent.
SOURCES = {
    'golf': ['golf_courses.json', 'golf_ranges_sims.json', 'golf_shops_instruction.json'],
    'pottery': ['pottery_work/pottery_known.json', 'pottery_work/pottery_north.json',
                'pottery_work/pottery_south_west.json', 'pottery_work/pottery_suburbs_supply.json'],
}

# Negative findings stay in the research files as evidence, but must not ship as
# venues. An agent asked to sweep a zone correctly records "checked, no ceramics"
# as a record; the product would render that as a pottery studio.
EXCLUDE = {
    'manayunk-pottery': 'closed; manayunkpottery.com no longer resolves',
    'philadelphia-sculpture-gym': 'closed; domain gone',
    'woodmere-art-museum': 'verified: no ceramics in the full adult catalog',
    'nextfab-makerspace': 'verified: no ceramics area',
    'manayunk-roxborough-art-center': 'verified: no ceramics on any class page',
    'mt-airy-art-garage': 'verified: no clay; all 14 products are memberships',
    'philly-art-center-cherry-hill': 'ceramics unverified, single testimonial only',
    'bok-building-ceramics-tenants': 'a building with ceramics tenants, not a venue you can attend',
    'zone-coverage-note-center-city-south-west': 'agent coverage note, flagged NOT A VENUE in its own record',
}

cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

def geocode(addr):
    if not addr: return None, None
    if addr in cache: return cache[addr]
    # Nominatim chokes on suite/unit fragments and plaza names; strip them first.
    clean = re.sub(r',?\s*(suite|ste\.?|unit|#)\s*[a-z0-9-]+', '', addr, flags=re.I)
    # A bare unit code as its own comma component ("1720 N 5th Street, G3, Philadelphia").
    clean = re.sub(r',\s*[A-Za-z]?\d{1,3}[A-Za-z]?\s*(?=,)', '', clean)
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

ROUND = re.compile(r'hole|twilight|round|green fee|short course', re.I)
# A venue's "from" price answers one question: what does it cost to turn up once.
# Two kinds of row are not that.
#   Memberships and passes: Five Iron "from $289" is a monthly membership, and
#   next to Libertee's real $45 hourly rate it makes the cheaper venue look dearer.
#   Consumables and services: a pottery studio's cheapest row is firing at $0.05
#   per cubic inch, clay at $0.50 a pound, or $15 to ship a finished piece. A card
#   reading "from $0.05" is worse than no price at all.
NOT_A_WALK_IN = re.compile(
    r'member|annual|season|initiation|deposit|package|punch card|gift|certificate'
    r'|firing|fire|clay purchase|glaze|shipping|postage|shelf|shelves|storage'
    r'|materials|supplies|donation|friend of'
    r'|cancellation|late fee|payment plan|pottery sale|no.show', re.I)
# Agents flag rows they know are not a price to attend. Trust that flag: without
# it, The Clay Studio read "from $25", which was its class cancellation fee.
NOT_A_PRICE_NOTE = re.compile(r'not a class price|retail, not instruction|not instruction', re.I)
# Backstop for per-unit pricing that slips the labels above.
MIN_WALK_IN = 5
def from_price(fees, kind=None):
    fs = [f for f in (fees or []) if isinstance(f, dict)
          and not NOT_A_WALK_IN.search(f.get('label') or '')
          and not NOT_A_PRICE_NOTE.search(f.get('note') or '')]
    if kind == 'course':
        # A course's "from" price is its cheapest round, not its cheapest range bucket.
        skip = re.compile(r'cart|bucket|rental|lesson|junior|\b[36] holes\b|clinic|series|bay', re.I)
        rounds = [num(f.get('price')) for f in fs if ROUND.search(f.get('label') or '') and not skip.search(f.get('label') or '')]
        rounds = [v for v in rounds if v]
        if rounds: return min(rounds)
        return None
    vals = [num(f.get('price')) for f in fs]
    vals = [v for v in vals if v is not None and v >= MIN_WALK_IN]
    return min(vals) if vals else None


# Research annotations that agents write for the coordinator, not for a visitor.
# A leading all-caps banner an agent writes for the coordinator: "EVIDENCE.",
# "FINDING:", "NOT FOUND,". Fine in a research-notes disclosure, wrong in a
# rates table. Matched by shape, because each agent invents its own.
BANNER = re.compile(r'^\s*[A-Z][A-Z0-9 \-/,&\']{3,70}[:.,]\s*')


def strip_banner(text, limit=140):
    """Trim a fee or session note down to the part a visitor benefits from.
    Agents prefix a banner, quote the page they read ("Their words: ...") and
    append a citation. The citation is already on the page as `sources`."""
    if not text: return None
    t = BANNER.sub('', re.sub(r'\s+', ' ', str(text))).strip()
    t = re.sub(r"^(?:the\s+)?venue'?s own (?:page|site)\.?\s*(?:their words:)?\s*", '', t, flags=re.I)
    t = re.sub(r'\s*Source:\s*\S+\s*$', '', t, flags=re.I).strip()
    if len(t) > limit:
        cut = t[:limit].rsplit('. ', 1)
        t = (cut[0] + '.') if len(cut) > 1 else t[:limit].rstrip() + '...'
    return t.strip(" '\"") or None


def clean_notes(text, limit=None):
    """Agent notes are research prose written for the coordinator, not visitor
    copy. An earlier pass tried to regex them into marketing text and produced
    dangling fragments ("But it is not in Fishtown..."). They are kept whole and
    the UI renders them for what they are, under a Research notes disclosure."""
    if not text: return None
    out = re.sub(r'\s+', ' ', str(text)).strip()
    if limit and len(out) > limit:
        cut = out[:limit].rsplit('. ', 1)
        out = (cut[0] + '.') if len(cut) > 1 else out[:limit].rstrip() + '...'
    return out or None


def addr_key(addr):
    """Street number + street name, lowercased. Two seed rows for one venue
    ('Five Iron Golf Rittenhouse' as a sim, 'Five Iron Golf - Philadelphia
    Rittenhouse' as an academy) share an address but not a normalised name,
    so the name-based merge missed them and they shipped as duplicate cards."""
    if not addr: return None
    first = addr.split(',')[0].strip().lower()
    first = re.sub(r'\b(suite|ste\.?|unit|#)\s*[a-z0-9-]+', '', first)
    first = re.sub(r'\b(street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd|lane|ln|place|pl|court|ct|way|route|rt)\b\.?', '', first)
    return re.sub(r'[^a-z0-9]', '', first) or None

out = {}
for hobby, files in SOURCES.items():
    items = []
    seen = set()
    for fn in files:
        p = os.path.join(os.path.dirname(ROOT), fn) if '/' in fn else os.path.join(SEED, fn)
        if not os.path.exists(p):
            print('missing', fn); continue
        try:
            data = json.load(open(p))
        except Exception as e:
            print('bad json', fn, e); continue
        for it in data:
            if not it.get('name'): continue
            iid = it.get('id') or re.sub(r'[^a-z0-9]+', '-', it['name'].lower()).strip('-')
            if iid in EXCLUDE:
                print(f'  excluded {iid}: {EXCLUDE[iid]}'); continue
            # Agents append context to addresses ("(formerly 3245 Amber St)").
            # Nominatim then fails and falls back to a city centroid, which puts
            # a Norristown supplier in the middle of Philadelphia.
            # Any parenthetical: "(enter on Pastorius)", "(formerly 3245 Amber
            # St)", "(second campus ...)". All of them break the geocoder, which
            # then falls back to a city centroid and drops the pin miles away.
            if it.get('address'):
                it['address'] = re.sub(r'\s*\([^)]*\)', '', it['address']).strip().rstrip(',')
            # Same venue researched twice (e.g. Five Iron as a sim and as an
            # academy): merge on the normalised name OR the street address,
            # because the two seed rows often name the place differently.
            norm = re.sub(r'[^a-z0-9]', '', it['name'].lower().replace('golf', ''))
            akey = addr_key(it.get('address'))
            dup = next((x for x in items if x['_norm'] == norm or (akey and x['_addr'] == akey)), None)
            if dup:
                for k in ('fees', 'pros', 'sessions', 'sources'):
                    have = {json.dumps(v, sort_keys=True) for v in dup[k]}
                    dup[k] += [v for v in (it.get(k) or []) if isinstance(v, (dict, str)) and json.dumps(v, sort_keys=True) not in have and (not isinstance(v, dict) or v.get('label') or v.get('name') or v.get('title'))]
                if not dup['hours'] and it.get('hours'): dup['hours'] = it['hours']
                if not dup['services'] and it.get('services'): dup['services'] = it['services']
                for k in ('platform', 'feedUrl', 'phone', 'booking'):
                    if not dup.get(k) and it.get(k): dup[k] = it[k]
                dup['fromPrice'] = from_price(dup['fees'], dup['kind'])
                print('  merged', it['name'], 'into', dup['id']); continue
            if iid in seen: iid += '-2'
            seen.add(iid)
            lat, lng = geocode(it.get('address'))
            print(f"{iid}: {lat},{lng}")
            items.append({
                '_norm': norm, '_addr': akey,
                'id': iid, 'hobby': hobby, 'name': it['name'], 'kind': it.get('kind') or 'place',
                'address': it.get('address'), 'url': it.get('url'), 'phone': it.get('phone'),
                'lat': lat, 'lng': lng,
                'holes': it.get('holes'), 'par': it.get('par'), 'access': it.get('access'),
                'services': it.get('services'),
                # A row the agent flagged as "not a class price" is not a rate.
                # The Clay Studio's whole Rates table was a payment-plan deposit,
                # a cancellation fee and the price of a mug at its annual sale.
                'fees': [{**f, 'note': strip_banner(f.get('note'))}
                         for f in (it.get('fees') or [])
                         if isinstance(f, dict) and f.get('label')
                         and not NOT_A_PRICE_NOTE.search(f.get('note') or '')],
                'fromPrice': from_price(it.get('fees'), it.get('kind')),
                'hours': it.get('hours'), 'range': it.get('range'), 'rangeNote': it.get('rangeNote'),
                'pros': [p for p in (it.get('pros') or []) if isinstance(p, dict) and p.get('name')],
                'sessions': [{**s, 'note': strip_banner(s.get('note'))}
                             for s in (it.get('sessions') or []) if isinstance(s, dict) and s.get('title')],
                'booking': it.get('booking'), 'notes': clean_notes(it.get('notes')),
                # Whether this venue's schedule is machine-readable is the
                # product's central question, so it travels with the place.
                'platform': it.get('platform'), 'feedUrl': it.get('feedUrl'),
                'verified': it.get('verified'), 'sources': it.get('sources') or [],
            })
    for i in items: i.pop('_norm', None); i.pop('_addr', None)
    out[hobby] = items
    print(hobby, len(items), 'places;', sum(1 for i in items if i['lat']), 'geocoded;', sum(1 for i in items if i['fromPrice']), 'with a price;', sum(len(i['pros']) for i in items), 'pros')

json.dump(out, open(OUT, 'w'), indent=1)
print('wrote', OUT)
