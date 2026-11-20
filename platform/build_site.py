#!/usr/bin/env python3
"""
Static Publication & Dashboard Site Generator for Field & Fixture (DIYHOME1).

Generates all HTML pages, sitemap.xml, feed.xml, robots.txt, and .nojekyll
from verified JSON datasets in data/, ensuring consistent above-the-fold
disclosures, footer disclosures, rel="sponsored" outbound links, canonical URLs,
and zero drift between data tables and rendered pages.
"""

from __future__ import annotations

import html
import json
from pathlib import Path
from typing import Any

BASE_URL = "https://kanlerxz87-cyber.github.io/DIYHOME1"
TRACKING_ID = "shopnow047c-20"
PUB_NAME = "Field & Fixture"
PUB_TAGLINE = "DIY Home Upgrades · Practical Buyer Guides & Verified Product Notes"
VERIFIED_DATE = "2026-11-20"


def esc(val: Any) -> str:
    return html.escape("" if val is None else str(val), quote=True)


def rel_prefix(page_rel: str) -> str:
    depth = len(Path(page_rel).parts) - 1
    return "../" * depth if depth > 0 else ""


def render_page(
    *,
    page_rel: str,
    title: str,
    description: str,
    active_nav: str,
    body_html: str,
    page_type: str = "page",
    extra_head: str = "",
) -> str:
    prefix = rel_prefix(page_rel)
    canonical = f"{BASE_URL}/{'' if page_rel == 'index.html' else page_rel}"

    nav_items = [
        ("home", "Home", f"{prefix}index.html"),
        ("kitchen", "Kitchen & Storage", f"{prefix}categories/kitchen-storage.html"),
        ("walls", "Walls & Surfaces", f"{prefix}categories/walls-surfaces.html"),
        ("guides", "Buying Guides", f"{prefix}guides/index.html"),
        ("flagged", "Flagged for Review", f"{prefix}review/flagged.html"),
        ("dashboard", "Platform & Ledger", f"{prefix}dashboard/index.html"),
    ]
    nav_links = []
    for key, label, href in nav_items:
        current_attr = ' aria-current="page"' if key == active_nav else ""
        nav_links.append(f'          <a href="{esc(href)}"{current_attr}>{esc(label)}</a>')
    nav_html = "\n".join(nav_links)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{esc(title)} | {PUB_NAME}</title>
  <meta name="description" content="{esc(description)}">
  <link rel="canonical" href="{esc(canonical)}">
  <link rel="alternate" type="application/rss+xml" title="{PUB_NAME} RSS Feed" href="{prefix}feed.xml">
  <link rel="stylesheet" href="{prefix}assets/css/styles.css">
  {extra_head}
</head>
<body data-page-type="{esc(page_type)}">
  <div class="disclosure-strip" id="top-disclosure" role="region" aria-label="Affiliate Disclosure">
    <div class="container">
      <span><strong>Disclosure:</strong> As an Amazon Associate I earn from qualifying purchases (Tracking ID: <code>{TRACKING_ID}</code>). Outbound product links are marked <code>rel="sponsored"</code>.</span>
      <a href="{prefix}review/flagged.html">Verification &amp; Flagged Review Queue</a>
    </div>
  </div>

  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="{prefix}index.html">
        <span class="brand-title">{PUB_NAME}</span>
        <span class="brand-tag">{PUB_TAGLINE}</span>
      </a>
      <nav class="primary-nav" aria-label="Primary Navigation">
{nav_html}
      </nav>
    </div>
  </header>

  <main class="container">
{body_html}
  </main>

  <footer class="site-footer">
    <div class="container">
      <div class="footer-grid">
        <div>
          <h4>{PUB_NAME} · Shop &amp; Guides</h4>
          <ul>
            <li><a href="{prefix}index.html">Home (Front Page)</a></li>
            <li><a href="{prefix}categories/kitchen-storage.html">Kitchen &amp; Storage Upgrades</a></li>
            <li><a href="{prefix}categories/walls-surfaces.html">Walls, Surfaces &amp; DIY Tools</a></li>
            <li><a href="{prefix}guides/index.html">Question-Shaped Buying Guides</a></li>
          </ul>
        </div>
        <div>
          <h4>Dashboard &amp; Audit Surfaces</h4>
          <ul>
            <li><a href="{prefix}dashboard/index.html">Dashboard Overview</a></li>
            <li><a href="{prefix}dashboard/executive-summary.html">Executive Summary</a></li>
            <li><a href="{prefix}dashboard/verification-register.html">Verification &amp; Intent Register</a></li>
            <li><a href="{prefix}dashboard/campaign-ledger.html">Campaign Ledger &amp; Telemetry</a></li>
            <li><a href="{prefix}dashboard/platform-architecture.html">Automation &amp; Compliance Gate</a></li>
          </ul>
        </div>
        <div>
          <h4>Review &amp; Discoverability</h4>
          <ul>
            <li><a href="{prefix}review/flagged.html">Flagged for Review</a></li>
            <li><a href="{prefix}feed.xml">RSS Feed (feed.xml)</a></li>
            <li><a href="{prefix}sitemap.xml">XML Sitemap (sitemap.xml)</a></li>
            <li><a href="{prefix}robots.txt">robots.txt</a></li>
          </ul>
        </div>
      </div>
      <div class="footer-disclosure">
        <p><strong>Affiliate &amp; FTC Disclosure:</strong> As an Amazon Associate I earn from qualifying purchases. Selected Tracking ID: <code>{TRACKING_ID}</code>. Every outbound Amazon product link on this site carries <code>rel="sponsored noopener noreferrer"</code>. Product prices and availability on Amazon can change at any time; check the destination Amazon listing for current price, availability, and customer reviews.</p>
      </div>
    </div>
  </footer>

  <script src="{prefix}assets/js/analytics.js" defer></script>
