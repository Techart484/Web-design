#!/usr/bin/env python3
"""
Autonomous Web Designer Engine — Brand Bible Extractor (v3.0)

Builds a niche-aware Brand Bible from a target URL:
  * Crawls the page AND its linked external stylesheets for real brand colors
  * Filters out neutral/grey/near-black colors and keeps only saturated hues
  * Classifies the business into one of the supported luxury niches using
    word-boundary keyword scoring (no more 'med' matching 'commerce')
  * Guarantees a legible palette by validating contrast against the niche
    background and falling back to the curated niche palette when needed
  * Extracts name / USP / services for downstream content

Output: brand_colors.json (the Brand Bible) + JSON to stdout.
"""

import sys
import os
import re
import json
import urllib.request
from urllib.parse import urljoin, urlparse
from collections import Counter
from html import unescape

ENGINE_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NICHES_PATH = os.path.join(ENGINE_ROOT, 'config', 'niches.json')

with open(NICHES_PATH, 'r', encoding='utf-8') as f:
    NICHES_CONFIG = json.load(f)

NICHE_KEYWORDS = NICHES_CONFIG['keywords']
NICHES = NICHES_CONFIG['niches']
DEFAULT_NICHE = NICHES_CONFIG['_meta']['default_niche']

NEUTRAL_COLORS = {
    '#ffffff', '#000000', '#fafafa', '#f9f9f9', '#f8f8f8', '#f5f5f5', '#f3f4f6',
    '#eeeeee', '#e5e7eb', '#e0e0e0', '#0a0a0a', '#111111', '#111827', '#121212',
    '#181818', '#1a1a1a', '#222222', '#333333', '#444444', '#666666', '#888888',
    '#999999', '#aaaaaa', '#cccccc', '#dddddd', '#010101', '#020202', '#030303'
}


# ── Color utilities ────────────────────────────────────────
def clean_hex(hex_val):
    hex_val = hex_val.strip().lower()
    if not hex_val.startswith('#'):
        hex_val = '#' + hex_val
    if len(hex_val) == 4:
        hex_val = '#' + ''.join(c * 2 for c in hex_val[1:])
    return hex_val[:7]


def hex_to_rgb(hex_val):
    h = hex_val.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(c))) for c in rgb)


def saturation_spread(hex_val):
    """How far the color is from grey (0 = perfect grey)."""
    r, g, b = hex_to_rgb(hex_val)
    return max(r, g, b) - min(r, g, b)


def relative_luminance(hex_val):
    def chan(c):
        c = c / 255.0
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = hex_to_rgb(hex_val)
    return 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b)


def contrast_ratio(hex_a, hex_b):
    la, lb = relative_luminance(hex_a), relative_luminance(hex_b)
    lighter, darker = max(la, lb), min(la, lb)
    return (lighter + 0.05) / (darker + 0.05)


def is_brand_hue(hex_val):
    """A usable brand color: not neutral, has real saturation."""
    return (
        len(hex_val) == 7
        and hex_val not in NEUTRAL_COLORS
        and saturation_spread(hex_val) >= 28
    )


def lighten_for_contrast(hex_val, bg_hex, target=3.0):
    """Blend a color toward white until it reads on a dark background."""
    rgb = list(hex_to_rgb(hex_val))
    for _ in range(20):
        if contrast_ratio(rgb_to_hex(rgb), bg_hex) >= target:
            break
        rgb = [c + (255 - c) * 0.12 for c in rgb]
    return rgb_to_hex(rgb)


def darken(hex_val, factor=0.45):
    return rgb_to_hex([c * factor for c in hex_to_rgb(hex_val)])


# ── Network ────────────────────────────────────────────────
def fetch(url, timeout=8):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; BrandBible/3.0)'})
    with urllib.request.urlopen(req, timeout=timeout) as res:
        charset = res.headers.get_content_charset() or 'utf-8'
        return res.read().decode(charset, errors='ignore')


def fetch_stylesheets(html, base_url, limit=6):
    """Resolve and fetch up to `limit` linked stylesheets."""
    css = ''
    hrefs = re.findall(r'<link[^>]+rel=["\']?stylesheet["\']?[^>]*>', html, re.I)
    found = []
    for tag in hrefs:
        m = re.search(r'href=["\']([^"\']+)["\']', tag, re.I)
        if m:
            found.append(urljoin(base_url, m.group(1)))
    for sheet_url in found[:limit]:
        try:
            css += '\n' + fetch(sheet_url, timeout=6)
        except Exception:
            continue
    return css


