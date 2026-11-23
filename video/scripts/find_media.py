#!/usr/bin/env python3
"""
Поиск картинок/видео с понятной лицензией и скачивание с записью в манифест.

Источники (по приоритету канала):
  met        — The Metropolitan Museum of Art, Open Access (CC0; без ключа)
  cleveland  — Cleveland Museum of Art, Open Access (CC0; без ключа)
  artic      — Art Institute of Chicago, public domain (CC0; без ключа)
  nasa       — images-api.nasa.gov (картинки и видео NASA; без ключа)
  openverse  — api.openverse.org (800+ млн CC-материалов, Flickr/Wikimedia/музеи; без ключа)
  wikimedia  — commons.wikimedia.org (без ключа)
  openverse-audio — api.openverse.org/v1/audio (музыка и звуки CC0/CC BY: Freesound, Jamendo, ccMixter; без ключа)
  pexels     — api.pexels.com (нужен ключ: сохраняется в окружении, прокси подставляет сам)

Лицензии: берём CC0 / Public Domain / CC BY / NASA. CC BY-SA помечается "caution" (только без
переработки картинки, по согласованию). NC и ND отбрасываются всегда.
Google Images: Custom Search API закрыт для новых пользователей (2026) и отключается 01.01.2027 —
Google используем только вручную как поисковик с фильтром «Лицензии Creative Commons»,
а файл берём с исходной страницы после проверки лицензии (docs/04-assets-and-licenses.md).

Примеры:
  python3 scripts/find_media.py search "venus surface" --source openverse --limit 10
  python3 scripts/find_media.py search "venus" --source nasa --type video
  python3 scripts/find_media.py get openverse <id> --out public/images/venus-radar.jpg \
        --manifest src/videos/venus-stock/footage.manifest.json
"""
import argparse
import json
import re
import sys
import urllib.parse
import urllib.request
from datetime import date
from pathlib import Path

UA = 'ScienceHistoryVideoBot/1.0 (educational YouTube channel tooling)'
OK_LICENSES = {'cc0', 'pdm', 'by', 'public domain', 'nasa'}
CAUTION = {'by-sa'}


def http_json(url: str, headers: dict | None = None, retries: int = 2) -> dict:
    import time
    import urllib.error
    for attempt in range(retries + 1):
        req = urllib.request.Request(url, headers={'User-Agent': UA, **(headers or {})})
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:  # временные сбои API (5xx) — повторяем
            if e.code < 500 or attempt == retries:
                raise
            time.sleep(2 * (attempt + 1))


def license_status(lic: str) -> str:
    l = lic.lower().strip()
    if 'nc' in l.split('-') or 'nd' in l.split('-'):
        return 'reject'
    if l in CAUTION:
        return 'caution'
    if l in OK_LICENSES or l.startswith('cc0') or 'public domain' in l:
        return 'ok'
    return 'check'


# ─── источники ──────────────────────────────────────────────────────
def search_nasa(q: str, kind: str, limit: int):
    d = http_json('https://images-api.nasa.gov/search?' + urllib.parse.urlencode({'q': q, 'media_type': kind}))
    out = []
    for it in d['collection']['items'][:limit]:
        m = it['data'][0]
        nid = m['nasa_id']
        owner = m.get('secondary_creator') or m.get('photographer') or m.get('center') or 'NASA'
        out.append({
            'source': 'nasa', 'id': nid, 'title': m.get('title', ''), 'type': kind,
            'license': 'nasa', 'creator': owner,
            'credit': owner if 'NASA' in owner else f'NASA / {owner}',
            'page': f'https://images.nasa.gov/details/{urllib.parse.quote(nid)}',
            'preview': (it.get('links') or [{}])[0].get('href', ''),
            'note': 'Проверь владельца: если в credit указана не NASA/JPL — это сторонний автор, коммерция ограничена.',
        })
    return out