</body>
</html>
"""


def product_card_html(prod: dict[str, Any], prefix: str, placement: str) -> str:
    asin = prod["observed_redirect_asin"]
    specs = prod["verified_specs"]
    spec_items = []
    for k, v in list(specs.items())[:4]:
        label = k.replace("_", " ").title()
        spec_items.append(f"<li><strong>{esc(label)}:</strong> {esc(v)}</li>")
    specs_ul = "\n            ".join(spec_items)

    return f"""        <article class="card" data-product-asin="{esc(asin)}">
          <img class="card-img" src="{prefix}{esc(prod['illustration'])}" alt="{esc(prod['short_title'])}" width="480" height="280" loading="lazy">
          <div class="card-meta">
            <span class="badge badge-neutral">{esc(prod['category_name'])}</span>
            <span class="badge badge-sponsored">Sponsored Link</span>
            <span class="badge badge-warn">Link Check: Pending Report</span>
          </div>
          <h3>{esc(prod['short_title'])}</h3>
          <p>{esc(prod['buyer_summary'])}</p>
          <ul class="spec-list">
            <li><strong>Brand:</strong> {esc(prod['brand'])} · <strong>Observed ASIN:</strong> <code>{esc(asin)}</code></li>
            {specs_ul}
          </ul>
          <p class="kpi-sub"><strong>Best for:</strong> {esc(prod['best_for'])}</p>
          <div class="cta-row">
            <a class="btn btn-primary" href="{esc(prod['candidate_special_link'])}" rel="sponsored noopener noreferrer" target="_blank" data-asin="{esc(asin)}" data-placement="{esc(placement)}">Check current price on Amazon (Sponsored)</a>
            <a class="btn btn-secondary" href="{prefix}{esc(prod['guide_slug'])}">Read Buyer Guide</a>
          </div>
        </article>"""


def build_index(products: list[dict[str, Any]], ledger: dict[str, Any], campaign: dict[str, Any]) -> str:
    cards = "\n".join(product_card_html(p, "", "home_featured") for p in products)
    json_ld = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": PUB_NAME,
        "url": f"{BASE_URL}/",
        "description": PUB_TAGLINE,
    }
    extra_head = f'<script type="application/ld+json">{json.dumps(json_ld)}</script>'

    body = f"""    <section class="hero">
      <span class="eyebrow">Fall / Holiday 2026 Home Refresh · Curated DIY Upgrades</span>
      <h1>Practical kitchen storage and surface tools worth comparing before you buy</h1>
      <p class="lead">Small, weekend-friendly upgrades make the biggest difference in tight kitchens and renter-friendly walls. Below are our three vetted DIY Home Upgrade picks—each documented with verified manufacturer dimensions, realistic trade-offs, and transparent sponsored links.</p>
      <div class="byline">
        <span><strong>Editorial Desk:</strong> {PUB_NAME} Home &amp; Hardware</span>
        <span><strong>Verified Snapshot:</strong> {VERIFIED_DATE} UTC</span>
        <span><strong>Clusters:</strong> Kitchen &amp; Storage · Walls &amp; Surfaces</span>
      </div>
    </section>

    <section class="section" aria-labelledby="featured-picks">
      <div class="section-head">
        <h2 id="featured-picks">Featured DIY Home Upgrade Picks</h2>
        <a href="dashboard/verification-register.html">View full source &amp; ASIN verification register &rarr;</a>
      </div>
      <div class="grid-3">
{cards}
      </div>
      <p class="kpi-sub" style="margin-top:12px;">Note: Live prices and customer star ratings are intentionally omitted from static shop cards until Creators API integration is active, per Amazon Associates Program Policies. Click through to Amazon for current price and availability.</p>
    </section>

    <section class="section" aria-labelledby="shop-clusters">
      <div class="section-head">
        <h2 id="shop-clusters">Browse by Room &amp; Project Cluster</h2>
      </div>
      <div class="grid-2">
        <div class="card">
          <span class="badge badge-ok">2 Verified Products</span>
          <h3>Kitchen &amp; Storage Upgrades</h3>
          <p>Under-cabinet paper towel mounting and 8-tier vertical/horizontal pan racks built to clear counters and organize base cabinets without power tools.</p>
          <div class="cta-row">
            <a class="btn btn-primary" href="categories/kitchen-storage.html">Explore Kitchen &amp; Storage</a>
            <a href="guides/pot-rack-cabinet-sizing.html">Cabinet Sizing Guide</a>
          </div>
        </div>
        <div class="card">
          <span class="badge badge-ok">1 Verified Product</span>
          <h3>Walls, Surfaces &amp; DIY Tools</h3>
          <p>Felt and rigid smoothing squeegees, utility trimming blades, and layout tools for peel-and-stick wallpaper, contact paper, and vinyl backsplash tiles.</p>
          <div class="cta-row">
            <a class="btn btn-primary" href="categories/walls-surfaces.html">Explore Walls &amp; Surfaces</a>
            <a href="guides/peel-and-stick-smoothing-tools.html">Tool Kit Guide</a>
          </div>
        </div>
      </div>
    </section>

    <section class="section" aria-labelledby="buyer-guides">
      <div class="section-head">
        <h2 id="buyer-guides">Question-Shaped Buying Guides</h2>
        <a href="guides/index.html">All guides &amp; editorial pipeline &rarr;</a>
      </div>
      <div class="grid-3">
        <article class="card">
          <span class="badge badge-neutral">Kitchen Mounting</span>
          <h3><a href="guides/paper-towel-holder-mounting.html">Adhesive vs. screw-mounted paper towel holders: which holds up under a cabinet?</a></h3>
          <p>When peel-and-stick backing works (tile, lacquered wood, metal) and when you should reach for screws—plus how to check 12.2&quot; rail clearance.</p>
        </article>
        <article class="card">
          <span class="badge badge-neutral">Cabinet Geometry</span>
          <h3><a href="guides/pot-rack-cabinet-sizing.html">Vertical vs. horizontal pot-and-pan rack: how to measure your cabinet first</a></h3>
          <p>Checking the 24.31&quot; &times; 18.61&quot; clearance footprint, 10 lb/tier limits, and lightweight vs. cast-iron cookware constraints before ordering.</p>
        </article>
        <article class="card">
          <span class="badge badge-neutral">Peel &amp; Stick Prep</span>
          <h3><a href="guides/peel-and-stick-smoothing-tools.html">What tools do you actually need for peel-and-stick backsplash or wallpaper?</a></h3>
          <p>Why felt-edged squeegees prevent vinyl scratches, when a kit saves time, and what sharp blades matter for outlet cutouts.</p>
        </article>
      </div>
    </section>

    <section class="section grid-2">
      <div class="capture-box">
        <span class="eyebrow">Reader Capture &amp; RSS Updates</span>
        <h3>Suggest a buyer question or follow new guides</h3>
        <p class="kpi-sub">Subscribe via <a href="feed.xml">RSS (<code>feed.xml</code>)</a> or log a DIY home topic request below. Requests trigger only the privacy-preserving <code>reader_capture_submit</code> counter (no email or PII stored on GitHub Pages).</p>
        <form class="capture-form" id="reader-capture-form">
          <select name="topic" aria-label="Topic category">
            <option value="kitchen-storage">Kitchen &amp; Storage Upgrades</option>
            <option value="walls-surfaces">Walls &amp; Peel-and-Stick Surfaces</option>
            <option value="small-appliances">Small Kitchen Appliances (Air Fryers)</option>
            <option value="other">Other DIY Home Upgrade</option>
          </select>
          <input type="text" name="question" placeholder="Ask a buyer question (e.g., cabinet depth or adhesive prep)..." aria-label="Buyer question">
          <button class="btn btn-primary" type="submit">Submit Topic</button>
        </form>
        <p class="notice notice-ok" id="reader-capture-status" hidden style="margin-top:12px;"></p>
      </div>

      <div class="card">
        <span class="eyebrow">Transparent Operations Snapshot</span>
        <h3>Verification, Ledger &amp; Review Surfaces</h3>
        <ul class="spec-list">
          <li><strong>Submitted URLs Audited:</strong> {len(ledger['submitted_links_register'])} raw lines &rarr; {len(products)} unique verified destinations (1 duplicate flagged).</li>
          <li><strong>Flagged for Review:</strong> {len(ledger['irregularities'])} items logged with official source URLs (<a href="review/flagged.html">view review queue</a>).</li>
          <li><strong>Authorized Campaign Ledger:</strong> {len(campaign['records'])} first-party records (empty until Associates reports are ingested).</li>
          <li><strong>API Compliance Posture:</strong> Targeting Amazon Creators API (PA-API 5 deprecated).</li>
        </ul>
        <div class="cta-row">
          <a class="btn btn-secondary" href="dashboard/executive-summary.html">Executive Summary</a>
          <a class="btn btn-secondary" href="dashboard/campaign-ledger.html">Campaign Ledger</a>
          <a class="btn btn-secondary" href="review/flagged.html">Flagged for Review</a>
        </div>
      </div>
    </section>"""

    return render_page(
        page_rel="index.html",
        title="DIY Home Upgrades & Practical Buyer Guides",
        description="Shop-first DIY home upgrades publication with verified product specs, question-shaped buying guides, transparent Associates disclosures, and full audit ledger.",
        active_nav="home",
        body_html=body,
        page_type="home",
        extra_head=extra_head,
    )


def build_kitchen_category(products: list[dict[str, Any]]) -> str:
    kitchen = [p for p in products if p["category_slug"] == "kitchen-storage"]
    cards = "\n".join(product_card_html(p, "../", "category_kitchen") for p in kitchen)
    rows = ""
    for p in kitchen:
        specs = p["verified_specs"]
        rows += f"""            <tr>
              <td><strong>{esc(p['brand'])}</strong><br>{esc(p['short_title'])}</td>
              <td><code>{esc(p['observed_redirect_asin'])}</code></td>
              <td>{esc(specs.get('material', ''))}</td>
              <td>{esc(specs.get('dimensions', ''))}</td>
              <td>{esc(specs.get('weight', ''))}</td>
              <td><span class="badge badge-warn">Unconfirmed</span><br><small>{esc(p['commission_category_reference'])}</small></td>
              <td><a href="{esc(p['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Official Listing</a> · <a href="{esc(p['commission_rate_source_url'])}" target="_blank" rel="noopener noreferrer">Rate Card</a></td>
            </tr>\n"""

    body = f"""    <section class="hero">
      <span class="eyebrow">Category · Kitchen &amp; Storage Upgrades</span>
      <h1>Kitchen &amp; Under-Cabinet Storage Upgrades</h1>
      <p class="lead">Two compact kitchen storage additions—one to get paper towels off the counter, and one to stop stacking skillets and lids inside base cabinets.</p>
    </section>

    <section class="section">
      <div class="grid-2">
{cards}
      </div>
    </section>

    <section class="section">
      <h2>Verified Side-by-Side Comparison</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Observed ASIN</th>
              <th>Material</th>
              <th>Dimensions</th>
              <th>Item Weight</th>
              <th>Commission Tier</th>
              <th>Official Sources</th>
            </tr>
          </thead>
          <tbody>
{rows}          </tbody>
        </table>
      </div>
    </section>"""

    return render_page(
        page_rel="categories/kitchen-storage.html",
        title="Kitchen & Storage Upgrades",
        description="Verified comparison of under-cabinet paper towel holders and adjustable pot-and-pan organizers.",
        active_nav="kitchen",
        body_html=body,
        page_type="category",
    )


def build_walls_category(products: list[dict[str, Any]]) -> str:
    walls = [p for p in products if p["category_slug"] == "walls-surfaces"]
    cards = "\n".join(product_card_html(p, "../", "category_walls") for p in walls)
    p = walls[0]
    specs = p["verified_specs"]

    body = f"""    <section class="hero">
      <span class="eyebrow">Category · Walls, Surfaces &amp; DIY Tools</span>
      <h1>Peel-and-Stick Surface Prep &amp; Smoothing Tools</h1>
      <p class="lead">Installing peel-and-stick wallpaper, contact paper, or vinyl backsplash tile depends on clean cuts and even pressure without scratching the film.</p>
    </section>

    <section class="section">
      <div class="grid-2">
{cards}
        <div class="card">
          <h3>Verified Kit Specifications &amp; Source Check</h3>
          <div class="table-wrap">
            <table>
              <tbody>
                <tr><th>Official Title</th><td>{esc(p['official_title'])}</td></tr>
                <tr><th>Model / Part #</th><td><code>{esc(specs['model_number'])}</code> / <code>{esc(specs['part_number'])}</code></td></tr>
                <tr><th>Observed ASIN</th><td><code>{esc(p['observed_redirect_asin'])}</code> <small>(intended ASIN unconfirmed)</small></td></tr>
                <tr><th>Included Tools</th><td>{esc(specs['kit_contents'])}</td></tr>
                <tr><th>Dimensions &amp; Weight</th><td>{esc(specs['dimensions'])} · {esc(specs['weight'])}</td></tr>
                <tr><th>Commission Category</th><td>{esc(p['commission_category_reference'])} ({p['commission_rate_pct']:.2f}%)</td></tr>
                <tr><th>Safety / Regulatory</th><td>California Proposition 65 warning noted on official listing</td></tr>
                <tr><th>Official Sources</th><td><a href="{esc(p['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Amazon Listing B08FKW9JRM</a> · <a href="{esc(p['commission_rate_source_url'])}" target="_blank" rel="noopener noreferrer">Associates Rate Card</a></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>"""

    return render_page(
        page_rel="categories/walls-surfaces.html",
        title="Walls, Surfaces & DIY Tools",
        description="Verified tool specifications and buyer notes for peel-and-stick wallpaper and backsplash installation kits.",
        active_nav="walls",
        body_html=body,
        page_type="category",
    )