# ── Extraction ─────────────────────────────────────────────
def extract_colors_weighted(*sources):
    hex_pattern = re.compile(r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b')
    scores = Counter()
    for content in sources:
        if not content:
            continue
        # CSS custom properties referencing color (weight 6)
        for val in re.findall(r'--[\w-]*(?:color|brand|primary|accent|theme)[\w-]*\s*:\s*(#[A-Fa-f0-9]{3,6})', content, re.I):
            c = clean_hex(val)
            if is_brand_hue(c):
                scores[c] += 6
        # theme-color meta (weight 12)
        for val in re.findall(r'<meta[^>]*theme-color[^>]*content=["\'](#[A-Fa-f0-9]{3,6})["\']', content, re.I):
            c = clean_hex(val)
            if is_brand_hue(c):
                scores[c] += 12
        # everything else (weight 1)
        for val in hex_pattern.findall(content):
            c = clean_hex('#' + val)
            if is_brand_hue(c):
                scores[c] += 1
    # Rank by frequency AND vividness so a saturated brand hue wins over a
    # merely-common dark navy/grey that slipped past the neutral filter.
    ranked = sorted(
        scores.items(),
        key=lambda kv: kv[1] * (1 + saturation_spread(kv[0]) / 96.0),
        reverse=True
    )
    return [c for c, _ in ranked[:8]]


def detect_niche(url, html):
    # Scan the URL plus the full raw markup (class names, links and metadata
    # frequently carry the strongest niche signal on JS-rendered pages).
    text = (url + ' ' + html[:200000]).lower()
    scores = {}
    for niche, words in NICHE_KEYWORDS.items():
        total = 0
        for w in words:
            # word-boundary match so 'med' won't match 'commerce'
            total += len(re.findall(r'(?<![a-z])' + re.escape(w) + r'(?![a-z])', text))
        scores[niche] = total
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else DEFAULT_NICHE


def strip_tags(s):
    # Replace tags with a space so inline spans don't fuse adjacent words.
    text = unescape(re.sub(r'<[^>]+>', ' ', s))
    return re.sub(r'\s+', ' ', text).strip()


def extract_entities(html, domain=''):
    entities = {'name': '', 'usp': '', 'services': []}
    if not html:
        return entities

    domain_token = re.sub(r'[^a-z0-9]', '', domain.lower())
    GENERIC = {'home', 'homepage', 'welcome', 'index', 'main', 'untitled', 'home page'}

    m = re.search(r'<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\'](.*?)["\']', html, re.I)
    if m and m.group(1).strip() and m.group(1).strip().lower() not in GENERIC:
        entities['name'] = strip_tags(m.group(1))
    else:
        m = re.search(r'<title[^>]*>(.*?)</title>', html, re.I | re.S)
        if m:
            raw_title = strip_tags(m.group(1))
            segments = [s.strip() for s in re.split(r'[|\u2013\u2014\-:\u00b7]', raw_title) if s.strip()]
            candidates = [s for s in segments if s.lower() not in GENERIC] or segments

            def brand_score(seg):
                token = re.sub(r'[^a-z0-9]', '', seg.lower())
                # Strong preference for the segment that matches the domain,
                # then for shorter (brand names beat marketing taglines).
                matches_domain = bool(domain_token) and (token in domain_token or domain_token in token)
                return (1 if matches_domain else 0, -len(seg.split()))

            if candidates:
                entities['name'] = max(candidates, key=brand_score)

    m = (re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', html, re.I | re.S)
         or re.search(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\'](.*?)["\']', html, re.I | re.S))
    if m:
        entities['usp'] = strip_tags(m.group(1))

    # Generic navigation / CTA headings that are not real service offerings.
    NOISE = re.compile(
        r'^(our |the |explore|view all|see all|learn more|get started|contact|about'
        r'|home|menu|services|why |how |faq|testimonial|review|blog|news|sign in|log in)',
        re.I
    )
    headings = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', html, re.I | re.S)
    seen = set()
    for h in headings:
        t = strip_tags(h)
        key = t.lower()
        if 3 < len(t) < 60 and key not in seen and not NOISE.match(t):
            seen.add(key)
            entities['services'].append(t)
        if len(entities['services']) >= 6:
            break
    return entities


def build_palette(niche_key, brand_colors):
    """Curated niche palette, with brand identity injected where legible."""
    base = dict(NICHES[niche_key]['palette'])
    if brand_colors:
        brand = brand_colors[0]
        accent = lighten_for_contrast(brand, base['bg'], target=3.0)
        base['accent'] = accent
        base['primary'] = darken(brand, 0.5)
        base['line'] = 'rgba(255,255,255,0.10)'
    return base


def main():
    target_url = sys.argv[1].strip() if len(sys.argv) > 1 else ''
    industry_hint = sys.argv[2].strip().lower() if len(sys.argv) > 2 else ''
    firecrawl_key = os.environ.get('FIRECRAWL_API_KEY')

    html = ''
    css = ''
    niche_key = industry_hint if industry_hint in NICHES else ''

    if target_url:
        if not target_url.startswith('http'):
            target_url = 'https://' + target_url
        try:
            print('[*] Fetching target page...', file=sys.stderr)
            html = fetch(target_url)
            print('[*] Fetching linked stylesheets...', file=sys.stderr)
            css = fetch_stylesheets(html, target_url)
        except Exception as e:
            print(f'[!] Fetch error: {e}', file=sys.stderr)

    if not niche_key:
        niche_key = detect_niche(target_url, html) if html else DEFAULT_NICHE

    domain = urlparse(target_url).netloc.replace('www.', '') if target_url else ''
    brand_colors = extract_colors_weighted(html, css)
    palette = build_palette(niche_key, brand_colors)
    entities = extract_entities(html, domain)

    # Fill identity gaps from the niche bible so downstream copy is never blank.
    niche = NICHES[niche_key]
    if not entities['name']:
        entities['name'] = domain.split('.')[0].title() if domain else niche['label']
    if not entities['usp']:
        entities['usp'] = niche['hero']['subheadline']

    bible = {
        'niche': niche_key,
        'detected_industry': niche_key,
        'niche_label': niche['label'],
        'palette': palette,
        'source_colors': brand_colors[:5],
        'brand_entities': entities,
        'extraction': {
            'used_firecrawl': bool(firecrawl_key),
            'stylesheets_scanned': bool(css),
            'brand_color_found': bool(brand_colors)
        }
    }

    output_path = os.path.join(os.getcwd(), 'brand_colors.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(bible, f, indent=2)

    print(f"[\u2713] Brand Bible: niche={niche_key} name=\"{entities['name']}\" "
          f"accent={palette['accent']} colors_found={len(brand_colors)}", file=sys.stderr)
    print(json.dumps(bible))


if __name__ == '__main__':
    main()
