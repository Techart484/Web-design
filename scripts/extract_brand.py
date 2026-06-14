#!/usr/bin/env python3
"""
Web Design Automation Factory - Comprehensive Metadata Extractor
Scrapes target URLs to extract complete brand metadata: business info, colors, typography, imagery, content, tech stack.
"""

import sys
import json
import re
import urllib.request
from urllib.error import URLError, HTTPError
from html import unescape
from html.parser import HTMLParser

INDUSTRY_MATRICES = {
    'construction': {'primary': '#1E3A8A', 'accent': '#F97316', 'secondary': '#1E293B', 'bg': '#030712'},
    'medical': {'primary': '#0D9488', 'accent': '#38BDF8', 'secondary': '#0F172A', 'bg': '#040B0E'},
    'legal': {'primary': '#1E293B', 'accent': '#D97706', 'secondary': '#475569', 'bg': '#070A13'},
    'fitness': {'primary': '#0F0F10', 'accent': '#DC2626', 'secondary': '#1C1917', 'bg': '#080808'},
    'default': {'primary': '#8B5CF6', 'accent': '#06B6D4', 'secondary': '#F43F5E', 'bg': '#06050B'}
}

def clean_color(hex_val):
    hex_val = hex_val.strip()
    if not hex_val.startswith('#'):
        hex_val = '#' + hex_val
    if len(hex_val) == 4:
        hex_val = '#' + ''.join(c*2 for c in hex_val[1:])
    return hex_val[:7].lower()

def decode_text(value):
    if not value or not isinstance(value, str):
        return ''
    # Recursively unescape until no more entities are found
    decoded = value
    while True:
        unescaped_once = unescape(decoded)
        if unescaped_once == decoded:
            break
        decoded = unescaped_once
    return re.sub(r'\s+', ' ', decoded.strip())

def strip_tags(value):
    if not value or not isinstance(value, str):
        return ''
    return re.sub(r'<[^>]+>', '', value)

def extract_link_texts(html_fragment):
    links = re.findall(r'<a[^>]*>(.*?)</a>', html_fragment, re.IGNORECASE | re.DOTALL)
    return [decode_text(strip_tags(link)) for link in links if decode_text(strip_tags(link))]

def extract_nav_links(html_content):
    navs = re.findall(r'<nav[^>]*>(.*?)</nav>', html_content, re.IGNORECASE | re.DOTALL)
    link_texts = []
    for nav in navs:
        link_texts.extend(extract_link_texts(nav))
    return link_texts

def extract_footer_links(html_content):
    footers = re.findall(r'<footer[^>]*>(.*?)</footer>', html_content, re.IGNORECASE | re.DOTALL)
    footer_groups = []
    for footer in footers:
        sections = re.findall(r'(<(?:div|section|ul)[^>]*>(?:.*?</(?:div|section|ul)>))', footer, re.IGNORECASE | re.DOTALL)
        if sections:
            for section in sections:
                texts = extract_link_texts(section)
                if texts:
                    footer_groups.append(texts)
        else:
            texts = extract_link_texts(footer)
            if texts:
                footer_groups.append(texts)
    return footer_groups

def extract_colors(html_content):
    hex_pattern = re.compile(r'#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})\b')
    css_var_pattern = re.compile(r'--[a-zA-Z0-9_-]+\s*:\s*(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}|rgba?\([^)]+\))')
    extracted_hexes = []

    vars_found = css_var_pattern.findall(html_content)
    for val in vars_found:
        hex_match = hex_pattern.search(val)
        if hex_match:
            extracted_hexes.append(clean_color(hex_match.group(0)))

    style_tags = re.findall(r'<style[^>]*>(.*?)</style>', html_content, re.DOTALL | re.IGNORECASE)
    for tag_content in style_tags:
        for hex_val in hex_pattern.findall(tag_content):
            extracted_hexes.append(clean_color('#' + hex_val))

    inline_styles = re.findall(r'style\s*=\s*["\']([^"\']+)["\']', html_content, re.IGNORECASE)
    for style_str in inline_styles:
        for hex_val in hex_pattern.findall(style_str):
            extracted_hexes.append(clean_color('#' + hex_val))

    if not extracted_hexes:
        for hex_val in hex_pattern.findall(html_content):
            extracted_hexes.append(clean_color('#' + hex_val))

    color_freq = {}
    for color in extracted_hexes:
        if color in ['#ffffff', '#000000', '#0a0a0a', '#171717', '#f3f4f6', '#e5e7eb']:
            continue
        color_freq[color] = color_freq.get(color, 0) + 1

    sorted_colors = sorted(color_freq.items(), key=lambda x: x[1], reverse=True)
    return [c[0] for c in sorted_colors]