def build_guides_index() -> str:
    body = """    <section class="hero">
      <span class="eyebrow">Editorial Guides &amp; Publishing Cadence</span>
      <h1>Question-Shaped Buying Guides</h1>
      <p class="lead">Each guide answers one specific buyer question before you click through to buy. Every newly published guide is added to <code>sitemap.xml</code> and <code>feed.xml</code>, and future topics are prioritized using measured Search Console queries and outbound click telemetry.</p>
    </section>

    <section class="section">
      <h2>Published Guides (2026-11-20)</h2>
      <div class="grid-3">
        <article class="card">
          <span class="badge badge-ok">Published</span>
          <h3><a href="paper-towel-holder-mounting.html">Under-cabinet paper towel holder: adhesive vs. screw-mount trade-offs</a></h3>
          <p>Covers surface compatibility, cabinet lip depth, and the niffgaff 12.2&quot; aluminum holder (<code>B0BSKQW2T2</code>).</p>
          <div class="cta-row"><a class="btn btn-primary" href="paper-towel-holder-mounting.html">Read Guide</a></div>
        </article>
        <article class="card">
          <span class="badge badge-ok">Published</span>
          <h3><a href="pot-rack-cabinet-sizing.html">Vertical vs. horizontal pot-and-pan rack: how to measure your cabinet</a></h3>
          <p>Covers the 3 DIY configurations, 24.31&quot; &times; 18.61&quot; clearance, and light-duty 10 lb/tier limits on the ORDORA 8-tier rack (<code>B08DY9HRWD</code>).</p>
          <div class="cta-row"><a class="btn btn-primary" href="pot-rack-cabinet-sizing.html">Read Guide</a></div>
        </article>
        <article class="card">
          <span class="badge badge-ok">Published</span>
          <h3><a href="peel-and-stick-smoothing-tools.html">What tools do you actually need for peel-and-stick backsplash or wallpaper?</a></h3>
          <p>Explains felt vs. rigid squeegees, trimming around outlets, and what the Art3d basic kit (<code>B08FKW9JRM</code>) includes.</p>
          <div class="cta-row"><a class="btn btn-primary" href="peel-and-stick-smoothing-tools.html">Read Guide</a></div>
        </article>
      </div>
    </section>

    <section class="section">
      <h2>Editorial Cadence &amp; Working Question Hypotheses</h2>
      <p class="kpi-sub">The titles below are <strong>working editorial hypotheses</strong> for upcoming Kitchen Appliance guides—they are <em>not</em> claims about search volume, popularity, or product superiority. Topics move from hypothesis to draft only after analytics and Search Console query data validate reader demand.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Working Title (Hypothesis)</th>
              <th>Cluster</th>
              <th>Status</th>
              <th>Gating Criterion</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>&ldquo;Basket or oven-style air fryer: what should you compare?&rdquo;</td>
              <td>Small Kitchen Upgrades</td>
              <td><span class="badge badge-neutral">Working Hypothesis</span></td>
              <td>Awaiting Search Console query validation &amp; enrolled Creators API product selection</td>
            </tr>
            <tr>
              <td>&ldquo;A no-hype checklist for comparing air fryer capacity&rdquo;</td>
              <td>Small Kitchen Upgrades</td>
              <td><span class="badge badge-neutral">Working Hypothesis</span></td>
              <td>Awaiting Search Console query validation &amp; interior basket measurement protocol</td>
            </tr>
            <tr>
              <td>&ldquo;How to assess cleanup and counter-space trade-offs&rdquo;</td>
              <td>Small Kitchen Upgrades</td>
              <td><span class="badge badge-neutral">Working Hypothesis</span></td>
              <td>Awaiting Search Console query validation &amp; footprint comparison template</td>
            </tr>
            <tr>
              <td>&ldquo;Questions to ask before buying a multi-function kitchen appliance&rdquo;</td>
              <td>Small Kitchen Upgrades</td>
              <td><span class="badge badge-neutral">Working Hypothesis</span></td>
              <td>Awaiting Search Console query validation &amp; FTC endorsement review checklist</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>"""

    return render_page(
        page_rel="guides/index.html",
        title="Question-Shaped Buying Guides",
        description="Published DIY home upgrade buyer guides and our query-driven editorial cadence.",
        active_nav="guides",
        body_html=body,
        page_type="guides_index",
    )


