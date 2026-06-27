#!/usr/bin/env python3
"""
Autonomous Web Designer Engine — Hardened Brand & CSS Extractor (v2.1)
FIX: Robust color filtering and weighting
FIX: Improved meta/OG tag scanning
FIX: Relative path resolution for JSON output
"""

import sys
import os
import json
import re
import urllib.request
from urllib.error import URLError, HTTPError
from collections import Counter

# Industry Fallback Matrices
INDUSTRY_MATRICES = {
    'construction': {'primary': '#1E3A8A', 'accent': '#F97316', 'secondary': '#1E293B', 'bg': '#030712'},
    'medical':      {'primary': '#0D9488', 'accent': '#38BDF8', 'secondary': '#0F172A', 'bg': '#040B0E'},
    'legal':        {'primary': '#1E293B', 'accent': '#D97706', 'secondary': '#475569', 'bg': '#070A13'},
    'fitness':      {'primary': '#0F0F10', 'accent': '#DC2626', 'secondary': '#1C1917', 'bg': '#080808'},
    'saas':         {'primary': '#8B5CF6', 'accent': '#06B6D4', 'secondary': '#F43F5E', 'bg': '#06050B'},
    'default':      {'primary': '#8B5CF6', 'accent': '#06B6D4', 'secondary': '#F43F5E', 'bg': '#06050B'}
}

# Neutral/Layout color filter (expanded)
NEUTRAL_COLORS = {
    '#ffffff', '#000000', '#fafafa', '#f9f9f9', '#f8f8f8', '#f5f5f5', '#f3f4f6',
    '#eeeeee', '#e5e7eb', '#e0e0e0', '#0a0a0a', '#111111', '#111827', '#121212',
    '#333333', '#444444', '#666666', '#888888', '#999999', '#cccccc', '#dddddd'
}

def clean_hex(hex_val):
    hex_val = hex_val.strip()
    if not hex_val.startswith('#'):
        hex_val = '#' + hex_val
    if len(hex_val) == 4:
        hex_val = '#' + ''.join(c * 2 for c in hex_val[1:])
    return hex_val[:7].lower()

def is_valid_brand_color(hex_val):
    return hex_val not in NEUTRAL_COLORS and len(hex_val) == 7

