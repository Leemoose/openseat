#!/usr/bin/env python3
"""Read venue calendars and write src/data/feed_sessions.json.

This is the product's central claim made real: the venue maintains nothing,
we read the schedule it already publishes. Run from app/:

    python3 scripts/build_feed.py            # polite refresh, uses cache
    python3 scripts/build_feed.py --force    # ignore cache freshness

Three rules the hard way:
  * Be slow. Fleisher's WAF started refusing this IP after four requests in a
    minute, and philarockgym.com blocked it for two days after a research sweep
    hammered the same endpoint. One request every REQ_DELAY seconds, a page cap,
    and a User-Agent that says who we are.
  * Cache the raw response. A re-run with a warm cache makes no network calls.
  * Never let a failed fetch delete a venue's sessions. If a source is down we
    keep the last good payload and mark it stale, because an adapter product
    that empties its own listings on a bad night is worse than no adapter.
"""
import argparse, json, os, re, subprocess, time
from datetime import datetime, timedelta
from html import unescape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SEED = os.path.join(os.path.dirname(ROOT), 'seed')
CACHE_DIR = os.path.join(SEED, 'feed_cache')
OUT = os.path.join(ROOT, 'src', 'data', 'feed_sessions.json')

UA = 'KindlingPrototype/0.1 (+https://leemoose.github.io/openseat/; connorito@gmail.com)'
REQ_DELAY = 2.5      # seconds between requests to the same host
MAX_PAGES = 6        # hard stop, so a bad cursor can never loop on a venue
PER_PAGE = 50
WINDOW_DAYS = 28
CACHE_TTL_HOURS = 12

# The Events Calendar (WordPress) exposes /wp-json/tribe/events/v1/events on a
# large share of small venues. Each entry maps the feed's own venue slugs onto
# our venue ids; anything not in the map is a different location and is dropped.
SOURCES = [
    {
        'id': 'philarockgym',
        'kind': 'tribe',
        'base': 'https://www.philarockgym.com',
        'hobby': 'climbing',
        'venues': {
            'prg-fishtown': 'prg-fishtown',
            'prg-wyncote': 'prg-wyncote',
        },
    },
    {
        'id': 'fleisher',
        'kind': 'tribe',
        'base': 'https://fleisher.org',
        # Fleisher is a multidisciplinary art school, so a single hobby for the
        # whole feed is wrong: its calendar is screenprint, charcoal, sewing,
        # jewelry and one ceramics class. Route each event on its own title and
        # let the ones that do not map fall through to art.
        'hobby': 'art',
        'classify': True,
        # Fleisher tags events to no venue, so everything from this feed is the
        # building itself.
        'venues': {'*': 'fleisher'},
    },
]

# Per-event routing, most specific first. A source with classify: True sends
# each event through this and falls back to its own hobby.
HOBBY_RULES = [
    ('pottery', re.compile(r'\b(ceramic|clay|pottery|wheel[- ]throw|throwing|glaze|kiln|handbuil)', re.I)),
    ('climbing', re.compile(r'\b(climb|belay|boulder|top rope|beta night)', re.I)),
    ('guitar', re.compile(r'\b(guitar|fretboard|fingerstyle|luthier)', re.I)),
]

BEGINNER = re.compile(r'\b(intro|introduction|beginner|basics|101|learn|first[- ]time|new to|fundamental|try)\b', re.I)
# A calendar carries more than sessions. Exhibitions, fundraisers, closures and
# children's camps are not things this product's visitor signs up and turns up
# for, and listing them makes the whole feed look untrusted.
NOT_A_SESSION = re.compile(
    r'\b(exhibition|gallery|opening reception|auction|gala|benefit|deadline|registration opens'
    r'|closed|closure|holiday|camp|ages \d|day off|school break|summer break)\b', re.I)


def fetch(url):
    """curl, because python's urllib has no certs on this Mac."""
    r = subprocess.run(
        ['curl', '-sS', '-m', '30', '-A', UA, '-w', '\n%{http_code}', url],
        capture_output=True, text=True,
    )
    body = r.stdout.rsplit('\n', 1)
    if len(body) != 2:
        return None, 0
    text, code = body[0], int(body[1] or 0)
    if code != 200:
        return None, code
    try:
        return json.loads(text), code
    except Exception:
        return None, code


def cache_path(sid):
    return os.path.join(CACHE_DIR, f'{sid}.json')


def load_cache(sid):
    p = cache_path(sid)
    if not os.path.exists(p):
        return None
    try:
        return json.load(open(p))
    except Exception:
        return None


def save_cache(sid, payload):
    os.makedirs(CACHE_DIR, exist_ok=True)
    json.dump(payload, open(cache_path(sid), 'w'), indent=1)


def fresh(cached, force):
    if force or not cached:
        return False
    try:
        age = datetime.now() - datetime.fromisoformat(cached['fetched'])
    except Exception:
        return False
    return age < timedelta(hours=CACHE_TTL_HOURS)