def build_individual_guides(products: list[dict[str, Any]]) -> dict[str, str]:
    by_asin = {p["observed_redirect_asin"]: p for p in products}
    p_towel = by_asin["B0BSKQW2T2"]
    p_rack = by_asin["B08DY9HRWD"]
    p_art3d = by_asin["B08FKW9JRM"]

    guides: dict[str, str] = {}

    guides["guides/paper-towel-holder-mounting.html"] = render_page(
        page_rel="guides/paper-towel-holder-mounting.html",
        title="Adhesive vs. Screw-Mounted Paper Towel Holders",
        description="How to decide between self-adhesive and screw mounting for under-cabinet paper towel holders.",
        active_nav="guides",
        page_type="guide",
        body_html=f"""    <article class="hero">
      <span class="eyebrow">Buyer Guide · Kitchen &amp; Storage</span>
      <h1>Under-cabinet paper towel holder: adhesive vs. screw-mount trade-offs</h1>
      <p class="lead">Mounting a paper towel bar under an upper cabinet frees counter space fast—but choosing the wrong attachment method for your cabinet bottom can cause the adhesive pad to peel off mid-tear.</p>
      <div class="byline">
        <span><strong>Product Referenced:</strong> {esc(p_towel['short_title'])} (<code>B0BSKQW2T2</code>)</span>
        <span><strong>Published:</strong> {VERIFIED_DATE}</span>
      </div>
    </article>

    <section class="section grid-2">
      <div class="card">
        <h2>When Self-Adhesive Makes Sense</h2>
        <ul class="spec-list">
          <li>Smooth, non-porous surfaces: glazed tile, stainless steel, glass, or sealed laminate cabinet undersides.</li>
          <li>Renter kitchens where drilling into millwork is prohibited.</li>
          <li>Clean the mounting surface with isopropyl alcohol and let the adhesive cure before loading a full roll.</li>
        </ul>
      </div>
      <div class="card">
        <h2>When Screw Mounting Is Safer</h2>
        <ul class="spec-list">
          <li>Unfinished wood, textured melamine, painted drywall, or cabinets near stove steam/grease.</li>
          <li>Heavy jumbo paper towel rolls pulled one-handed.</li>
          <li>The niffgaff aluminum holder (<code>2.56&quot;L x 12.2&quot;W</code>, 5 oz) supports both adhesive and screw installation horizontally or vertically.</li>
        </ul>
      </div>
    </section>

    <section class="section card">
      <h2>Check Your Cabinet Before Ordering</h2>
      <p>Verify that your upper cabinet underside has at least <strong>2.56 inches</strong> of flat mounting depth behind any front face-frame lip, and at least <strong>12.2 inches</strong> of clear span. Look closely at the <a href="{esc(p_towel['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">official Amazon listing for B0BSKQW2T2</a> to confirm color availability (Black, Gold, White) and current pricing.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="{esc(p_towel['candidate_special_link'])}" rel="sponsored noopener noreferrer" target="_blank" data-asin="B0BSKQW2T2" data-placement="guide_towel">Check current price on Amazon (Sponsored)</a>
        <a class="btn btn-secondary" href="../categories/kitchen-storage.html">Back to Kitchen &amp; Storage</a>
      </div>
    </section>""",
    )

    guides["guides/pot-rack-cabinet-sizing.html"] = render_page(
        page_rel="guides/pot-rack-cabinet-sizing.html",
        title="Vertical vs. Horizontal Pot Rack: Cabinet Sizing Guide",
        description="How to measure cabinet clearance and weight limits before buying an adjustable 8-tier pots and pans rack.",
        active_nav="guides",
        page_type="guide",
        body_html=f"""    <article class="hero">
      <span class="eyebrow">Buyer Guide · Cabinet Geometry</span>
      <h1>Vertical vs. horizontal pot-and-pan rack: how to measure your cabinet before buying</h1>
      <p class="lead">Adjustable tiered pan racks eliminate nested skillet stacks—but only if your base cabinet has enough vertical height and width for the handle overhang.</p>
      <div class="byline">
        <span><strong>Product Referenced:</strong> {esc(p_rack['short_title'])} (<code>B08DY9HRWD</code>)</span>
        <span><strong>Published:</strong> {VERIFIED_DATE}</span>
      </div>
    </article>

    <section class="section">
      <h2>3 DIY Configuration Dimensions (Verified from Official Listing)</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Assembly Mode</th>
              <th>Rack Dimensions (L &times; W &times; H)</th>
              <th>Best Cabinet Fit</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Vertical (both sides)</td>
              <td>21.31&quot; &times; 9.17&quot; &times; 16.61&quot;</td>
              <td>Wide base cabinets (listing states width &ge; 24.31&quot;, height &ge; 18.61&quot;)</td>
              <td><a href="{esc(p_rack['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Amazon B08DY9HRWD</a></td>
            </tr>
            <tr>
              <td>Vertical (one side)</td>
              <td>11.75&quot; &times; 9.17&quot; &times; 16.61&quot;</td>
              <td>Narrower cabinet bays or beside tall stockpots</td>
              <td><a href="{esc(p_rack['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Amazon B08DY9HRWD</a></td>
            </tr>
            <tr>
              <td>Horizontal (one side)</td>
              <td>16.61&quot; &times; 9.17&quot; &times; 11.75&quot;</td>
              <td>Short-height shelves with a half-depth shelf above</td>
              <td><a href="{esc(p_rack['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Amazon B08DY9HRWD</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section notice">
      <strong>Important Buying Caveats Found During Verification:</strong>
      <ul>
        <li><strong>Weight capacity:</strong> Rated at <strong>10 lbs per tier</strong> (light-duty). Heavy cast iron or enameled Dutch ovens may exceed this limit; Amazon's listing also links to a newer heavy-duty model (<code>B0BYYTQMTR</code>).</li>
        <li><strong>Diameter variance:</strong> The listing title states cookware &ldquo;Up to 11&quot;&rdquo; while the product bullets state &ldquo;up to 12 inches&rdquo;. Measure your widest skillet rim-to-rim.</li>
        <li><strong>Pricing structure:</strong> The $17.74 deal observed on 2026-11-20 was Prime-exclusive compared to the $23.99 regular price.</li>
      </ul>
    </section>

    <section class="section card">
      <div class="cta-row">
        <a class="btn btn-primary" href="{esc(p_rack['candidate_special_link'])}" rel="sponsored noopener noreferrer" target="_blank" data-asin="B08DY9HRWD" data-placement="guide_pot_rack">Check current price on Amazon (Sponsored)</a>
        <a class="btn btn-secondary" href="../categories/kitchen-storage.html">Back to Kitchen &amp; Storage</a>
      </div>
    </section>""",
    )

    guides["guides/peel-and-stick-smoothing-tools.html"] = render_page(
        page_rel="guides/peel-and-stick-smoothing-tools.html",
        title="What Tools Do You Need for Peel-and-Stick Backsplash or Wallpaper?",
        description="A practical checklist of smoothing squeegees, felt edges, blades, and measuring tools for peel-and-stick projects.",
        active_nav="guides",
        page_type="guide",
        body_html=f"""    <article class="hero">
      <span class="eyebrow">Buyer Guide · Walls &amp; Surfaces</span>
      <h1>What tools do you actually need for peel-and-stick backsplash or wallpaper?</h1>
      <p class="lead">You can hang peel-and-stick sheets with household scissors and a credit card, but air pockets and jagged outlet cuts show up fast. Here is what a purpose-built smoothing kit actually changes.</p>
      <div class="byline">
        <span><strong>Product Referenced:</strong> {esc(p_art3d['short_title'])} (<code>B08FKW9JRM</code>)</span>
        <span><strong>Published:</strong> {VERIFIED_DATE}</span>
      </div>
    </article>

    <section class="section">
      <h2>Tool-by-Tool Breakdown (Art3d Kit A17999)</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Included Component</th>
              <th>Primary Role</th>
              <th>Practical Trade-Off</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Red Smoothing Squeegee</td>
              <td>Firmly presses thicker vinyl backsplash tiles and edges</td>
              <td>Can scuff matte films if dragged dry without care</td>
              <td><a href="{esc(p_art3d['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Amazon B08FKW9JRM</a></td>
            </tr>
            <tr>
              <td>Blue Felt Smoothing Squeegee</td>
              <td>Glides over delicate contact paper/wallpaper to push out air bubbles</td>
              <td>Felt edge picks up dust if dropped on workshop floors</td>
              <td><a href="{esc(p_art3d['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Amazon B08FKW9JRM</a></td>
            </tr>
            <tr>
              <td>Craft Knife + 5 Blades</td>
              <td>Trims around wall outlets, cabinet edges, and baseboards</td>
              <td>Swap blades frequently; dull blades tear vinyl backing</td>
              <td><a href="{esc(p_art3d['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Amazon B08FKW9JRM</a></td>
            </tr>
            <tr>
              <td>Compact Tape Measure</td>
              <td>Quick layout checks before peeling backing paper</td>
              <td>Small pocket tape; pair with a long carpenter level for full walls</td>
              <td><a href="{esc(p_art3d['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Amazon B08FKW9JRM</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section card">
      <p><strong>Safety Note:</strong> The official Amazon product page displays a California Proposition 65 warning. Handle sharp craft blades carefully and store out of reach of children.</p>
      <div class="cta-row">
        <a class="btn btn-primary" href="{esc(p_art3d['candidate_special_link'])}" rel="sponsored noopener noreferrer" target="_blank" data-asin="B08FKW9JRM" data-placement="guide_walls">Check current price on Amazon (Sponsored)</a>
        <a class="btn btn-secondary" href="../categories/walls-surfaces.html">Back to Walls &amp; Surfaces</a>
      </div>
    </section>""",
    )

    return guides