def nasa_asset_url(nid: str, kind: str) -> str:
    files = http_json(f'https://images-api.nasa.gov/asset/{urllib.parse.quote(nid)}')['collection']['items']
    hrefs = [f['href'] for f in files]
    pref = ['~orig.', '~large.'] if kind == 'image' else ['~orig.mp4', '~large.mp4', '~medium.mp4', '.mp4']
    for p in pref:
        for h in hrefs:
            if p in h and not h.endswith('.json'):
                return h.replace('http://', 'https://')
    return hrefs[0].replace('http://', 'https://')


def search_openverse(q: str, kind: str, limit: int):
    if kind != 'image':
        print('openverse: только картинки', file=sys.stderr)
    params = {'q': q, 'license_type': 'commercial', 'page_size': min(limit, 20)}
    d = http_json('https://api.openverse.org/v1/images/?' + urllib.parse.urlencode(params))
    out = []
    for r in d.get('results', [])[:limit]:
        lic = r.get('license', '')
        out.append({
            'source': 'openverse', 'id': r['id'], 'title': r.get('title', ''), 'type': 'image',
            'license': lic, 'license_version': r.get('license_version'), 'license_url': r.get('license_url'),
            'creator': r.get('creator'), 'credit': r.get('attribution') or f"{r.get('creator')} ({lic.upper()})",
            'page': r.get('foreign_landing_url'), 'download': r.get('url'), 'provider': r.get('provider'),
            'size': f"{r.get('width')}x{r.get('height')}",
        })
    return out


def search_openverse_audio(q: str, kind: str, limit: int):
    """Музыка и звуки (Freesound, Jamendo, ccMixter, Wikimedia). Только лицензии, разрешающие коммерцию."""
    # Только CC0 и CC BY: без NC/ND и без share-alike (музыка целиком входит в ролик).
    params = {'q': q, 'license': 'cc0,by', 'page_size': min(limit, 20)}
    d = http_json('https://api.openverse.org/v1/audio/?' + urllib.parse.urlencode(params))
    out = []
    for r in d.get('results', [])[:limit]:
        lic = r.get('license', '')
        out.append({
            'source': 'openverse-audio', 'id': r['id'], 'title': r.get('title', ''), 'type': 'audio',
            'license': lic, 'license_version': r.get('license_version'), 'license_url': r.get('license_url'),
            'creator': r.get('creator'), 'credit': r.get('attribution') or f"{r.get('creator')} ({lic.upper()})",
            'page': r.get('foreign_landing_url'), 'download': r.get('url'), 'provider': r.get('provider'),
            'duration_s': round((r.get('duration') or 0) / 1000, 1), 'genres': r.get('genres'),
        })
    return out


def search_met(q: str, kind: str, limit: int):
    """The Metropolitan Museum of Art — Open Access (CC0). Без ключа."""
    # v1/search выведен из работы 01.10.2026 → v1.1/search (пагинация offset/limit).
    ids = http_json('https://collectionapi.metmuseum.org/public/collection/v1.1/search?'
                    + urllib.parse.urlencode({'q': q, 'hasImages': 'true', 'limit': limit * 4, 'offset': 0})).get('objectIDs') or []
    out = []
    for oid in ids[: limit * 4]:
        o = http_json(f'https://collectionapi.metmuseum.org/public/collection/v1/objects/{oid}')
        if not (o.get('isPublicDomain') and o.get('primaryImage')):
            continue
        acc = o.get('accessionNumber', '')
        out.append({
            'source': 'met', 'id': oid, 'title': o.get('title', ''), 'type': 'image', 'license': 'cc0',
            'creator': o.get('artistDisplayName') or o.get('culture'),
            'credit': f'The Metropolitan Museum of Art, {acc}',
            'object': {'accession': acc, 'date': o.get('objectDate'), 'culture': o.get('culture'),
                       'period': o.get('period'), 'findspot': ', '.join(x for x in [o.get('excavation'), o.get('country')] if x)},
            'page': o.get('objectURL'), 'download': o.get('primaryImage'),
        })
        if len(out) >= limit:
            break
    return out


