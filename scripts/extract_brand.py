#!/usr/bin/env python3
"""
Web Design Automation Factory - Deep Brand & CSS Extractor
Scrapes target URLs to isolate brand design tokens. Falls back safely to industry matrices on error.
"""

import sys
import os
import json
import re
import urllib.request
from urllib.error import URLError, HTTPError

# Industry Fallback Matrices
INDUSTRY_MATRICES = {
    'construction': {
        'primary': '#1E3A8A', # Deep Blue
        'accent': '#F97316',  # Safety Orange
        'secondary': '#1E293B',
        'bg': '#030712'
    },
    'medical': {
        'primary': '#0D9488', # Teal
        'accent': '#38BDF8',  # Sky Blue
        'secondary': '#0F172A',
        'bg': '#040B0E'
    },
    'legal': {
        'primary': '#1E293B', # Slate
        'accent': '#D97706',  # Amber
        'secondary': '#475569',
        'bg': '#070A13'
    },
    'fitness': {
        'primary': '#0F0F10', # Charcoal Dark
        'accent': '#DC2626',  # Aggressive Red
        'secondary': '#1C1917',
        'bg': '#080808'
    },
    'default': {
        'primary': '#8B5CF6', # Neon Purple
        'accent': '#06B6D4',  # Bright Cyan
        'secondary': '#F43F5E',
        'bg': '#06050B'
    }
}

def clean_color(hex_val):
    """Formats and ensures valid hex string."""
    hex_val = hex_val.strip()
    if not hex_val.startswith('#'):
        hex_val = '#' + hex_val
    if len(hex_val) == 4: # Short hex #FFF -> #FFFFFF
        hex_val = '#' + ''.join(c*2 for c in hex_val[1:])
    return hex_val[:7].lower()

def extract_colors(html_content):
    """
    Analyzes page markup, embedded style tags, style attributes, and CSS variables
    to determine dominant brand colors.
    """
    # Regex definitions
    hex_pattern = re.compile(r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b')
    # CSS Custom Property (Variables): e.g., --color-primary: #8b5cf6
    css_var_pattern = re.compile(r'--[a-zA-Z0-9_-]+\s*:\s*(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}|rgba?\([^)]+\))')
    
    extracted_hexes = []

    # 1. Parse CSS Custom Properties (Variables)
    vars_found = css_var_pattern.findall(html_content)
    for val in vars_found:
        hex_match = hex_pattern.search(val)
        if hex_match:
            extracted_hexes.append(clean_color(hex_match.group(0)))

    # 2. Extract from embedded style tags <style>...</style>
    style_tags = re.findall(r'<style[^>]*>(.*?)</style>', html_content, re.DOTALL | re.IGNORECASE)
    for tag_content in style_tags:
        for hex_val in hex_pattern.findall(tag_content):
            extracted_hexes.append(clean_color('#' + hex_val))

    # 3. Extract from inline style attributes: style="..."
    inline_styles = re.findall(r'style\s*=\s*["\']([^"\']+)["\']', html_content, re.IGNORECASE)
    for style_str in inline_styles:
        for hex_val in hex_pattern.findall(style_str):
            extracted_hexes.append(clean_color('#' + hex_val))

    # 4. Fallback search inside the general document text body
    if not extracted_hexes:
        for hex_val in hex_pattern.findall(html_content):
            extracted_hexes.append(clean_color('#' + hex_val))

    # Frequency analysis
    color_freq = {}
    for color in extracted_hexes:
        if color in ['#ffffff', '#000000', '#0a0a0a', '#171717', '#f3f4f6', '#e5e7eb']:
            continue # Filter out absolute white/black/gray layout tones
        color_freq[color] = color_freq.get(color, 0) + 1

    sorted_colors = sorted(color_freq.items(), key=lambda x: x[1], reverse=True)
    return [c[0] for c in sorted_colors]

def main():
    target_url = sys.argv[1] if len(sys.argv) > 1 else ''
    industry_type = sys.argv[2].lower() if len(sys.argv) > 2 else 'default'

    print(f"[*] Deep Brand Scan Initiated for URL: '{target_url}' (Industry Category: '{industry_type}')", file=sys.stderr)

    theme = None

    if target_url:
        # Pre-process url schema
        if not target_url.startswith(('http://', 'https://')):
            target_url = 'https://' + target_url

        try:
            print(f"[*] Requesting brand data payload from: {target_url}", file=sys.stderr)
            req = urllib.request.Request(
                target_url, 
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            )
            # Safe 8-second network connection timeouts
            with urllib.request.urlopen(req, timeout=8) as response:
                charset = response.headers.get_content_charset() or 'utf-8'
                html = response.read().decode(charset, errors='ignore')
                
                colors = extract_colors(html)
                if len(colors) >= 2:
                    print(f"[✓] Scrape complete. Identified dominant colors: {colors[:3]}", file=sys.stderr)
                    theme = {
                        'primary': colors[0],
                        'accent': colors[1],
                        'secondary': colors[2] if len(colors) > 2 else colors[0],
                        'bg': '#06050b' # Default elegant dark canvas base
                    }
                elif len(colors) == 1:
                    print(f"[!] Scrape yielded single color profile: {colors[0]}. Merging preset accents.", file=sys.stderr)
                    theme = {
                        'primary': colors[0],
                        'accent': '#06b6d4', # Cyan default
                        'secondary': '#f43f5e',
                        'bg': '#06050b'
                    }
                else:
                    print("[!] No distinct custom brand colors found. Activating fallback matrix.", file=sys.stderr)
        except (URLError, HTTPError, TimeoutError, Exception) as err:
            # Absolute recovery bridge: Log a clean warning on connection loss, timeout or 404
            print(f"[WARNING] Scraper connection sequence failed: {str(err)}", file=sys.stderr)
            print("[*] Automatically deploying safe industry fallback matrix...", file=sys.stderr)

    # 4. Deploy fallback matrix if scrape failed, URL dead, or missing
    if not theme:
        industry_key = industry_type if industry_type in INDUSTRY_MATRICES else 'default'
        theme = INDUSTRY_MATRICES[industry_key]
        print(f"[✓] Deployed industry themes preset for '{industry_key}': {theme}", file=sys.stderr)

    # Write output to brand_colors.json in local context
    output_path = 'brand_colors.json'
    try:
        with open(output_path, 'w') as out_file:
            json.dump(theme, out_file, indent=2)
        print(f"[✓] Extracted parameters stored successfully in: {output_path}", file=sys.stderr)
    except IOError as err:
        print(f"[ERROR] Failed to save JSON parameters: {str(err)}", file=sys.stderr)

    # Output to stdout as well
    print(json.dumps(theme))

if __name__ == '__main__':
    main()