def build_dashboard_pages(
    products: list[dict[str, Any]],
    ledger: dict[str, Any],
    campaign: dict[str, Any],
) -> dict[str, str]:
    pages: dict[str, str] = {}

    # 1. Dashboard Hub
    pages["dashboard/index.html"] = render_page(
        page_rel="dashboard/index.html",
        title="Platform & Audit Dashboard",
        description="Simple dashboard overview of verified products, executive summary, verification register, campaign ledger, and compliance gates.",
        active_nav="dashboard",
        page_type="dashboard",
        body_html=f"""    <section class="hero">
      <span class="eyebrow">Operations Dashboard · Tracking ID {TRACKING_ID}</span>
      <h1>Affiliate Operations &amp; Verification Dashboard</h1>
      <p class="lead">Every table row in this dashboard is backed by a verified official source link. Unverified values remain blank and are routed to the Flagged for Review queue.</p>
    </section>

    <section class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Submitted Lines</div><div class="kpi-value">{len(ledger['submitted_links_register'])}</div><div class="kpi-sub">3 unique destinations + 1 duplicate</div></div>
      <div class="kpi"><div class="kpi-label">Unique Products</div><div class="kpi-value">{len(products)}</div><div class="kpi-sub">Kitchen (2) · Walls/Tools (1)</div></div>
      <div class="kpi"><div class="kpi-label">Flagged for Review</div><div class="kpi-value">{len(ledger['irregularities'])}</div><div class="kpi-sub">Non-blocking review items</div></div>
      <div class="kpi"><div class="kpi-label">Authorized Ledger Rows</div><div class="kpi-value">{len(campaign['records'])}</div><div class="kpi-sub">Awaiting first-party report ingestion</div></div>
    </section>

    <section class="section">
      <h2>Dashboard Surfaces</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Surface</th>
              <th>Purpose</th>
              <th>Current Status</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Executive Summary</strong></td>
              <td>High-level findings, link audit results, compliance posture, and next gated actions</td>
              <td><span class="badge badge-ok">Ready</span></td>
              <td><a href="executive-summary.html">Open Executive Summary</a></td>
            </tr>
            <tr>
              <td><strong>Verification &amp; Product-Intent Register</strong></td>
              <td>Line-by-line table separating unverified <code>intended_asin</code> from <code>observed_redirect_target</code></td>
              <td><span class="badge badge-warn">4 Lines Audited · Review Needed</span></td>
              <td><a href="verification-register.html">Open Register</a></td>
            </tr>
            <tr>
              <td><strong>Campaign Ledger &amp; Telemetry</strong></td>
              <td>Empty first-party ledger schema + live 5-event privacy-preserving browser telemetry</td>
              <td><span class="badge badge-neutral">0 First-Party Rows</span></td>
              <td><a href="campaign-ledger.html">Open Ledger</a></td>
            </tr>
            <tr>
              <td><strong>Automation &amp; Compliance Gate</strong></td>
              <td>AI platform workflows, Creators API plan (replacing deprecated PA-API 5), FTC &amp; Associates gates</td>
              <td><span class="badge badge-ok">Enforced by CLI &amp; Tests</span></td>
              <td><a href="platform-architecture.html">Open Architecture</a></td>
            </tr>
            <tr>
              <td><strong>Flagged for Review</strong></td>
              <td>All 8 irregularities (duplicate URL, HTTP 500, unresolved short links, tier ambiguity)</td>
              <td><span class="badge badge-warn">8 Items Logged</span></td>
              <td><a href="../review/flagged.html">Open Flagged Queue</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>""",
    )

    # 2. Executive Summary
    pages["dashboard/executive-summary.html"] = render_page(
        page_rel="dashboard/executive-summary.html",
        title="Executive Summary",
        description="Executive summary of the DIYHOME1 Amazon affiliate audit, verified products, compliance posture, and platform build.",
        active_nav="dashboard",
        page_type="dashboard",
        body_html=f"""    <section class="hero">
      <span class="eyebrow">Executive Summary · {VERIFIED_DATE} UTC</span>
      <h1>Executive Summary: DIY Home Upgrades Affiliate Platform</h1>
      <p class="lead">Complete line-by-line verification of submitted product links, live publication build, compliance gate enforcement, and analytics instrumentation for Tracking ID <code>{TRACKING_ID}</code>.</p>
    </section>

    <section class="section">
      <h2>1. Key Findings from Line-by-Line Verification</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Area</th>
              <th>Verified Finding</th>
              <th>Compliance / Action Required</th>
              <th>Official Reference</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Submitted Link Resolution</strong></td>
              <td>4 submitted lines resolve to 3 unique official Amazon listings: <code>B08FKW9JRM</code> (Art3d Smoothing Kit), <code>B0BSKQW2T2</code> (niffgaff Paper Towel Holder, submitted twice), and <code>B08DY9HRWD</code> (ORDORA 8-Tier Pot Rack).</td>
              <td>Intended ASINs kept blank/unverified and strictly separated from observed redirect targets. Line 3 flagged as duplicate.</td>
              <td><a href="https://affiliate-program.amazon.com/help/node/topic/GP38PJ6EUR6PFBEC" target="_blank" rel="noopener noreferrer">Amazon ASIN Definition</a></td>
            </tr>
            <tr>
              <td><strong>Short Link Status (<code>link.amazon</code>)</strong></td>
              <td><code>link.amazon/B0hmGG4m2</code> returned HTTP 500 on first fetch before redirecting on retry. None of the 3 redirect targets carried a visible <code>tag=</code> query parameter.</td>
              <td>Do not claim supplied short links are invalid; exact compliance status is unresolved. Test one Special Link (<code>ref=nosim?tag={TRACKING_ID}</code>) per product in Associates Central before scaling.</td>
              <td><a href="https://affiliate-program.amazon.com/help/node/topic/GH37MDS5PLQ9Z366" target="_blank" rel="noopener noreferrer">Mobile GetLink Help</a></td>
            </tr>
            <tr>
              <td><strong>API Migration (PA-API 5 &rarr; Creators API)</strong></td>
              <td>Amazon officially deprecated PA-API 5 (returns HTTP 403) in favor of the <strong>Creators API</strong>. Static caching of prices/reviews without API is restricted.</td>
              <td>Platform blueprint targets Creators API with &le;24h cache TTL, timestamped pricing, and required disclaimers.</td>
              <td><a href="https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation" target="_blank" rel="noopener noreferrer">PA-API 5 Deprecation Notice</a></td>
            </tr>
            <tr>
              <td><strong>Disclosure &amp; Link Qualification</strong></td>
              <td>Operating Agreement §5 requires the exact Associates statement; Google requires <code>rel="sponsored"</code> on affiliate links; FTC requires clear, conspicuous placement.</td>
              <td>Automated HTML auditor verifies above-the-fold disclosure, footer disclosure, and <code>rel="sponsored"</code> on 100% of pages.</td>
              <td><a href="https://affiliate-program.amazon.com/help/operating/agreement" target="_blank" rel="noopener noreferrer">Operating Agreement</a> · <a href="https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links" target="_blank" rel="noopener noreferrer">Google Search Central</a></td>
            </tr>
            <tr>
              <td><strong>Commission Rate Mapping</strong></td>
              <td>Home Improvement / Tools (<code>B08FKW9JRM</code>) maps to <code>3.00%</code> on the U.S. rate card. Kitchen vs. Home (<code>B0BSKQW2T2</code>, <code>B08DY9HRWD</code>) spans <code>4.50%</code> (Kitchen) vs <code>3.00%</code> (Home).</td>
              <td>Assigned rate left blank/unconfirmed for Kitchen &amp; Dining storage items until verified in first-party Associates reports.</td>
              <td><a href="https://affiliate-program.amazon.com/help/node/topic/GRXPHT8U84RAYDXZ" target="_blank" rel="noopener noreferrer">Standard Commission Rates</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <h2>2. What Was Built in This Repository</h2>
      <div class="grid-2">
        <div class="card">
          <h3>Shop-First Publication &amp; Dashboard Site</h3>
          <ul class="spec-list">
            <li>Publication front page (<code>index.html</code>) leading with products and buyer value rather than audit jargon.</li>
            <li>Category pages (<code>categories/kitchen-storage.html</code>, <code>categories/walls-surfaces.html</code>) and 3 question-shaped buying guides + editorial cadence table.</li>
            <li>Dedicated Dashboard Hub, Executive Summary, Verification Register, Campaign Ledger, Platform Architecture, and Flagged for Review page.</li>
            <li>SEO &amp; Discoverability: canonical URLs, <code>sitemap.xml</code>, <code>feed.xml</code> (RSS), <code>robots.txt</code>.</li>
          </ul>
        </div>
        <div class="card">
          <h3>Automated Platform &amp; Measurement Stack</h3>
          <ul class="spec-list">
            <li><code>platform/affiliate_platform.py</code>: validates product-intent separation, builds Special Links, enforces ledger schema, and audits every HTML page.</li>
            <li><code>platform/creators_api_client.py</code>: Creators API policy wrapper enforcing 24h cache TTL and timestamped disclaimers.</li>
            <li><code>assets/js/analytics.js</code> &amp; <code>analytics-server/server.mjs</code>: privacy-preserving 5-event tracking without cookies or PII.</li>
            <li><code>tests/test_platform.py</code>: automated verification test suite.</li>
          </ul>
        </div>
      </div>
    </section>""",
    )

    # 3. Verification Register
    link_rows = ""
    for row in ledger["submitted_links_register"]:
        dup = f"Duplicate of Line {row['duplicate_of_line']}" if row["duplicate_of_line"] else "Unique"
        intended_disp = esc(row["intended_asin"]) if row["intended_asin"] else '<span class="badge badge-warn">Blank / Unverified</span>'
        conf_date = esc(row["confirmation_date"]) if row["confirmation_date"] else "&mdash;"
        tag_disp = esc(row["observed_tag_in_url"]) if row["observed_tag_in_url"] else '<span class="badge badge-warn">None observed (Unresolved)</span>'
        link_rows += f"""            <tr>
              <td>{row['line_number']}</td>
              <td><code>{esc(row['submitted_url'])}</code><br><small>{dup}</small></td>
              <td>{intended_disp}</td>
              <td>{conf_date}</td>
              <td><code>{esc(row['observed_redirect_asin'])}</code><br><small>Observed {esc(row['observed_redirect_date'])}</small></td>
              <td>{tag_disp}</td>
              <td><code>{esc(row['short_link_compliance_status'])}</code></td>
              <td><a href="{esc(row['official_source_url'])}" rel="sponsored noopener noreferrer" target="_blank">Official Listing ({esc(row['observed_redirect_asin'])})</a></td>
            </tr>\n"""

    spec_rows = ""
    for p in products:
        snap = p["observed_snapshot_2026_11_20"]
        rate_str = f"{p['commission_rate_pct']:.2f}%" if p["commission_rate_pct"] is not None else '<span class="badge badge-warn">Blank / Unverified</span>'
        spec_rows += f"""            <tr>
              <td><strong>{esc(p['brand'])}</strong><br><code>{esc(p['observed_redirect_asin'])}</code></td>
              <td>{esc(p['amazon_breadcrumb'])}</td>
              <td>${snap['price_usd']:.2f} <small>({esc(snap['promo_label'])}; audit snapshot {VERIFIED_DATE} UTC)</small></td>
              <td>{snap['rating']} / 5 ({snap['rating_count']:,} reviews; audit snapshot only)</td>
              <td>{rate_str}<br><small>{esc(p['commission_category_reference'])}</small></td>
              <td><code>{esc(p['candidate_special_link'])}</code><br><span class="badge badge-warn">Pending Test</span></td>
              <td><a href="{esc(p['official_listing_url'])}" rel="sponsored noopener noreferrer" target="_blank">Amazon Listing</a> · <a href="{esc(p['commission_rate_source_url'])}" target="_blank" rel="noopener noreferrer">Rate Card</a></td>
            </tr>\n"""

    pages["dashboard/verification-register.html"] = render_page(
        page_rel="dashboard/verification-register.html",
        title="Product-Intent & Source Verification Register",
        description="Line-by-line verification register keeping intended ASIN separate from observed redirect targets, with official source links on every row.",
        active_nav="dashboard",
        page_type="dashboard",
        body_html=f"""    <section class="hero">
      <span class="eyebrow">Verification Register · Zero Hallucinations Policy</span>
      <h1>Product-Intent Confirmation &amp; Source Register</h1>
      <p class="lead">Every submitted link keeps <strong>intended ASIN</strong> strictly separate from <strong>observed redirect targets</strong>. Any unconfirmed value is left blank and flagged rather than inferred.</p>
    </section>

    <section class="section">
      <h2>Table 1: Submitted Links &amp; Product-Intent Confirmation Records</h2>
      <div class="filter-bar">
        <input type="search" placeholder="Filter submitted links table..." data-filter-table="intent-table" aria-label="Filter submitted links table">
      </div>
      <div class="table-wrap">
        <table id="intent-table">
          <thead>
            <tr>
              <th>Line #</th>
              <th>Submitted Link</th>
              <th>Intended ASIN</th>
              <th>Confirmation Date</th>
              <th>Observed Redirect ASIN (Separate Field)</th>
              <th>Observed <code>tag=</code> Param</th>
              <th>Short Link Compliance</th>
              <th>Official Source</th>
            </tr>
          </thead>
          <tbody>
{link_rows}          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <h2>Table 2: Verified Catalog, Candidate Special Links &amp; Rate Card Audit</h2>
      <p class="kpi-sub">Note: Snapshot prices and review counts below were observed during verification on <code>{VERIFIED_DATE} UTC</code> for audit review only. Live display requires Creators API per Amazon Associates Policies.</p>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product / ASIN</th>
              <th>Official Category Breadcrumb</th>
              <th>Observed Snapshot Price ({VERIFIED_DATE})</th>
              <th>Observed Snapshot Reviews ({VERIFIED_DATE})</th>
              <th>Assigned Commission Rate</th>
              <th>Candidate Special Link</th>
              <th>Official Sources</th>
            </tr>
          </thead>
          <tbody>
{spec_rows}          </tbody>
        </table>
      </div>
    </section>""",
    )

    # 4. Campaign Ledger
    prov_rows = ""
    for item in campaign["provenance_trail"]:
        prov_rows += f"""            <tr>
              <td><code>{esc(item['date'])}</code></td>
              <td><code>{esc(item['actor'])}</code></td>
              <td>{esc(item['action'])}</td>
            </tr>\n"""

    pages["dashboard/campaign-ledger.html"] = render_page(
        page_rel="dashboard/campaign-ledger.html",
        title="Campaign Ledger & Telemetry",
        description="Empty well-defined first-party campaign ledger schema, dated provenance trail, and privacy-preserving 5-event telemetry inspector.",
        active_nav="dashboard",
        page_type="dashboard",
        body_html=f"""    <section class="hero">
      <span class="eyebrow">Evidence-Based Measurement · Tracking ID {TRACKING_ID}</span>
      <h1>Campaign Ledger &amp; Privacy-Preserving Telemetry</h1>
      <p class="lead">Measures outbound engagement before automating optimization. The authorized first-party campaign ledger starts empty and accepts entries <em>only</em> from authorized Amazon Associates reports. No conversion score or revenue forecast is fabricated here.</p>
    </section>

    <section class="section">
      <h2>1. Authorized First-Party Campaign Ledger</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Source</th>
              <th>Channel</th>
              <th>Eligible Sessions</th>
              <th>Clicks</th>
              <th>Reported Orders</th>
              <th>Provenance Note</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colspan="7"><span class="badge badge-neutral">0 Records</span> Ledger intentionally initialized empty in <code>data/campaign-ledger.json</code>. Populate via <code>python3 platform/affiliate_platform.py ingest-report --file &lt;authorized-report.json&gt;</code> after receiving authorized first-party Associates reports.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="section">
      <h2>2. Dated Provenance Trail</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Actor</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
{prov_rows}          </tbody>
        </table>
      </div>
    </section>

    <section class="section" id="local-telemetry-preview">
      <h2>3. Live Client-Side 5-Event Telemetry Inspector</h2>
      <p class="kpi-sub">Privacy-preserving client tracker (<code>assets/js/analytics.js</code>) records the 5 defined events locally with zero cookies or PII, and optionally dispatches to the self-hosted Node endpoint (<code>analytics-server/server.mjs</code>).</p>
      <div class="grid-2">
        <div class="card">
          <h3>Defined Event Counts (This Browser)</h3>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Event Name</th><th>Count</th><th>Scope</th></tr></thead>
              <tbody id="telemetry-counts-body"></tbody>
            </table>
          </div>
          <div class="cta-row">
            <button class="btn btn-secondary" type="button" id="reset-telemetry-btn">Reset Local Counters</button>
          </div>
        </div>
        <div class="card">
          <h3>Self-Hosted Analytics Endpoint Configuration</h3>
          <p class="kpi-sub">Run <code>node analytics-server/server.mjs</code> on your host and enter its <code>/api/events</code> URL below to stream events from this browser.</p>
          <form class="capture-form" id="analytics-endpoint-form">
            <input type="url" id="analytics-endpoint-input" placeholder="https://analytics.example.com/api/events" aria-label="Self-hosted analytics endpoint URL">
            <button class="btn btn-primary" type="submit">Save Endpoint</button>
          </form>
          <p class="notice notice-ok" id="endpoint-save-status" hidden></p>
          <h4 style="margin-bottom:6px;">Recent Local Events</h4>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Timestamp</th><th>Event</th><th>Page</th><th>Meta</th></tr></thead>
              <tbody id="telemetry-recent-body"></tbody>
            </table>
          </div>
        </div>
      </div>
    </section>""",
    )

    # 5. Platform Architecture & Compliance Gate
    pages["dashboard/platform-architecture.html"] = render_page(
        page_rel="dashboard/platform-architecture.html",
        title="AI Platform Architecture & Compliance Gates",
        description="Automated affiliate platform workflows paired with human compliance gates for Creators API, FTC Endorsement Guides, and Amazon Associates policies.",
        active_nav="dashboard",
        page_type="dashboard",
        body_html=f"""    <section class="hero">
      <span class="eyebrow">Trustworthy Machinery · Automate vs. Gate</span>
      <h1>AI-Powered Affiliate Platform &amp; Compliance Gates</h1>
      <p class="lead">Deterministic checks and content generation pipelines run automatically in code; policy-sensitive actions stop at explicit human compliance gates.</p>
    </section>

    <section class="section">
      <h2>Automation Boundary: Automated Machinery vs. Human Compliance Gates</h2>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Workflow Stage</th>
              <th>Automated Capability (Implemented in Repo)</th>
              <th>Compliance Gate (Requires Human Approval)</th>
              <th>Official Policy Source</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Product Intent &amp; Link Registry</strong></td>
              <td><code>validate-registry</code> checks 10-char ASIN syntax, detects duplicate submissions, and enforces separation of <code>intended_asin</code> vs. <code>observed_redirect_target</code>.</td>
              <td>Confirming submitter's intended ASIN and resolving <code>link.amazon</code> compliance status via Associates Central test click.</td>
              <td><a href="https://affiliate-program.amazon.com/help/node/topic/GP38PJ6EUR6PFBEC" target="_blank" rel="noopener noreferrer">ASIN &amp; Simple Text Links</a></td>
            </tr>
            <tr>
              <td><strong>Special Link Generation</strong></td>
              <td><code>build-special-link</code> generates canonical <code>https://www.amazon.com/dp/ASIN/ref=nosim?tag={TRACKING_ID}</code> links.</td>
              <td>Testing 1 link per product in enrolled Associates workflow and confirming tracking report credit before scaling.</td>
              <td><a href="https://affiliate-program.amazon.com/help/operating/policies" target="_blank" rel="noopener noreferrer">Associates Program Policies §2</a></td>
            </tr>
            <tr>
              <td><strong>Catalog, Price &amp; Review Sync</strong></td>
              <td><code>creators_api_client.py</code> enforces &le;24h cache TTL, UTC price timestamps, and Amazon disclaimers.</td>
              <td>Provisioning Creators API credentials (replacing deprecated PA-API 5) and reviewing Amazon's IP License terms.</td>
              <td><a href="https://affiliate-program.amazon.com/creatorsapi/docs/en-us/paapiv5-deprecation" target="_blank" rel="noopener noreferrer">Creators API Migration Notice</a></td>
            </tr>
            <tr>
              <td><strong>Editorial &amp; SEO Publishing</strong></td>
              <td><code>build_site.py</code> + <code>audit-site</code> verify canonical tags, <code>sitemap.xml</code>, <code>feed.xml</code>, disclosure strips, and <code>rel="sponsored"</code> on every outbound link.</td>
              <td>Reviewing editorial claims for FTC truthfulness (no unverified performance claims or misleading endorsements).</td>
              <td><a href="https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides-what-people-are-asking" target="_blank" rel="noopener noreferrer">FTC Endorsement Guides</a></td>
            </tr>
            <tr>
              <td><strong>Analytics &amp; Campaign Ledger</strong></td>
              <td>Client 5-event telemetry + self-hosted <code>server.mjs</code> + schema-checked <code>ingest-report</code> CLI rejecting fabricated forecasts.</td>
              <td>Exporting and authorizing first-party Amazon Associates click/order reports and deploying the self-hosted endpoint.</td>
              <td><a href="https://affiliate-program.amazon.com/help/operating/agreement" target="_blank" rel="noopener noreferrer">Associates Operating Agreement</a></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>""",
    )

    return pages