def extract_business_info(html_content):
    """Extract business name, email, phone, address from HTML."""
    info = {}

    # Business name from title or h1
    title_match = re.search(r'<title[^>]*>(.*?)</title>', html_content, re.IGNORECASE | re.DOTALL)
    if title_match:
        info['business_name'] = decode_text(title_match.group(1))[:80]

    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_content, re.IGNORECASE | re.DOTALL)
    if h1_match and not info.get('business_name'):
        info['business_name'] = decode_text(strip_tags(h1_match.group(1)))[:80]

    # Meta description as tagline
    desc_match = re.search(r'<meta\s+name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', html_content, re.IGNORECASE)
    if desc_match:
        info['tagline'] = decode_text(desc_match.group(1))[:150]

    # Email extraction
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', html_content)
    if email_match:
        info['email'] = email_match.group(0)

    # Phone extraction
    phone_match = re.search(r'(\+?1[-.\s]?)?(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})', html_content)
    if phone_match:
        info['phone'] = phone_match.group(0).strip()

    # Address - look for common patterns
    address_match = re.search(r'(\d+\s+[A-Za-z0-9\s,.]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)[,\s]+[A-Za-z\s]+[,\s]+[A-Z]{2})', html_content, re.IGNORECASE)
    if address_match:
        info['address'] = decode_text(address_match.group(1))[:100]

    # Primary CTA text and URL
    cta_match = re.search(r'<(?:a|button)[^>]*(?:href=["\']([^"\']+)["\'])?[^>]*>([^<]+)</(?:a|button)>', html_content, re.IGNORECASE)
    if cta_match:
        info['cta_text'] = decode_text(cta_match.group(2))[:50]
        if cta_match.group(1):
            info['cta_url'] = cta_match.group(1)

    return info

def detect_business_model(html_content):
    lower_html = html_content.lower()
    if any(term in lower_html for term in ['subscription', 'membership', 'monthly plan', 'subscribe', 'recurring']):
        return 'subscription'
    if any(term in lower_html for term in ['wholesale', 'bulk order', 'reseller', 'distributor']):
        return 'wholesale'
    return 'ecommerce' if any(term in lower_html for term in ['cart', 'checkout', 'shop', 'add to cart', 'buy now', 'product', 'catalog', 'collection']) else 'direct'


def detect_category(html_content):
    """Detect site category (ecommerce, portfolio, local_business, saas, blog)."""
    lower_html = html_content.lower()
    confidence = 0.0
    category = 'default'

    nav_links = extract_nav_links(html_content)
    footer_groups = extract_footer_links(html_content)
    nav_text = ' '.join(nav_links).lower()
    footer_text = ' '.join([item for section in footer_groups for item in section]).lower()

    # E-commerce indicators
    ecommerce_keywords = ['product', 'cart', 'checkout', 'shop', 'buy', 'price', '$', 'add to cart', 'store', 'catalog', 'collection']
    ecommerce_score = sum(1 for kw in ecommerce_keywords if kw in lower_html or kw in nav_text or kw in footer_text)

    # Portfolio indicators
    portfolio_keywords = ['portfolio', 'project', 'case study', 'work', 'gallery', 'design', 'creative', 'agency']
    portfolio_score = sum(1 for kw in portfolio_keywords if kw in lower_html or kw in nav_text or kw in footer_text)

    # Local business indicators
    local_keywords = ['service', 'contact us', 'appointment', 'phone', 'address', 'hours', 'location', 'visit us', 'book now']
    local_score = sum(1 for kw in local_keywords if kw in lower_html or kw in nav_text or kw in footer_text)

    # SaaS indicators
    saas_keywords = ['feature', 'pricing', 'plan', 'trial', 'api', 'integration', 'dashboard', 'signup', 'subscribe']
    saas_score = sum(1 for kw in saas_keywords if kw in lower_html or kw in nav_text or kw in footer_text)

    # Blog indicators
    blog_keywords = ['article', 'blog', 'post', 'author', 'published', 'read more', 'category', 'news', 'insights']
    blog_score = sum(1 for kw in blog_keywords if kw in lower_html or kw in nav_text or kw in footer_text)

    scores = {
        'ecommerce': ecommerce_score,
        'portfolio': portfolio_score,
        'local_business': local_score,
        'saas': saas_score,
        'blog': blog_score
    }

    category = max(scores, key=scores.get)
    max_score = scores[category]
    confidence = min(1.0, max(0.0, max_score / 6.0))
    business_model = detect_business_model(html_content)
    return category, confidence, business_model, nav_links, footer_groups