def pull_tribe(src, force):
    """Return (events, fetched_iso, stale). Falls back to cache on any failure."""
    cached = load_cache(src['id'])
    if fresh(cached, force):
        print(f"  {src['id']}: cache is fresh ({len(cached['events'])} events), no request made")
        return cached['events'], cached['fetched'], False

    start = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    end = (datetime.now() + timedelta(days=WINDOW_DAYS)).strftime('%Y-%m-%d %H:%M:%S')
    events, page = [], 1
    while page <= MAX_PAGES:
        url = (f"{src['base']}/wp-json/tribe/events/v1/events?per_page={PER_PAGE}&page={page}"
               f"&start_date={start.replace(' ', '%20')}&end_date={end.replace(' ', '%20')}")
        data, code = fetch(url)
        if data is None:
            # 403 means we are being rate limited; stop immediately rather than
            # retrying, which is what got this IP banned before.
            print(f"  {src['id']}: HTTP {code} on page {page}, stopping")
            if page == 1:
                if cached:
                    print(f"  {src['id']}: keeping {len(cached['events'])} cached events from {cached['fetched']} (STALE)")
                    return cached['events'], cached['fetched'], True
                return [], None, True
            break
        got = data.get('events') or []
        events += got
        print(f"  {src['id']}: page {page}, {len(got)} events (total reported {data.get('total')})")
        if len(got) < PER_PAGE:
            break
        page += 1
        time.sleep(REQ_DELAY)

    fetched = datetime.now().isoformat(timespec='seconds')
    save_cache(src['id'], {'fetched': fetched, 'events': events})
    return events, fetched, False


def money(ev):
    """A price of None means 'not published', which is different from free."""
    vals = ((ev.get('cost_details') or {}).get('values')) or []
    nums = []
    for v in vals:
        try:
            nums.append(float(v))
        except (TypeError, ValueError):
            pass
    if nums:
        lo = min(nums)
        return int(lo) if lo == int(lo) else lo
    cost = (ev.get('cost') or '').strip()
    if not cost:
        return None
    if re.search(r'\bfree\b', cost, re.I):
        return 0
    m = re.search(r'(\d+(?:\.\d{1,2})?)', cost.replace(',', ''))
    if not m:
        return None
    f = float(m.group(1))
    return int(f) if f == int(f) else f


def clean(s):
    return re.sub(r'\s+', ' ', unescape(re.sub(r'<[^>]+>', '', s or ''))).strip()


def normalise(src, events):
    out = []
    vmap = src['venues']
    for ev in events:
        slug = ((ev.get('venue') or {}).get('slug')) or '*'
        vid = vmap.get(slug) or vmap.get('*')
        if not vid:
            continue
        title = clean(ev.get('title'))
        if not title or NOT_A_SESSION.search(title):
            continue
        start, end = ev.get('start_date'), ev.get('end_date')
        if not start:
            continue
        blurb = clean(ev.get('excerpt') or ev.get('description'))[:200]
        hobby = src['hobby']
        if src.get('classify'):
            cats = ' '.join(c.get('name', '') for c in (ev.get('categories') or []))
            for h, rx in HOBBY_RULES:
                if rx.search(f'{title} {cats}'):
                    hobby = h
                    break
        out.append({
            'venueId': vid,
            'hobby': hobby,
            'title': title,
            'start': start.replace(' ', 'T'),
            'end': (end or start).replace(' ', 'T'),
            'price': money(ev),
            'url': ev.get('url') or ev.get('website') or src['base'],
            'level': 'First time welcome' if BEGINNER.search(f'{title} {blurb}') else 'Some experience',
            'source': 'feed',
        })
    # One venue can publish the same instance more than once.
    seen, uniq = set(), []
    for s in out:
        k = (s['venueId'], s['title'], s['start'])
        if k in seen:
            continue
        seen.add(k)
        uniq.append(s)
    return sorted(uniq, key=lambda s: s['start'])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--force', action='store_true', help='ignore cache freshness')
    args = ap.parse_args()

    sessions, meta = [], []
    for i, src in enumerate(SOURCES):
        if i:
            time.sleep(REQ_DELAY)
        print(f"{src['id']} ({src['base']})")
        events, fetched, stale = pull_tribe(src, args.force)
        norm = normalise(src, events)
        sessions += norm
        meta.append({
            'source': src['id'], 'base': src['base'], 'hobby': src['hobby'],
            'fetched': fetched, 'stale': stale,
            'events_read': len(events), 'sessions_kept': len(norm),
            'venues': sorted(set(norm and [s['venueId'] for s in norm] or [])),
        })
        print(f"  -> {len(norm)} sessions kept for {sorted(set(s['venueId'] for s in norm))}")

    payload = {'built': datetime.now().isoformat(timespec='seconds'), 'window_days': WINDOW_DAYS,
               'sources': meta, 'sessions': sessions}
    json.dump(payload, open(OUT, 'w'), indent=1)
    print(f'\nwrote {OUT}: {len(sessions)} sessions from {len(meta)} sources')
    for m in meta:
        flag = ' STALE' if m['stale'] else ''
        print(f"  {m['source']}: {m['sessions_kept']} sessions, fetched {m['fetched']}{flag}")


if __name__ == '__main__':
    main()