def build_flagged_review(ledger: dict[str, Any]) -> str:
    rows = ""
    for irr in ledger["irregularities"]:
        affected = ", ".join(irr["affected_items"])
        src_url = irr["official_source_url"]
        is_product_link = "www.amazon.com/dp/" in src_url
        rel_attr = 'rel="sponsored noopener noreferrer"' if is_product_link else 'rel="noopener noreferrer"'
        rows += f"""            <tr>
              <td><code>{esc(irr['id'])}</code></td>
              <td><span class="badge badge-warn">{esc(irr['severity'])}</span></td>
              <td><strong>{esc(irr['title'])}</strong><br><small>Affects: {esc(affected)}</small></td>
              <td>{esc(irr['description'])}</td>
              <td>{esc(irr['recommended_action'])}</td>
              <td><a href="{esc(src_url)}" target="_blank" {rel_attr}>{esc(irr['official_source_label'])}</a></td>
            </tr>\n"""

    body = f"""    <section class="hero">
      <span class="eyebrow">Manual Review Queue · Non-Blocking</span>
      <h1>Flagged for Review</h1>
      <p class="lead">All irregularities, unverified fields, duplicate inputs, and pending compliance gates identified during line-by-line verification are published transparently below with official source links so you can review and approve changes cleanly.</p>
    </section>

    <section class="section">
      <div class="filter-bar">
        <input type="search" placeholder="Filter flagged items..." data-filter-table="flagged-table" aria-label="Filter flagged items">
      </div>
      <div class="table-wrap">
        <table id="flagged-table">
          <thead>
            <tr>
              <th>Flag ID</th>
              <th>Status</th>
              <th>Issue &amp; Scope</th>
              <th>Verified Evidence</th>
              <th>Recommended Action</th>
              <th>Official Source</th>
            </tr>
          </thead>
          <tbody>
{rows}          </tbody>
        </table>
      </div>
    </section>"""

    return render_page(
        page_rel="review/flagged.html",
        title="Flagged for Review",
        description="Complete register of unverified items, duplicate submissions, redirect anomalies, and compliance gates flagged for owner review.",
        active_nav="flagged",
        body_html=body,
        page_type="review",
    )


