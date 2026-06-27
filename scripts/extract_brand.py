#!/usr/bin/env python3
"""
Autonomous Web Designer Engine — Brand Bible Extractor (v4.0)
Updated for multi-page crawling and enhanced entity extraction.
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

# ── Utilities ──────────────────────────────────────────────
def clean_hex(hex_val):
    hex_val = hex_val.strip().lower()
    if not hex_val.startswith('#'): hex_val = '#' + hex_val
    if len(hex_val) == 4: hex_val = '#' + ''.join(c * 2 for c in hex_val[1:])
    return hex_val[:7]

def hex_to_rgb(hex_val):
    h = hex_val.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    return '#%02x%02x%02x' % tuple(max(0, min(255, int(c))) for c in rgb)

def saturation_spread(hex_val):
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
    return (len(hex_val) == 7 and hex_val not in NEUTRAL_COLORS and saturation_spread(hex_val) >= 28)

def lighten_for_contrast(hex_val, bg_hex, target=3.0):
    rgb = list(hex_to_rgb(hex_val))
    for _ in range(20):
        if contrast_ratio(rgb_to_hex(rgb), bg_hex) >= target: break
        rgb = [c + (255 - c) * 0.12 for c in rgb]
    return rgb_to_hex(rgb)

def darken(hex_val, factor=0.45):
    return rgb_to_hex([c * factor for c in hex_to_rgb(hex_val)])

def strip_tags(s):
    text = unescape(re.sub(r'<[^>]+>', ' ', s))
    return re.sub(r'\s+', ' ', text).strip()

# ── Network ────────────────────────────────────────────────
def fetch(url, timeout=8):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (compatible; BrandBible/4.0)'})
        with urllib.request.urlopen(req, timeout=timeout) as res:
            charset = res.headers.get_content_charset() or 'utf-8'
            return res.read().decode(charset, errors='ignore')
    except Exception as e:
        print(f'[!] Fetch error ({url}): {e}', file=sys.stderr)
        return ''

def get_links(html, base_url):
    links = re.findall(r'href=["\']([^"\']+)["\']', html, re.I)
    valid = set()
    base_domain = urlparse(base_url).netloc
    for l in links:
        full = urljoin(base_url, l)
        parsed = urlparse(full)
        if parsed.netloc == base_domain and parsed.path.endswith(('.html', '', '/')):
            valid.add(full.split('#')[0].rstrip('/'))
    return valid

# ── Extraction ─────────────────────────────────────────────
def extract_colors_weighted(contents):
    hex_pattern = re.compile(r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b')
    scores = Counter()
    for content in contents:
        if not content: continue
        for val in re.findall(r'--[\w-]*(?:color|brand|primary|accent|theme)[\w-]*\s*:\s*(#[A-Fa-f0-9]{3,6})', content, re.I):
            c = clean_hex(val); scores[c] += 6 if is_brand_hue(c) else 0
        for val in re.findall(r'<meta[^>]*theme-color[^>]*content=["\'](#[A-Fa-f0-9]{3,6})["\']', content, re.I):
            c = clean_hex(val); scores[c] += 12 if is_brand_hue(c) else 0
        for val in hex_pattern.findall(content):
            c = clean_hex('#' + val); scores[c] += 1 if is_brand_hue(c) else 0

    ranked = sorted(scores.items(), key=lambda kv: kv[1] * (1 + saturation_spread(kv[0]) / 96.0), reverse=True)
    return [c for c, _ in ranked[:8]]

def detect_niche(text):
    text = text.lower()
    scores = {}
    for niche, words in NICHE_KEYWORDS.items():
        total = 0
        for w in words:
            total += len(re.findall(r'(?<![a-z])' + re.escape(w) + r'(?![a-z])', text))
        scores[niche] = total
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else DEFAULT_NICHE

def extract_entities(html_pages, domain=''):
    entities = {'name': '', 'usp': '', 'services': [], 'images': []}
    domain_token = re.sub(r'[^a-z0-9]', '', domain.lower())
    GENERIC = {'home', 'homepage', 'welcome', 'index', 'main', 'untitled', 'home page'}

    # Combine text for analysis
    all_html = " ".join(html_pages)

    # Name extraction (prefer first page / index)
    if html_pages:
        first = html_pages[0]
        m = re.search(r'<meta[^>]+property=["\']og:site_name["\'][^>]+content=["\'](.*?)["\']', first, re.I)
        if m and m.group(1).strip() and m.group(1).strip().lower() not in GENERIC:
            entities['name'] = strip_tags(m.group(1))
        else:
            m = re.search(r'<title[^>]*>(.*?)</title>', first, re.I | re.S)
            if m:
                raw_title = strip_tags(m.group(1))
                segments = [s.strip() for s in re.split(r'[|\u2013\u2014\-:\u00b7]', raw_title) if s.strip()]
                candidates = [s for s in segments if s.lower() not in GENERIC] or segments
                if candidates:
                    entities['name'] = max(candidates, key=lambda s: (1 if domain_token in re.sub(r'[^a-z0-9]', '', s.lower()) else 0, -len(s.split())))

    # USP
    m = (re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']', all_html, re.I | re.S)
         or re.search(r'<meta[^>]+property=["\']og:description["\'][^>]+content=["\'](.*?)["\']', all_html, re.I | re.S))
    if m: entities['usp'] = strip_tags(m.group(1))

    # Services
    NOISE = re.compile(r'^(our |the |explore|view all|see all|learn more|get started|contact|about|home|menu|services|why |how |faq|testimonial|review|blog|news|sign in|log in)', re.I)
    seen_services = set()
    for html in html_pages:
        headings = re.findall(r'<h[23][^>]*>(.*?)</h[23]>', html, re.I | re.S)
        for h in headings:
            t = strip_tags(h)
            if 3 < len(t) < 60 and t.lower() not in seen_services and not NOISE.match(t):
                seen_services.add(t.lower())
                entities['services'].append(t)
            if len(entities['services']) >= 12: break

    # Images
    img_urls = re.findall(r'<img[^>]+src=["\']([^"\']+\.(?:jpg|jpeg|png|webp|svg))["\']', all_html, re.I)
    entities['images'] = list(set(img_urls))[:20]

    return entities

def build_palette(niche_key, brand_colors):
    base = dict(NICHES[niche_key]['palette'])
    if brand_colors:
        brand = brand_colors[0]
        base['accent'] = lighten_for_contrast(brand, base['bg'], target=3.0)
        base['primary'] = darken(brand, 0.5)
        base['line'] = 'rgba(255,255,255,0.10)'
    return base

# ── Main ───────────────────────────────────────────────────
def main():
    target_url = sys.argv[1].strip() if len(sys.argv) > 1 else ''
    industry_hint = sys.argv[2].strip().lower() if len(sys.argv) > 2 else ''

    html_pages = []
    crawled_urls = set()

    if target_url:
        if not target_url.startswith('http'): target_url = 'https://' + target_url
        print(f'[*] Crawling {target_url}...', file=sys.stderr)

        main_html = fetch(target_url)
        if main_html:
            html_pages.append(main_html)
            crawled_urls.add(target_url.rstrip('/'))

            links = get_links(main_html, target_url)
            for link in list(links)[:5]: # Limit to 5 subpages
                if link not in crawled_urls:
                    print(f'[*] Fetching {link}...', file=sys.stderr)
                    sub_html = fetch(link)
                    if sub_html:
                        html_pages.append(sub_html)
                        crawled_urls.add(link)

    niche_key = industry_hint if industry_hint in NICHES else detect_niche(" ".join(html_pages))
    domain = urlparse(target_url).netloc.replace('www.', '') if target_url else ''

    brand_colors = extract_colors_weighted(html_pages)
    palette = build_palette(niche_key, brand_colors)
    entities = extract_entities(html_pages, domain)

    niche = NICHES[niche_key]
    if not entities['name']: entities['name'] = domain.split('.')[0].title() if domain else niche['label']
    if not entities['usp']: entities['usp'] = niche.get('hero', {}).get('subheadline', '')

    bible = {
        'niche': niche_key,
        'niche_label': niche['label'],
        'palette': palette,
        'brand_entities': entities,
        'crawl_stats': {'pages_crawled': len(html_pages), 'urls': list(crawled_urls)}
    }

    with open('brand_colors.json', 'w', encoding='utf-8') as f:
        json.dump(bible, f, indent=2)

    print(json.dumps(bible))

if __name__ == '__main__':
    main()