def search_cleveland(q: str, kind: str, limit: int):
    """Cleveland Museum of Art — Open Access (только CC0). Без ключа."""
    d = http_json('https://openaccess-api.clevelandart.org/api/artworks/?'
                  + urllib.parse.urlencode({'q': q, 'cc0': 1, 'has_image': 1, 'limit': limit}))
    out = []
    for r in d.get('data', [])[:limit]:
        img = (r.get('images') or {}).get('print') or (r.get('images') or {}).get('web') or {}
        acc = r.get('accession_number', '')
        out.append({
            'source': 'cleveland', 'id': r['id'], 'title': r.get('title', ''), 'type': 'image', 'license': 'cc0',
            'creator': ', '.join(r.get('culture') or []),
            'credit': f'Cleveland Museum of Art, {acc}',
            'object': {'accession': acc, 'date': r.get('creation_date'), 'culture': r.get('culture'),
                       'findspot': r.get('find_spot')},
            'page': r.get('url'), 'download': img.get('url'),
        })
    return out


def search_artic(q: str, kind: str, limit: int):
    """Art Institute of Chicago — public domain работы (изображения CC0). Без ключа."""
    params = {'q': q, 'query[term][is_public_domain]': 'true', 'limit': limit,
              'fields': 'id,title,image_id,date_display,place_of_origin,main_reference_number,artist_display'}
    d = http_json('https://api.artic.edu/api/v1/artworks/search?' + urllib.parse.urlencode(params))
    out = []
    for r in d.get('data', [])[:limit]:
        if not r.get('image_id'):
            continue
        acc = r.get('main_reference_number', '')
        out.append({
            'source': 'artic', 'id': r['id'], 'title': r.get('title', ''), 'type': 'image', 'license': 'cc0',
            'creator': r.get('artist_display'), 'credit': f'Art Institute of Chicago, {acc}',
            'object': {'accession': acc, 'date': r.get('date_display'), 'origin': r.get('place_of_origin')},
            'page': f"https://www.artic.edu/artworks/{r['id']}",
            'download': f"https://www.artic.edu/iiif/2/{r['image_id']}/full/1686,/0/default.jpg",
        })
    return out