def build_sitemap(page_rels: list[str]) -> str:
    urls = []
    for rel in page_rels:
        loc = f"{BASE_URL}/{'' if rel == 'index.html' else rel}"
        urls.append(f"  <url>\n    <loc>{esc(loc)}</loc>\n    <lastmod>{VERIFIED_DATE}</lastmod>\n  </url>")
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls)
        + "\n</urlset>\n"
    )


def build_feed() -> str:
    items = [
        (
            "Under-cabinet paper towel holder: adhesive vs. screw-mount trade-offs",
            f"{BASE_URL}/guides/paper-towel-holder-mounting.html",
            "How to evaluate surface compatibility, 12.2-inch rail clearance, and adhesive vs. screw installation for under-cabinet paper towel holders.",
        ),
        (
            "Vertical vs. horizontal pot-and-pan rack: how to measure your cabinet before buying",
            f"{BASE_URL}/guides/pot-rack-cabinet-sizing.html",
            "Cabinet clearance dimensions, 3 DIY assembly modes, and 10 lb/tier limits for 8-tier adjustable cookware organizers.",
        ),
        (
            "What tools do you actually need for peel-and-stick backsplash or wallpaper?",
            f"{BASE_URL}/guides/peel-and-stick-smoothing-tools.html",
            "Comparing felt vs. rigid squeegees, trimming blades, and layout tools for peel-and-stick DIY projects.",
        ),
    ]
    items_xml = "\n".join(
        f"""    <item>
      <title>{esc(title)}</title>
      <link>{esc(link)}</link>
      <guid>{esc(link)}</guid>
      <pubDate>Fri, 20 Nov 2026 00:00:00 GMT</pubDate>
      <description>{esc(desc)}</description>
    </item>"""
        for title, link, desc in items
    )
    return f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{esc(PUB_NAME)} — DIY Home Upgrades</title>
    <link>{esc(BASE_URL)}/</link>
    <description>{esc(PUB_TAGLINE)}</description>
    <language>en-us</language>
    <atom:link href="{esc(BASE_URL)}/feed.xml" rel="self" type="application/rss+xml"/>
{items_xml}
  </channel>
