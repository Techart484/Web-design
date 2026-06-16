#!/usr/bin/env python3
"""
Autonomous Web Designer Engine — Deep Brand & CSS Extractor (v2 FIXED)
FIX #9: Expanded neutral color filter list
FIX: Added LinkedIn/OG meta color extraction
FIX: Better frequency weighting for CSS vars vs inline styles
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

# FIX #9: Comprehensive neutral/layout color filter
NEUTRAL_COLORS = {
    # Pure white/black extremes
    '#ffffff', '#000000', '#fffffe', '#000001',
    # Near-whites
    '#fafafa', '#f9f9f9', '#f8f8f8', '#f7f7f7', '#f5f5f5', '#f4f4f4', '#f3f4f6',
    '#eeeeee', '#ededed', '#ebebeb', '#e8e8e8', '#e5e7eb', '#e4e4e4', '#e0e0e0',
    # Near-blacks
    '#0a0a0a', '#0b0b0b', '#0c0c0c', '#111111', '#111827', '#121212', '#131313',
    '#141414', '#151515', '#161616', '#171717', '#181818', '#1a1a1a', '#1b1b1b',
    '#1c1c1c', '#1d1d1d', '#1e1e1e', '#1f1f1f', '#202020', '#212121', '#222222',
    # Mid grays
    '#333333', '#3d3d3d', '#404040', '#444444', '#4a4a4a', '#555555', '#5a5a5a',
    '#666666', '#6b7280', '#737373', '#777777', '#7f7f7f', '#808080', '#888888',
    '#8a8a8a', '#8c8c8c', '#909090', '#999999', '#9ca3af', '#a0a0a0', '#aaaaaa',
    '#ababab', '#b0b0b0', '#b5b5b5', '#bbbbbb', '#bdbdbd', '#c0c0c0', '#c4c4c4',
    '#cccccc', '#d1d1d1', '#d4d4d4', '#d9d9d9', '#dddddd', '#dedede', '#dfdfdf',
}

def clean_hex(hex_val):
    """Normalize hex color string to 6-char lowercase."""
    hex_val = hex_val.strip()
    if not hex_val.startswith('#'):
        hex_val = '#' + hex_val
    if len(hex_val) == 4:  # #FFF -> #FFFFFF
        hex_val = '#' + ''.join(c * 2 for c in hex_val[1:])
    result = hex_val[:7].lower()
    return result

def is_valid_brand_color(hex_val):
    """Returns True if this is likely a real brand color (not neutral/layout)."""
    return hex_val not in NEUTRAL_COLORS

def extract_colors_weighted(html_content):
    """
    Multi-pass color extraction with weighted frequency scoring.
    CSS custom properties (vars) get 3x weight — they are intentional brand tokens.
    Inline style attributes get 2x weight.
    General document text gets 1x weight.
    """
    hex_pattern = re.compile(r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b')
    css_var_pattern = re.compile(
        r'--[a-zA-Z0-9_-]*(?:color|primary|secondary|accent|brand|theme)[a-zA-Z0-9_-]*\s*:\s*(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3})',
        re.IGNORECASE
    )

    color_scores = Counter()

    # Pass 1: CSS Custom Properties (3x weight — intentional design tokens)
    for val in css_var_pattern.findall(html_content):
        hex_val = clean_hex(val)
        if is_valid_brand_color(hex_val):
            color_scores[hex_val] += 3

    # Pass 2: <meta> OG/theme-color tags (3x weight — explicitly declared brand)
    meta_color_pattern = re.compile(
        r'<meta[^>]*(?:name|property)=["\'](?:theme-color|og:image:url)["\'][^>]*content=["\'](#[A-Fa-f0-9]{6})["\']',
        re.IGNORECASE
    )
    theme_color_pattern = re.compile(r'<meta[^>]*content=["\'](#[A-Fa-f0-9]{6})["\'][^>]*(?:theme-color)[^>]*>', re.IGNORECASE)
    for val in meta_color_pattern.findall(html_content) + theme_color_pattern.findall(html_content):
        hex_val = clean_hex(val)
        if is_valid_brand_color(hex_val):
            color_scores[hex_val] += 4  # Highest weight — explicit brand declaration

    # Pass 3: Embedded <style> blocks (2x weight)
    style_tags = re.findall(r'<style[^>]*>(.*?)</style>', html_content, re.DOTALL | re.IGNORECASE)
    for tag_content in style_tags:
        for hex_val in hex_pattern.findall(tag_content):
            c = clean_hex('#' + hex_val)
            if is_valid_brand_color(c):
                color_scores[c] += 2

    # Pass 4: Inline style attributes (2x weight)
    inline_styles = re.findall(r'style\s*=\s*["\']([^"\']+)["\']', html_content, re.IGNORECASE)
    for style_str in inline_styles:
        for hex_val in hex_pattern.findall(style_str):
            c = clean_hex('#' + hex_val)
            if is_valid_brand_color(c):
                color_scores[c] += 2

    # Pass 5: General document fallback (1x weight)
    if not color_scores:
        for hex_val in hex_pattern.findall(html_content):
            c = clean_hex('#' + hex_val)
            if is_valid_brand_color(c):
                color_scores[c] += 1

    # Sort by weighted score, return top colors
    sorted_colors = [color for color, _ in color_scores.most_common(10)]
    return sorted_colors

def detect_industry(url, html_content=''):
    """Detect industry type from URL and page content keywords."""
    text = (url + ' ' + html_content[:5000]).lower()
    if re.search(r'clinic|dental|health|med|doctor|hospital|pharma|care|patient', text):
        return 'medical'
    if re.search(r'construct|roof|build|contrac|general contractor|remodel', text):
        return 'construction'
    if re.search(r'law|legal|attorney|counsel|partner|tax|litigation', text):
        return 'legal'
    if re.search(r'fit|gym|crossfit|sport|yoga|train|muscle|workout', text):
        return 'fitness'
    if re.search(r'saas|software|app|cloud|api|tech|startup|platform', text):
        return 'saas'
    return 'default'

def main():
    target_url = sys.argv[1] if len(sys.argv) > 1 else ''
    industry_type = sys.argv[2].lower() if len(sys.argv) > 2 else 'default'

    print(f"[*] Brand Bible Extraction initiated for: '{target_url}' (industry hint: '{industry_type}')", file=sys.stderr)

    theme = None
    detected_industry = industry_type

    if target_url:
        if not target_url.startswith(('http://', 'https://')):
            target_url = 'https://' + target_url

        try:
            print(f"[*] Fetching brand payload from: {target_url}", file=sys.stderr)
            req = urllib.request.Request(
                target_url,
                headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml',
                    'Accept-Language': 'en-US,en;q=0.9'
                }
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                charset = response.headers.get_content_charset() or 'utf-8'
                html = response.read().decode(charset, errors='ignore')

                # Detect industry from actual page content
                if industry_type == 'default':
                    detected_industry = detect_industry(target_url, html)
                    print(f"[✓] Auto-detected industry: {detected_industry}", file=sys.stderr)

                colors = extract_colors_weighted(html)
                print(f"[✓] Top weighted brand colors found: {colors[:5]}", file=sys.stderr)

                if len(colors) >= 2:
                    theme = {
                        'primary': colors[0],
                        'accent': colors[1],
                        'secondary': colors[2] if len(colors) > 2 else colors[0],
                        'bg': '#06050b'
                    }
                elif len(colors) == 1:
                    print(f"[!] Single brand color found: {colors[0]}. Augmenting with industry accents.", file=sys.stderr)
                    fallback = INDUSTRY_MATRICES.get(detected_industry, INDUSTRY_MATRICES['default'])
                    theme = {
                        'primary': colors[0],
                        'accent': fallback['accent'],
                        'secondary': fallback['secondary'],
                        'bg': fallback['bg']
                    }
                else:
                    print("[!] No distinctive brand colors found — deploying industry matrix.", file=sys.stderr)

        except (URLError, HTTPError, TimeoutError) as err:
            print(f"[WARNING] Network fetch failed: {str(err)}", file=sys.stderr)
            print("[*] Deploying industry fallback matrix...", file=sys.stderr)
        except Exception as err:
            print(f"[WARNING] Unexpected scraper error: {str(err)}", file=sys.stderr)

    # Fallback: deploy industry matrix
    if not theme:
        key = detected_industry if detected_industry in INDUSTRY_MATRICES else 'default'
        theme = INDUSTRY_MATRICES[key]
        print(f"[✓] Deployed '{key}' industry matrix: {theme}", file=sys.stderr)

    # Append detected industry to output
    theme['detected_industry'] = detected_industry

    # Write to brand_colors.json
    output_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'brand_colors.json')
    try:
        with open(output_path, 'w') as f:
            json.dump(theme, f, indent=2)
        print(f"[✓] Brand Bible written to: {output_path}", file=sys.stderr)
    except IOError as err:
        print(f"[ERROR] Failed to write brand_colors.json: {str(err)}", file=sys.stderr)

    # Output JSON to stdout for pipeline consumption
    print(json.dumps(theme))

if __name__ == '__main__':
    main()