def extract_typography(html_content):
    """Extract font families and typography information."""
    fonts = []

    # Google Fonts imports
    google_fonts = re.findall(r'family=([^&\'"]+)', html_content)
    for font in google_fonts:
        fonts.append(font.replace('+', ' '))

    # Font-family declarations
    font_family_pattern = re.compile(r'font-family\s*:\s*([^;}\n]+)', re.IGNORECASE)
    found_fonts = font_family_pattern.findall(html_content)
    for font_str in found_fonts:
        primary_font = font_str.split(',')[0].strip().strip('"\'')
        if primary_font and primary_font not in fonts:
            fonts.append(primary_font)

    return {'font_families': list(set(fonts))[:5]} if fonts else {'font_families': ['Inter', 'Playfair Display']}

def extract_imagery(html_content):
    """Extract hero image URL and metadata."""
    imagery = {}

    # Find first large image (potential hero image)
    img_pattern = re.compile(r'<img[^>]*src=["\']([^"\']+)["\'][^>]*>', re.IGNORECASE)
    img_matches = img_pattern.findall(html_content)

    if img_matches:
        imagery['hero_image_url'] = img_matches[0]

    return imagery

def extract_content(html_content):
    """Extract headlines, features, products, nav structure, and footer hierarchy."""
    content = {}

    # Hero headline (first h1 after body or in hero section)
    h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html_content, re.IGNORECASE | re.DOTALL)
    if h1_match:
        content['hero_headline'] = decode_text(strip_tags(h1_match.group(1)))[:150]

    # Hero subheadline (first h2 or subtitle)
    h2_match = re.search(r'<h2[^>]*>(.*?)</h2>', html_content, re.IGNORECASE | re.DOTALL)
    if h2_match:
        content['hero_subheadline'] = decode_text(strip_tags(h2_match.group(1)))[:150]

    # Navigation links
    content['nav_links'] = extract_nav_links(html_content)

    # Footer hierarchies
    footer_groups = extract_footer_links(html_content)
    if footer_groups:
        content['footer_links'] = footer_groups

    products = []
    product_section = re.search(r'<(?:section|div|article)[^>]*class=["\'][^"\']*(?:product|collection|catalog|shop|grid|items)[^"\']*["\'][^>]*>(.*?)</(?:section|div|article)>', html_content, re.IGNORECASE | re.DOTALL)
    if product_section:
        product_html = product_section.group(0)
        card_matches = re.findall(r'<(?:article|div)[^>]*class=["\'][^"\']*(?:product|card|item|collection|grid-item|product-card)[^"\']*["\'][^>]*>(.*?)</(?:article|div)>', product_html, re.IGNORECASE | re.DOTALL)
        for idx, card_html in enumerate(card_matches[:6]):
            title_match = re.search(r'<h[12][^>]*>(.*?)</h[12]>', card_html, re.IGNORECASE | re.DOTALL)
            desc_match = re.search(r'<p[^>]*>(.*?)</p>', card_html, re.IGNORECASE | re.DOTALL)
            price_match = re.search(r'(\$\s?\d+[\d,.]*)', card_html)
            link_match = re.search(r'<a[^>]*href=["\']([^"\']+)["\']', card_html, re.IGNORECASE)
            title = decode_text(strip_tags(title_match.group(1))) if title_match else ''
            description = decode_text(strip_tags(desc_match.group(1))) if desc_match else ''
            products.append({
                'title': title or f'Product {idx + 1}',
                'description': description,
                'price': price_match.group(1) if price_match else '',
                'link': link_match.group(1) if link_match else ''
            })

    if products:
        content['products'] = products
    else:
        articles = []
        article_matches = re.findall(r'<article[^>]*>(.*?)</article>', html_content, re.IGNORECASE | re.DOTALL)
        if not article_matches:
            article_matches = re.findall(r'<(?:div|li)[^>]*class=["\'][^"\']*(?:article|post|blog|news)[^"\']*["\'][^>]*>(.*?)</(?:div|li)>', html_content, re.IGNORECASE | re.DOTALL)
        for idx, article_html in enumerate(article_matches[:5]):
            title_match = re.search(r'<h[12][^>]*>(.*?)</h[12]>', article_html, re.IGNORECASE | re.DOTALL)
            snippet_match = re.search(r'<p[^>]*>(.*?)</p>', article_html, re.IGNORECASE | re.DOTALL)
            link_match = re.search(r'<a[^>]*href=["\']([^"\']+)["\']', article_html, re.IGNORECASE)
            title = decode_text(strip_tags(title_match.group(1))) if title_match else f'Article {idx + 1}'
            snippet = decode_text(strip_tags(snippet_match.group(1))) if snippet_match else ''
            articles.append({
                'title': title,
                'snippet': snippet,
                'link': link_match.group(1) if link_match else ''
            })
        if articles:
            content['articles'] = articles

    # Extract first few paragraphs as fallback features
    if 'products' not in content and 'articles' not in content:
        p_pattern = re.compile(r'<p[^>]*>(.*?)</p>', re.IGNORECASE | re.DOTALL)
        p_matches = p_pattern.findall(html_content)[:3]
        features = []
        for idx, p_text in enumerate(p_matches):
            clean_text = decode_text(strip_tags(p_text))
            if len(clean_text) > 10:
                features.append({
                    'title': f'Feature {idx + 1}',
                    'description': clean_text[:150]
                })
        content['features'] = features

    return content