</rss>
"""


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    products = json.loads((root / "data" / "products.json").read_text(encoding="utf-8"))["products"]
    ledger = json.loads((root / "data" / "verification-ledger.json").read_text(encoding="utf-8"))
    campaign = json.loads((root / "data" / "campaign-ledger.json").read_text(encoding="utf-8"))

    outputs: dict[str, str] = {
        "index.html": build_index(products, ledger, campaign),
        "categories/kitchen-storage.html": build_kitchen_category(products),
        "categories/walls-surfaces.html": build_walls_category(products),
        "guides/index.html": build_guides_index(),
        **build_individual_guides(products),
        **build_dashboard_pages(products, ledger, campaign),
        "review/flagged.html": build_flagged_review(ledger),
    }

    for rel, content in outputs.items():
        out_path = root / rel
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(content, encoding="utf-8")

    (root / "sitemap.xml").write_text(build_sitemap(sorted(outputs.keys())), encoding="utf-8")
    (root / "feed.xml").write_text(build_feed(), encoding="utf-8")
    (root / "robots.txt").write_text(
        f"User-agent: *\nAllow: /\nSitemap: {BASE_URL}/sitemap.xml\n", encoding="utf-8"
    )
    (root / ".nojekyll").write_text("", encoding="utf-8")

    print(f"Generated {len(outputs)} HTML pages, sitemap.xml, feed.xml, robots.txt, and .nojekyll.")


if __name__ == "__main__":
    main()