def search_wikimedia(q: str, kind: str, limit: int):
    params = {
        'action': 'query', 'format': 'json', 'generator': 'search', 'gsrnamespace': 6,
        'gsrsearch': q + (' filetype:video' if kind == 'video' else ' filetype:bitmap'),
        'gsrlimit': limit, 'prop': 'imageinfo', 'iiprop': 'url|extmetadata|size',
    }
    d = http_json('https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode(params))
    out = []
    for p in (d.get('query', {}).get('pages', {}) or {}).values():
        ii = (p.get('imageinfo') or [{}])[0]
        meta = ii.get('extmetadata', {})
        g = lambda k: re.sub('<[^>]+>', '', (meta.get(k) or {}).get('value', '')).strip()
        lic = g('LicenseShortName')
        lic_norm = 'pdm' if 'public domain' in lic.lower() else re.sub(r'-\d(\.\d)?$', '', lic.lower().replace('cc ', '').replace(' ', '-'))
        out.append({
            'source': 'wikimedia', 'id': p.get('title'), 'title': p.get('title'), 'type': kind,
            'license': lic_norm, 'license_raw': lic, 'creator': g('Artist'),
            'credit': f"{g('Artist') or 'Wikimedia Commons'} — {lic}", 'page': ii.get('descriptionurl'),
            'download': ii.get('url'), 'size': f"{ii.get('width')}x{ii.get('height')}",
        })
    return out


def search_pexels(q: str, kind: str, limit: int):
    # Ключ не передаём: его подставляет прокси облачного окружения (сохранённый секрет для api.pexels.com).
    base = 'https://api.pexels.com/videos/search?' if kind == 'video' else 'https://api.pexels.com/v1/search?'
    d = http_json(base + urllib.parse.urlencode({'query': q, 'per_page': limit}))
    out = []
    for r in d.get('videos' if kind == 'video' else 'photos', [])[:limit]:
        if kind == 'video':
            files = sorted([f for f in r['video_files'] if (f.get('height') or 0) <= 1080], key=lambda f: -(f.get('height') or 0))
            dl, who = (files[0]['link'] if files else ''), r['user']['name']
        else:
            dl, who = r['src']['original'], r.get('photographer')
        out.append({
            'source': 'pexels', 'id': r['id'], 'title': r.get('alt') or r.get('url'), 'type': kind,
            'license': 'pexels', 'creator': who, 'credit': f'{who} / Pexels', 'page': r['url'], 'download': dl,
        })
    return out


SOURCES = {'met': search_met, 'cleveland': search_cleveland, 'artic': search_artic, 'nasa': search_nasa, 'openverse': search_openverse, 'openverse-audio': search_openverse_audio, 'wikimedia': search_wikimedia, 'pexels': search_pexels}
OK_LICENSES.add('pexels')


def cmd_search(a):
    res = SOURCES[a.source](a.query, a.type, a.limit)
    for r in res:
        r['status'] = license_status(r['license'])
    res = [r for r in res if r['status'] != 'reject']
    print(json.dumps(res, ensure_ascii=False, indent=2))


def cmd_get(a):
    found = [r for r in SOURCES[a.source](a.query or a.id, a.type, 50) if str(r['id']) == str(a.id)]
    if not found:
        sys.exit(f'Не найдено: {a.id} (передай --query, по которому нашёл)')
    r = found[0]
    status = license_status(r['license'])
    if status == 'reject':
        sys.exit(f"Лицензия {r['license']} запрещена (NC/ND)")
    url = r.get('download') or nasa_asset_url(r['id'], a.type)
    out = Path(a.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    # В URL музеев бывают не-ASCII символы (например «–» в номерах Мет) — экранируем путь.
    url = urllib.parse.quote(url, safe=':/?&=%#+,;@')
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    with urllib.request.urlopen(req, timeout=120) as resp:
        ctype = resp.headers.get('Content-Type', '')
        body = resp.read()
    # CDN может вернуть HTML-страницу защиты от ботов вместо файла — такой «файл» не сохраняем.
    if not ctype.split('/')[0] in ('image', 'video', 'audio') and not ctype.startswith('application/octet-stream'):
        sys.exit(f'Сервер вернул не медиафайл ({ctype or "без Content-Type"}): {url}\n'
                 f'Не обходим защиту — ищи этот предмет в другом источнике (Wikimedia, другой музей).')
    out.write_bytes(body)
    print(f'Скачано: {out} ({out.stat().st_size // 1024} КБ), лицензия: {r["license"]} [{status}]')
    if a.manifest:
        mp = Path(a.manifest)
        m = json.loads(mp.read_text()) if mp.exists() else {'video': mp.parent.name, 'assets': []}
        rel = str(out).split('public/', 1)[-1]
        m['assets'] = [x for x in m['assets'] if x.get('file') != rel]
        m['assets'].append({
            'file': rel, 'type': r['type'], 'title': r['title'], 'source': r['source'],
            'url': r['page'], 'original': url, 'license': r['license'], 'license_url': r.get('license_url'),
            'creator': r.get('creator'), 'credit': r['credit'], 'license_status': status,
            'object': r.get('object'),
            'added': date.today().isoformat(),
        })
        m['updated'] = date.today().isoformat()
        mp.write_text(json.dumps(m, ensure_ascii=False, indent=2) + '\n')
        print(f'Записано в манифест: {mp}')


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    s = sub.add_parser('search')
    s.add_argument('query')
    s.add_argument('--source', choices=SOURCES, default='openverse')
    s.add_argument('--type', choices=['image', 'video', 'audio'], default='image')
    s.add_argument('--limit', type=int, default=10)
    g = sub.add_parser('get')
    g.add_argument('source', choices=SOURCES)
    g.add_argument('id')
    g.add_argument('--query', help='поисковый запрос, по которому найден id (для openverse/wikimedia/pexels)')
    g.add_argument('--type', choices=['image', 'video', 'audio'], default='image')
    g.add_argument('--out', required=True)
    g.add_argument('--manifest')
    a = ap.parse_args()
    {'search': cmd_search, 'get': cmd_get}[a.cmd](a)


if __name__ == '__main__':
    main()