def detect_tech_stack(html_content):
    """Detect technologies used (frameworks, CSS, hosting)."""
    tech = {}
    lower_html = html_content.lower()

    frameworks = []
    if 'react' in lower_html:
        frameworks.append('React')
    if 'vue' in lower_html:
        frameworks.append('Vue')
    if 'angular' in lower_html:
        frameworks.append('Angular')
    if 'next' in lower_html:
        frameworks.append('Next.js')
    if 'nuxt' in lower_html:
        frameworks.append('Nuxt')

    if frameworks:
        tech['frameworks'] = frameworks

    if 'tailwind' in lower_html:
        tech['css'] = 'Tailwind CSS'
    elif 'bootstrap' in lower_html:
        tech['css'] = 'Bootstrap'
    elif 'sass' in lower_html or 'scss' in lower_html:
        tech['css'] = 'Sass/SCSS'

    return tech

def main():
    target_url = sys.argv[1] if len(sys.argv) > 1 else ''
    industry_type = sys.argv[2].lower() if len(sys.argv) > 2 else 'default'

    print(f"[*] Comprehensive Metadata Extraction Initiated for: '{target_url}'", file=sys.stderr)

    metadata = {
        'metadata': {'source_url': target_url, 'category': 'default', 'detection_confidence': 0.0},
        'brand': {},
        'colors': {},
        'typography': {'font_families': ['Inter', 'Playfair Display']},
        'imagery': {},
        'content': {'features': []},
        'tech_stack': {}
    }

    if target_url:
        if not target_url.startswith(('http://', 'https://')):
            target_url = 'https://' + target_url

        try:
            print(f"[*] Fetching metadata from: {target_url}", file=sys.stderr)
            req = urllib.request.Request(
                target_url,
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
            )
            with urllib.request.urlopen(req, timeout=8) as response:
                charset = response.headers.get_content_charset() or 'utf-8'
                html = response.read().decode(charset, errors='ignore')

                # Extract all metadata
                colors = extract_colors(html)
                if colors:
                    metadata['colors'] = {
                        'primary': colors[0],
                        'accent': colors[1] if len(colors) > 1 else '#06b6d4',
                        'secondary': colors[2] if len(colors) > 2 else '#f43f5e',
                        'bg': '#ffffff'
                    }

                metadata['brand'] = extract_business_info(html)
                category, confidence, business_model, nav_links, footer_groups = detect_category(html)
                metadata['metadata']['category'] = category
                metadata['metadata']['detection_confidence'] = confidence
                metadata['metadata']['business_model'] = business_model
                metadata['metadata']['architecture'] = f"{category}:{business_model}"

                metadata['typography'] = extract_typography(html)
                metadata['imagery'] = extract_imagery(html)
                content = extract_content(html)
                if nav_links:
                    content['nav_links'] = nav_links
                if footer_groups:
                    content['footer_links'] = footer_groups
                metadata['content'] = content
                metadata['tech_stack'] = detect_tech_stack(html)
                metadata['metadata']['source_url'] = target_url

                print(f"[✓] Extraction complete. Category: {category} (confidence: {confidence:.2f})", file=sys.stderr)

        except Exception as err:
            print(f"[WARNING] Extraction failed: {str(err)}", file=sys.stderr)
            print("[*] Using fallback values...", file=sys.stderr)

    # Apply fallback colors if extraction failed
    if not metadata['colors']:
        industry_key = industry_type if industry_type in INDUSTRY_MATRICES else 'default'
        metadata['colors'] = INDUSTRY_MATRICES[industry_key]

    # Write to metadata.json
    output_path = 'metadata.json'
    try:
        with open(output_path, 'w') as out_file:
            json.dump(metadata, out_file, indent=2)
        print(f"[✓] Metadata saved to: {output_path}", file=sys.stderr)
    except IOError as err:
        print(f"[ERROR] Failed to save: {str(err)}", file=sys.stderr)

    print(json.dumps(metadata))

if __name__ == '__main__':
    main()