def extract_colors_weighted(html_content):
    hex_pattern = re.compile(r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b')
    color_scores = Counter()

    # Pass 1: CSS Vars (Weight 5)
    css_vars = re.findall(r'--[a-zA-Z0-9-]*color[a-zA-Z0-9-]*\s*:\s*(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})', html_content, re.I)
    for val in css_vars:
        c = clean_hex(val)
        if is_valid_brand_color(c): color_scores[c] += 5

    # Pass 2: Meta tags (Weight 10)
    meta = re.findall(r'<meta[^>]*(?:theme-color|og:image:url)[^>]*content=["\'](#[A-Fa-f0-9]{6})["\']', html_content, re.I)
    for val in meta:
        c = clean_hex(val)
        if is_valid_brand_color(c): color_scores[c] += 10

    # Pass 3: Style tags & inline (Weight 1)
    for hex_val in hex_pattern.findall(html_content):
        c = clean_hex('#' + hex_val)
        if is_valid_brand_color(c): color_scores[c] += 1

    return [color for color, _ in color_scores.most_common(5)]

def detect_industry(url, html_content=''):
    text = (url + ' ' + html_content[:10000]).lower()
    keywords = {
        'medical': r'clinic|dental|health|med|doctor|hospital|pharma|care',
        'construction': r'construct|roof|build|contrac|remodel|plumb',
        'legal': r'law|legal|attorney|counsel|lawyer|justice',
        'fitness': r'fit|gym|crossfit|sport|yoga|train|muscle',
        'saas': r'saas|software|app|cloud|api|tech|platform'
    }
    for ind, pattern in keywords.items():
        if re.search(pattern, text): return ind
    return 'default'

def extract_via_firecrawl(url, api_key):
    """Fallback to Firecrawl if API key is present."""
    try:
        import http.client
        conn = http.client.HTTPSConnection("api.firecrawl.dev")
        payload = json.dumps({"url": url, "mode": "scrape", "onlyMainContent": True})
        headers = {'Content-Type': 'application/json', 'Authorization': f'Bearer {api_key}'}
        conn.request("POST", "/v0/scrape", payload, headers)
        res = conn.getresponse()
        data = res.read().decode("utf-8")
        result = json.loads(data)
        if result.get('success'):
            return result['data'].get('content', '')
    except: pass
    return None

def extract_brand_entities(html):
    """Extract Company Name, USP, and Features from HTML."""
    entities = {
        'name': 'Default Professional',
        'usp': 'Next-Generation Digital Excellence',
        'features': []
    }

    if not html:
        return entities

    # Extract Name (from <title> or <h1>)
    title_match = re.search(r'<title>(.*?)</title>', html, re.I | re.S)
    if title_match:
        title_text = title_match.group(1).split('|')[0].split('-')[0].strip()
        if title_text: entities['name'] = title_text

    # Extract USP (from meta description or first <h2>)
    desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\'](.*?)["\']', html, re.I | re.S)
    if desc_match:
        entities['usp'] = desc_match.group(1).strip()
    else:
        h2_match = re.search(r'<h2[^>]*>(.*?)</h2>', html, re.I | re.S)
        if h2_match:
            entities['usp'] = re.sub('<[^<]+?>', '', h2_match.group(1)).strip()

    # Extract Features (look for lists or groups of h3/h4)
    # This is a heuristic: looking for <li> items in sections that might be "features"
    feature_matches = re.findall(r'<h3[^>]*>(.*?)</h3>', html, re.I | re.S)
    if feature_matches:
        entities['features'] = [re.sub('<[^<]+?>', '', f).strip() for f in feature_matches[:6] if len(f.strip()) > 3]

    if not entities['features']:
        li_matches = re.findall(r'<li>(.*?)</li>', html, re.I | re.S)
        entities['features'] = [re.sub('<[^<]+?>', '', f).strip() for f in li_matches[:6] if 10 < len(f.strip()) < 100]

    return entities

def main():
    target_url = sys.argv[1] if len(sys.argv) > 1 else ''
    industry_hint = sys.argv[2].lower() if len(sys.argv) > 2 else 'default'
    firecrawl_key = os.environ.get('FIRECRAWL_API_KEY')

    theme = None
    detected_industry = industry_hint
    entities = {
        'name': 'Default Professional',
        'usp': 'Next-Generation Digital Excellence',
        'features': []
    }

    if target_url:
        if not target_url.startswith('http'): target_url = 'https://' + target_url
        try:
            html = None
            if firecrawl_key:
                print("[*] Firecrawl API detected. Attempting deep scrape...")
                html = extract_via_firecrawl(target_url, firecrawl_key)

            if not html:
                print("[*] Falling back to local scraper...")
                req = urllib.request.Request(target_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req, timeout=8) as res:
                    html = res.read().decode('utf-8', errors='ignore')

            if html:
                if industry_hint == 'default': detected_industry = detect_industry(target_url, html)
                colors = extract_colors_weighted(html)
                if colors:
                    theme = {
                        'primary': colors[0],
                        'accent': colors[1] if len(colors) > 1 else INDUSTRY_MATRICES[detected_industry]['accent'],
                        'secondary': colors[2] if len(colors) > 2 else colors[0],
                        'bg': '#06050b'
                    }
                entities = extract_brand_entities(html)
        except Exception as e:
            print(f"[!] Extraction error: {e}")

    if not theme:
        theme = INDUSTRY_MATRICES.get(detected_industry, INDUSTRY_MATRICES['default'])

    theme['detected_industry'] = detected_industry
    theme['brand_entities'] = entities

    output_path = os.path.join(os.getcwd(), 'brand_colors.json')
    with open(output_path, 'w') as f: json.dump(theme, f, indent=2)
    print(json.dumps(theme))

if __name__ == '__main__': main()
