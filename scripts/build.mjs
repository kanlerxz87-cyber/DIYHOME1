#!/usr/bin/env node
/* Static site generator for DIY Home Upgrades.
 * Everything published comes from data/*.json. Nothing is invented at build time.
 * Run: node scripts/build.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { guides as guideCopy } from "./content.mjs";

const ROOT = process.cwd();
const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));

const site = readJson("data/site.json");
const sourceList = readJson("data/sources.json").sources;
const products = readJson("data/products.json").products;
const guideMeta = readJson("data/guides.json").guides;
const guidesNote = readJson("data/guides.json").cadence_note;
const flagged = readJson("data/flagged.json").items;
const events = readJson("data/events.json");
const release = readJson("data/release.json");
const productSpecs = readJson("data/product-specs.json").products;
const parallelPasses = readJson("data/verified-sources.json").parallel_passes;

const TAG = site.associate_tag;
const BASE = site.base_url;
const CATS = site.categories;
const SRC = Object.fromEntries(sourceList.map((s) => [s.id, s]));

const esc = (v) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const prefix = (depth) => (depth === 0 ? "" : "../".repeat(depth));
const tagged = (asin) => `https://www.amazon.com/dp/${asin}?tag=${TAG}`;
const abs = (p) => BASE + p;
const catOf = (slug) => CATS.find((c) => c.slug === slug);
const productsIn = (slug) => products.filter((p) => p.category === slug);
const productsForGuide = (g) => {
  if (Array.isArray(g.product_slugs) && g.product_slugs.length) {
    return g.product_slugs.map((slug) => products.find((p) => p.slug === slug)).filter(Boolean);
  }
  return productsIn(g.category);
};
const guidesIn = (slug) => guideMeta.filter((g) => g.category === slug);

function srcBadge(id, depth, label) {
  const s = SRC[id];
  if (!s) return `<span class="blank">no source</span>`;
  return `<a class="src" href="${s.url}" data-citation="true" target="_blank" rel="noopener" title="${esc(s.title)}">${esc(label || id)}</a>`;
}

function extCiteLink(url, label) {
  return `<a class="src" href="${esc(url)}" data-citation="true" target="_blank" rel="noopener">${esc(label)}</a>`;
}

/* ------------------------------------------------------------------ shell */

const NAV = [
  ["", "Home"],
  ["products/", "Products"],
  ["products/comparisons/", "Comparisons"],
  ["guides/", "Guides"],
  ["search/", "Search"],
  ["feed.xml", "RSS"]
];

const DESK_NAV = [
  ["summary/", "Executive summary"],
  ["sources/", "Source register"],
  ["ledger/", "Product-intent & ledger"],
  ["flagged/", "Flagged for review"],
  ["measurement/", "Measurement & events"],
  ["automation/", "Automation & gate"],
  ["about/", "How we verify"],
  ["disclosures/", "Disclosures"]
];

const FOOTER_NAV = [
  ["Shop", [
    ["products/", "All products"],
    ["products/wallpaper-tools/", "Wallpaper & surface prep"],
    ["products/kitchen-storage/", "Under-cabinet storage"],
    ["products/comparisons/", "Side-by-side comparisons"],
    ["guides/", "Guides"],
    ["search/", "Search"]
  ]],
  ["Verification", [
    ["sources/", "Source register"],
    ["flagged/", "Flagged for review"],
    ["automation/", "Automation & compliance gate"],
    ["about/", "How we verify"],
    ["disclosures/", "Disclosures"]
  ]],
  ["Data & Editions", [
    ["summary/", "Executive summary"],
    ["ledger/", "Product-intent & campaign ledger"],
    ["measurement/", "Measurement & events"],
    ["archive/practical-home/", "Practical Home edition (archived)"],
    ["archive/field-and-fixture/", "Field & Fixture edition (archived)"],
    ["sitemap.xml", "sitemap.xml"],
    ["feed.xml", "feed.xml"]
  ]]
];

function navSection(current, depth) {
  const p = prefix(depth);
  const items = NAV.map(([href, label]) => {
    const cur = current === href || (href && href !== "products/" && current.startsWith(href)) || (href === "products/" && current === "products/") ? ' aria-current="page"' : "";
    return `<li><a href="${p}${href}"${cur}>${label}</a></li>`;
  }).join("");
  const deskItems = DESK_NAV.map(([href, label]) => {
    const cur = current === href ? ' aria-current="page"' : "";
    return `<li><a href="${p}${href}"${cur}>${label}</a></li>`;
  }).join("");
  return `<nav class="site-nav" aria-label="Primary"><ul>${items}<li><details class="desk-dropdown"><summary>Site desk</summary><ul class="desk-menu">${deskItems}</ul></details></li></ul></nav>`;
}

function footer(depth) {
  const p = prefix(depth);
  const groups = FOOTER_NAV.map(([title, links]) => `<div><h2>${title}</h2><ul>${links
    .map(([href, label]) => `<li><a href="${p}${href}">${label}</a></li>`)
    .join("")}</ul></div>`).join("");
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="footer-top">
      <div class="footer-note">
        <strong>${esc(site.name)}</strong><br>
        ${esc(site.tagline)} Three products, four guides, one rule: if a value could not be read on an official source, it is blank and flagged rather than filled in.
      </div>
      <nav class="footer-nav" aria-label="Site sections and data">${groups}</nav>
    </div>
    <div class="footer-legal">
      <p><strong>Affiliate disclosure:</strong> ${esc(site.disclosure_long)}</p>
      <p>Prices, star ratings, review counts and availability are not displayed on this site. See <a href="${p}disclosures/">Disclosures</a> for why, with the policy sources.</p>
      <p>Amazon and Amazon.com are trademarks of Amazon.com, Inc. or its affiliates. This site is not endorsed by Amazon. Built ${esc(site.built_display)} from <a href="${p}sources/">${sourceList.length} registered sources</a>.</p>
    </div>
  </div>
</footer>`;
}

function head(opts) {
  const { title, description, depth, urlPath, jsonld = [], noindex = false } = opts;
  const p = prefix(depth);
  const canonical = urlPath === null ? null : abs(urlPath);
  const scripts = [
    `<link rel="stylesheet" href="${p}assets/css/site.css">`,
    `<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} — new guides" href="${abs("feed.xml")}">`
  ];
  if (site.search_console_token) {
    scripts.push(`<meta name="google-site-verification" content="${esc(site.search_console_token)}">`);
  }
  const ld = jsonld.map((block) => `<script type="application/ld+json">${JSON.stringify(block).replace(/</g, "\\u003c")}</script>`);
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
<meta name="robots" content="${noindex ? "noindex,follow" : "index,follow,max-image-preview:large"}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${canonical ? `<meta property="og:url" content="${canonical}">` : ""}
<meta name="twitter:card" content="summary">
<meta name="theme-color" content="#10574a">
${scripts.join("\n")}
${ld.join("\n")}`;
}

function layout(opts) {
  const { title, description, depth, urlPath = "", body, current = "", page = "", guideSlug = "", jsonld = [], noindex = false, indexData = null } = opts;
  const p = prefix(depth);
  const bodyAttrs = [`data-page="${page}"`, guideSlug ? `data-guide-slug="${esc(guideSlug)}"` : ""].filter(Boolean).join(" ");
  const inlineIndex = indexData ? `<script>window.DIYHOME_INDEX=${JSON.stringify(indexData).replace(/</g, "\\u003c")};</script>\n` : "";
  return `<!doctype html>
<html lang="en">
<head>
${head({ title, description, depth, urlPath, jsonld, noindex })}
</head>
<body ${bodyAttrs}>
<a class="skip" href="#main">Skip to content</a>
<header class="masthead">
  <div class="wrap masthead-inner">
    <a class="wordmark" href="${p}">${site.wordmark}</a>
    <div class="masthead-tag">${esc(site.tagline)}</div>
    ${navSection(current, depth)}
  </div>
</header>
<div class="disclosure" data-disclosure>
  <div class="wrap">
    <strong>Sponsored</strong>
    <span>${esc(site.disclosure_short)} Links marked <em>Sponsored</em> on this page are affiliate links to Amazon carrying our tag ${esc(TAG)}.</span>
    <a href="${p}disclosures/">How this site earns</a>
  </div>
</div>
<main id="main">
${body}
</main>
${footer(depth)}
${inlineIndex}<script src="${p}assets/js/config.js" defer></script>
<script src="${p}assets/js/site.js" defer></script>
</body>
</html>
`;
}

function crumbs(trail, depth) {
  const p = prefix(depth);
  const parts = trail.map(([href, label], i) => {
    if (i === trail.length - 1) return `<span aria-current="page">${esc(label)}</span>`;
    return `<a href="${p}${href}">${esc(label)}</a><span aria-hidden="true">/</span>`;
  });
  return `<div class="wrap breadcrumb">${parts.join("")}</div>`;
}

function crumbLd(trail) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map(([href, label], i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: label,
      item: abs(href)
    }))
  };
}

/* ------------------------------------------------------------- components */

function productCard(prod, depth) {
  const p = prefix(depth);
  const cat = catOf(prod.category);
  return `<article class="card">
  <div class="tile" aria-hidden="true"><span><b>${esc(cat.name)}</b>listing checked ${esc(prod.confirmation_date)}</span></div>
  <p><span class="badge ok">Listing verified</span></p>
  <h3 class="card-title"><a href="${p}products/${prod.slug}/">${esc(prod.short_title)}</a></h3>
  <p>${esc(prod.buyer_fit)}</p>
  <p class="link-note">ASIN ${esc(prod.asin_observed)} &middot; ${prod.brand ? esc(prod.brand) : "brand not stated"} &middot; source ${srcBadge(prod.confirmation_source, depth)}</p>
  <div class="btn-row">
    <a class="btn" href="${tagged(prod.asin_observed)}" data-sponsored="amazon" data-asin="${esc(prod.asin_observed)}" rel="sponsored nofollow noopener" target="_blank">Open on Amazon</a>
    <a class="btn secondary" href="${p}products/${prod.slug}/">What to check</a>
  </div>
  <p class="link-note">Sponsored. Tag ${esc(TAG)}. Price not shown: Amazon only permits price display via its own links or API.</p>
</article>`;
}

function guideCard(g, depth) {
  const p = prefix(depth);
  return `<article class="card">
  <p><span class="badge">Week ${g.week} &middot; Guide</span></p>
  <h3 class="card-title"><a href="${p}guides/${g.slug}/">${esc(g.title)}</a></h3>
  <p>${esc(g.dek)}</p>
  <p class="link-note">${esc(catOf(g.category).name)} &middot; ${esc(g.published_display)}</p>
  <div class="btn-row"><a class="btn secondary" href="${p}guides/${g.slug}/">Read the guide</a></div>
</article>`;
}

function buyBlock(prod, depth) {
  return `<div class="callout">
  <h3>Where to buy</h3>
  <p><a class="btn" href="${tagged(prod.asin_observed)}" data-sponsored="amazon" data-asin="${esc(prod.asin_observed)}" rel="sponsored nofollow noopener" target="_blank">Open the ${esc(prod.brand || "listing")} listing on Amazon</a></p>
  <p class="link-note" style="margin-top:10px">Sponsored affiliate link to Amazon, tag <span class="mono">${esc(TAG)}</span>, ASIN <span class="mono">${esc(prod.asin_observed)}</span>. Opens in a new tab. No price is shown here because Amazon only allows price and availability display through its own served links or the Creators/PA API. ${srcBadge("S01", depth)}</p>
</div>`;
}

/* ------------------------------------------------------------------ pages */

const pages = [];
const add = (file, html) => pages.push({ file, html });

/* ---- home ---- */

{
  const p = "";
  const lead = products[0];
  const body = `
<section class="wrap hero">
  <div class="hero-grid">
    <div>
      <p class="kicker">Issue 01 &middot; ${esc(site.built_display)} &middot; Three verified products</p>
      <h1>Three upgrades that make a rented kitchen work harder</h1>
      <p class="standfirst">A smoothing kit for the first peel-and-stick wall, a paper towel holder that does not need a drill, and an eight-tier pan rack for a cabinet that is already full. Each listing was opened and read on ${esc(site.built_display)} before it went on this page.</p>
      <div class="bylines">
        <span>${products.length} products, each with a source link</span><span class="dot">&middot;</span>
        <span>${guideMeta.length} buying guides</span><span class="dot">&middot;</span>
        <span>${flagged.length} items flagged for review</span><span class="dot">&middot;</span>
        <span>no prices, ratings or review counts published</span>
      </div>
      <div class="btn-row" style="margin-top:22px">
        <a class="btn" href="products/">See the three products</a>
        <a class="btn secondary" href="guides/">Start with a buying guide</a>
      </div>
    </div>
    <aside class="hero-side">
      <h2>The short list</h2>
      <ol>
        ${products.map((prod) => `<li><a href="products/${prod.slug}/">${esc(prod.short_title)}</a><br><span class="link-note">${esc(catOf(prod.category).name)} &middot; ASIN ${esc(prod.asin_observed)}</span></li>`).join("")}
      </ol>
      <p class="link-note" style="margin-top:14px">Everything outbound is marked <strong>Sponsored</strong>. Prices are absent by design, not by oversight: <a href="disclosures/">why</a>.</p>
    </aside>
  </div>
</section>

<section class="block">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2>The shop</h2>
        <p>Three products, in the two categories this issue covers. Filter by category on the <a href="products/">products page</a>.</p>
      </div>
      <a class="more" href="products/">All products &rarr;</a>
    </div>
    <div class="shelf">${products.map((prod) => productCard(prod, 0)).join("")}</div>
  </div>
</section>

<section class="block">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2>This month&rsquo;s guides</h2>
        <p>Question-shaped, one per week, each tied to a category with a verified product. No search-volume claims: none were available to verify.</p>
      </div>
      <a class="more" href="guides/">All guides &rarr;</a>
    </div>
    <div class="shelf">${guideMeta.map((g) => guideCard(g, 0)).join("")}</div>
  </div>
</section>

<section class="block">
  <div class="wrap">
    <div class="section-head">
      <div>
        <h2>How this page is checked</h2>
        <p>Three rules, applied to every product here.</p>
      </div>
      <a class="more" href="about/">The full method &rarr;</a>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3 class="card-title">The listing, not a guess</h3>
        <p>Each product was resolved from the link you supplied to a live Amazon listing. The title and category breadcrumb on this site are copied from that page, with the source ID recorded next to them.</p>
        <p class="link-note">Example: ${srcBadge("S04", 0)} for the smoothing kit.</p>
      </div>
      <div class="card">
        <h3 class="card-title">Blank beats invented</h3>
        <p>Where a value could not be read on an official source—such as intended ASINs, missing UPCs on two listings, or absent Date First Available rows—it stays blank and is badged unverified rather than guessed.</p>
        <p class="link-note"><a href="flagged/">${flagged.length} items flagged, with sources</a></p>
      </div>
      <div class="card">
        <h3 class="card-title">No performance claims</h3>
        <p>Nothing here has been bought or tested, so nothing here claims an experience with a product. No star ratings, review counts, prices or commission percentages are republished.</p>
        <p class="link-note">Reasons: ${srcBadge("S03", 0)} and ${srcBadge("S01", 0)}.</p>
      </div>
      <div class="card">
        <h3 class="card-title">The numbers are not in yet</h3>
        <p>Five events are instrumented. No analytics endpoint is deployed and no Associates report has been pulled, so the campaign ledger is empty and no conversion score or revenue forecast is presented.</p>
        <p class="link-note"><a href="measurement/">What is measured</a> &middot; <a href="ledger/">The empty ledger</a></p>
      </div>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap">
    <div class="section-head"><div><h2>What is not here yet</h2><p>Stated plainly, because a shop that hides its gaps is not trustworthy.</p></div></div>
    <div class="callout warn">
      <p><strong>Three things are pending, all flagged:</strong> the supplied short links are not confirmed as enrolled Associates links; Search Console has no verification token; and the analytics collector has no host, so the five events stay in the visitor&rsquo;s browser. None of these are simulated on this site.</p>
      <p><a href="flagged/">Read the flags, with source links &rarr;</a></p>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap">
    <div class="callout">
      <h3>Follow new DIY checklists without giving up your email (SG-30)</h3>
      <p>Subscribe to our UTF-8 <a href="feed.xml">RSS 2.0 feed</a> in any feed reader, or compare dimensions side by side on the <a href="products/comparisons/">specification matrix</a>. Zero cookies, zero email tracking pixels, zero third-party requests.</p>
    </div>
  </div>
</section>`;

  add("index.html", layout({
    title: `${site.name} — three verified DIY upgrades for rented kitchens`,
    description: "A small product journal for DIY home upgrades: a wallpaper smoothing kit, an under-cabinet paper towel holder and an eight-tier pan rack, each checked against its live Amazon listing with source links.",
    depth: 0,
    urlPath: "",
    current: "",
    page: "home",
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: site.name,
        url: abs(""),
        description: site.description,
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: abs("search/?q={search_term_string}") },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: site.name,
        url: abs(""),
        description: site.description,
        disambiguatingDescription: "Affiliate publisher. Participant in the Amazon Associates program. No products are sold directly by this site."
      }
    ],
    body
  }));
}

/* ---- products index ---- */

{
  const body = `
<div class="wrap page-head">
  <p class="kicker">The shop &middot; ${products.length} products</p>
  <h1>Products, each with the listing it came from</h1>
  <p class="standfirst">Every row resolves to a live Amazon listing that was opened on ${esc(site.built_display)}. The source column links to the official listing, so you can check any value yourself. Blank cells are blank on purpose.</p>
</div>

<div class="wrap">
  <div class="callout">
    <h3>What this table deliberately leaves out</h3>
    <p>No price, star rating, review count or availability. Amazon&rsquo;s Associates policies only allow price and availability display through Amazon-served links or the Creators/PA API, and star ratings and customer reviews only through those APIs. This site has no API access, so those columns are absent rather than stale. ${srcBadge("S01", 0)} ${srcBadge("S18", 0)}</p>
  </div>

  <div class="table-tools">
    <label class="visually-hidden" for="product-filter" style="position:absolute;left:-9999px">Filter products</label>
    <input class="search-input" id="product-filter" type="search" placeholder="Filter by name, brand, ASIN or category" autocomplete="off">
    <div class="chips" role="group" aria-label="Filter by category">
      <button class="chip" type="button" data-filter-cat="all" aria-pressed="true">All</button>
      ${CATS.map((c) => `<button class="chip" type="button" data-filter-cat="${c.slug}" aria-pressed="false">${esc(c.name)}</button>`).join("")}
    </div>
    <span class="link-note" id="product-count">${products.length} of ${products.length} shown</span>
  </div>

  <div class="table-wrap">
    <table id="product-table">
      <caption>Verified product register. Source column links to the official Amazon listing. Verification date ${esc(site.built_display)}.</caption>
      <thead>
        <tr>
          <th scope="col">Product</th>
          <th scope="col">Category</th>
          <th scope="col">Brand</th>
          <th scope="col">ASIN observed</th>
          <th scope="col">Listing verified</th>
          <th scope="col">Tracking confirmed</th>
          <th scope="col">Buy (sponsored)</th>
        </tr>
      </thead>
      <tbody>
        ${products.map((prod) => `<tr data-category="${prod.category}">
          <td><a href="${prod.slug}/"><strong>${esc(prod.short_title)}</strong></a><br><span class="link-note">${esc(prod.title.slice(0, 92))}${prod.title.length > 92 ? "&hellip;" : ""}</span></td>
          <td><a href="${prod.category}/">${esc(catOf(prod.category).name)}</a></td>
          <td>${prod.brand ? esc(prod.brand) : `<span class="blank">not stated in listing title</span>`}</td>
          <td><span class="mono">${esc(prod.asin_observed)}</span></td>
          <td>${esc(prod.confirmation_date)}<br>${srcBadge(prod.confirmation_source, 0)}</td>
          <td><span class="badge warn">Not confirmed</span><br><span class="link-note"><a href="../flagged/#F01">F01</a></span></td>
          <td><a class="btn" href="${tagged(prod.asin_observed)}" data-sponsored="amazon" data-asin="${esc(prod.asin_observed)}" rel="sponsored nofollow noopener" target="_blank">Amazon&nbsp;&rarr;</a><br><span class="link-note">tag ${esc(TAG)}</span></td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
  <p class="link-note" style="margin-top:12px">The product-intent record, with intended ASIN and observed redirect kept in separate fields, is published at <a href="../ledger/">the ledger page</a> and in <span class="mono">data/product-intents.csv</span>.</p>
</div>

<section class="block">
  <div class="wrap">
    <div class="section-head"><div><h2>Browse by category</h2></div></div>
    <div class="shelf">
      ${CATS.map((c) => `<article class="card">
        <div class="tile" aria-hidden="true"><span><b>${esc(c.name)}</b>${productsIn(c.slug).length} product${productsIn(c.slug).length === 1 ? "" : "s"}</span></div>
        <p><span class="badge">${esc(c.kicker)}</span></p>
        <h3 class="card-title"><a href="${c.slug}/">${esc(c.name)}</a></h3>
        <p>${esc(c.blurb)}</p>
        <div class="btn-row"><a class="btn secondary" href="${c.slug}/">Open category</a></div>
      </article>`).join("")}
    </div>
  </div>
</section>`;

  add("products/index.html", layout({
    title: `All products — verified register | ${site.name}`,
    description: "Three DIY home upgrade products with ASIN, category, brand and verification date, each linked to its official Amazon listing.",
    depth: 1,
    urlPath: "products/",
    current: "products/",
    page: "products",
    jsonld: [crumbLd([["", "Home"], ["products/", "All products"]])],
    body: crumbs([["", "Home"], ["products/", "All products"]], 1) + body
  }));
}

/* ---- category pages ---- */

for (const cat of CATS) {
  const items = productsIn(cat.slug);
  const gs = guidesIn(cat.slug);
  const body = `
<div class="wrap page-head">
  <p class="kicker">${esc(cat.kicker)}</p>
  <h1>${esc(cat.name)}</h1>
  <p class="standfirst">${esc(cat.blurb)}</p>
  <p class="link-note">Amazon browse node ${cat.browse_node} &middot; ${srcBadge("S01", 1)} for the display rules &middot; <a href="${cat.browse_url}&tag=${TAG}" data-sponsored="amazon" data-link-kind="browse" rel="sponsored nofollow noopener" target="_blank">Sponsored: browse this category on Amazon</a></p>
</div>
<section class="wrap" style="padding-bottom:10px">
  <div class="shelf">${items.map((prod) => productCard(prod, 2)).join("")}</div>
</section>
${gs.length ? `<section class="block"><div class="wrap">
  <div class="section-head"><div><h2>Guides for this category</h2></div></div>
  <div class="shelf">${gs.map((g) => guideCard(g, 2)).join("")}</div>
</div></section>` : ""}
<section class="block"><div class="wrap">
  <div class="section-head"><div><h2>What is not in this category page</h2></div></div>
  <div class="callout warn"><p>No prices, no star ratings, no review counts, no &ldquo;best of&rdquo; ranking. ${items.length === 1 ? "There is one verified product" : `There are ${items.length} verified products`} in this category as of ${esc(site.built_display)}, which is not enough to rank anything. ${srcBadge("S01", 1)}</p></div>
</div></section>`;

  add(`products/${cat.slug}/index.html`, layout({
    title: `${cat.name} — ${items.length} verified product${items.length === 1 ? "" : "s"} | ${site.name}`,
    description: `${cat.blurb} ${items.map((i) => i.short_title).join("; ")}.`,
    depth: 2,
    urlPath: `products/${cat.slug}/`,
    current: "products/",
    page: "category",
    jsonld: [crumbLd([["", "Home"], ["products/", "All products"], [`products/${cat.slug}/`, cat.name]])],
    body: crumbs([["", "Home"], ["products/", "All products"], [`products/${cat.slug}/`, cat.name]], 2) + body
  }));
}

/* ---- side-by-side comparison page ---- */

{
  const compRows = productSpecs.map((spec) => {
    const prod = products.find((p) => p.asin_observed === spec.observed_asin);
    const amap = Object.fromEntries(spec.attributes.map((a) => [a.field, a]));
    const dims = amap["Product Dimensions"] || amap["Item Dimensions & Rail Length"] || amap["Dimensions & 3 DIY Footprints"];
    const weight = amap["Item Weight"] || amap["Item Weight & Per-Shelf Capacity"];
    const mat = amap["Material & Handle Material"] || amap["Material & Finish"] || amap["Material & Divider Spec"];
    const upc = amap["UPC / GTIN"];
    const dfa = amap["Date First Available"];
    return `<tr>
      <td><a href="../${prod.slug}/"><strong>${esc(prod.short_title)}</strong></a><br><span class="mono">${esc(spec.observed_asin)}</span></td>
      <td><a href="../${prod.category}/">${esc(catOf(prod.category).name)}</a></td>
      <td>${esc(amap["Brand"].value)}<br>${extCiteLink(amap["Brand"].source_url, "Store")}</td>
      <td>${esc(mat.value)}</td>
      <td>${esc(dims.value)}</td>
      <td>${esc(weight.value)}</td>
      <td>${upc.value ? `<span class="mono">${esc(upc.value)}</span>` : `<span class="badge warn">Unverified (blank)</span>`}</td>
      <td>${dfa.value ? esc(dfa.value) : `<span class="badge warn">Unverified (blank)</span>`}</td>
      <td>${extCiteLink(spec.observed_dp_url, "Official listing")} &middot; <a class="btn" href="${tagged(spec.observed_asin)}" data-sponsored="amazon" data-asin="${esc(spec.observed_asin)}" rel="sponsored nofollow noopener" target="_blank">Amazon&nbsp;&rarr;</a></td>
    </tr>`;
  }).join("");

  const compBody = `
<div class="wrap page-head">
  <p class="kicker">Side-by-side comparison &middot; ${productSpecs.length} verified listings</p>
  <h1>Compare dimensions, materials and mounting specs</h1>
  <p class="standfirst">Line-by-line physical specifications read directly from each official Amazon product detail page on ${esc(site.built_display)}. Any field omitted by the manufacturer table stays blank and marked unverified.</p>
</div>
<div class="wrap">
  <div class="table-wrap">
    <table>
      <caption>Side-by-side comparison of observed DIY home upgrade listings. Every row links to its official Amazon detail page and brand store.</caption>
      <thead>
        <tr>
          <th scope="col">Product &amp; ASIN</th>
          <th scope="col">Category</th>
          <th scope="col">Brand</th>
          <th scope="col">Material</th>
          <th scope="col">Confirmed dimensions</th>
          <th scope="col">Weight / load</th>
          <th scope="col">UPC</th>
          <th scope="col">Date first available</th>
          <th scope="col">Sources &amp; Sponsored link</th>
        </tr>
      </thead>
      <tbody>${compRows}</tbody>
    </table>
  </div>
</div>`;

  add("products/comparisons/index.html", layout({
    title: `Side-by-side specification comparison | ${site.name}`,
    description: "Compare verified dimensions, materials, weights, mounting methods, and catalog identifiers across all three DIY home upgrade listings.",
    depth: 2,
    urlPath: "products/comparisons/",
    current: "products/comparisons/",
    page: "comparisons",
    jsonld: [crumbLd([["", "Home"], ["products/", "All products"], ["products/comparisons/", "Comparisons"]])],
    body: crumbs([["", "Home"], ["products/", "All products"], ["products/comparisons/", "Comparisons"]], 2) + compBody
  }));
}

/* ---- product pages ---- */

for (const prod of products) {
  const cat = catOf(prod.category);
  const gs = guidesIn(prod.category);
  const submitted = prod.submitted_links.map((id) => SRC[id]).filter(Boolean);
  const specEntry = productSpecs.find((s) => s.observed_asin === prod.asin_observed);
  const specTableHtml = specEntry ? `
<section class="block">
  <div class="wrap">
    <div class="section-head"><div><h2>Line-by-line technical specifications</h2><p>Read directly from the official Amazon product information table on ${esc(prod.confirmation_date)}. Missing fields remain blank and marked unverified.</p></div></div>
    <div class="table-wrap">
      <table>
        <caption>Technical details for ASIN ${esc(prod.asin_observed)}. Every row links to an official source.</caption>
        <thead><tr><th scope="col">Catalog attribute</th><th scope="col">Confirmed value (blank if unverified)</th><th scope="col">Status</th><th scope="col">Official source</th></tr></thead>
        <tbody>
          ${specEntry.attributes.map((attr) => `<tr>
            <td><strong>${esc(attr.field)}</strong></td>
            <td>${attr.value !== "" ? esc(attr.value) : ""}</td>
            <td><span class="badge ${attr.status === "Verified" ? "ok" : "warn"}">${esc(attr.status)}</span></td>
            <td>${extCiteLink(attr.source_url, attr.source_label)}</td>
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
  </div>
</section>` : "";
  const body = `
<div class="wrap page-head">
  <p class="kicker">${esc(cat.name)} &middot; ASIN ${esc(prod.asin_observed)}</p>
  <h1>${esc(prod.short_title)}</h1>
  <p class="standfirst">${esc(prod.buyer_fit)}</p>
  <div class="bylines">
    <span><span class="badge ok">Listing verified ${esc(prod.confirmation_date)}</span></span>
    <span><span class="badge warn">Tracking not confirmed</span></span>
    <span><span class="badge">Not tested by us</span></span>
  </div>
</div>

<section class="wrap">
  <div class="grid-2" style="align-items:start">
    <div class="card">
      <h3 class="card-title">What the listing says</h3>
      <blockquote style="margin:0 0 12px;padding-left:14px;border-left:3px solid var(--accent);color:var(--ink-soft)">${esc(prod.title)}</blockquote>
      <p class="link-note">Listing title, copied verbatim on ${esc(prod.confirmation_date)}. Source: ${srcBadge(prod.confirmation_source, 2)}</p>
      <h4 style="margin:18px 0 6px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Claims made in that title</h4>
      <ul style="margin:0;padding-left:20px;font-size:14.5px">
        ${prod.listing_claims.map((c) => `<li>${esc(c)}</li>`).join("")}
      </ul>
      <p class="link-note" style="margin-top:10px">${esc(prod.listing_claims_note)}</p>
    </div>

    <div class="card">
      <h3 class="card-title">Before you buy: what decides it</h3>
      <p>${esc(prod.buyer_hesitation)}</p>
      <h4 style="margin:14px 0 6px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)">Three questions to answer first</h4>
      <ol style="margin:0;padding-left:20px;font-size:14.5px">
        ${prod.questions_for_reader.map((q) => `<li>${esc(q)}</li>`).join("")}
      </ol>
      <div class="btn-row" style="margin-top:16px">
        <a class="btn" href="${tagged(prod.asin_observed)}" data-sponsored="amazon" data-asin="${esc(prod.asin_observed)}" rel="sponsored nofollow noopener" target="_blank">Open on Amazon</a>
        <a class="btn secondary" href="../../products/${prod.category}/">More in this category</a>
      </div>
      <p class="link-note" style="margin-top:10px">Sponsored link, tag <span class="mono">${esc(TAG)}</span>. Price not displayed.</p>
    </div>
  </div>
</section>

<section class="block">
  <div class="wrap">
    <div class="section-head"><div><h2>Verification record</h2><p>Exactly what was checked, and what was not. Intended and observed values are kept in separate fields.</p></div></div>
    <div class="card">
      <dl class="facts">
        <dt>Intended ASIN</dt>
        <dd class="blank">${esc(prod.intended_asin_status)}</dd>
        <dt>Observed ASIN</dt>
        <dd><span class="mono">${esc(prod.asin_observed)}</span> &middot; parsed from the page the short link resolved to (${srcBadge(prod.confirmation_source, 2)}), not from the link itself</dd>
        <dt>Official listing URL</dt>
        <dd><a href="${tagged(prod.asin_observed)}" data-sponsored="amazon" data-asin="${esc(prod.asin_observed)}" rel="sponsored nofollow noopener" target="_blank">${esc(tagged(prod.asin_observed))}</a><br><span class="link-note">Bare listing URL (source citation): <span class="mono">${esc(prod.listing_url)}</span></span></dd>
        <dt>Confirmation date</dt>
        <dd>${esc(prod.confirmation_date)}</dd>
        <dt>Submitted link(s)</dt>
        <dd>${submitted.map((s) => `<a href="${s.url}" data-sponsored="amazon" data-link-kind="provenance" data-citation="true" target="_blank" rel="sponsored nofollow noopener">${esc(s.url.replace("https://", ""))}</a> (${srcBadge(s.id, 2)})`).join("<br>")}</dd>
        <dt>Observed redirect target</dt>
        <dd><span class="mono" style="word-break:break-all">${esc(prod.observed_redirect_target)}</span><br><span class="link-note">Method: ${esc(prod.observed_method)} Observed ${esc(prod.observed_on)}. Recorded separately from the listing URL because the query parameters are session artefacts.</span></dd>
        <dt>Associates tracking confirmed</dt>
        <dd class="blank">No. ${esc(prod.associates_status)} <a href="../../flagged/#F01">F01</a></dd>
        <dt>Seller at time of check</dt>
        <dd>${prod.seller_observed ? esc(prod.seller_observed) : `<span class="blank">not recorded</span>`}</dd>
        <dt>Category path</dt>
        <dd>${prod.category_path.map((n) => `${esc(n.name)} <span class="mono">(${n.node})</span>`).join(" &rsaquo; ")}</dd>
        <dt>Price, rating, review count</dt>
        <dd class="blank">Deliberately not published &mdash; requires Amazon-served link or Creators/PA API. <a href="../../flagged/#F07">F07</a> ${srcBadge("S01", 2)}</dd>
      </dl>
    </div>
  </div>
</section>

${specTableHtml}

${buyBlock(prod, 2)}

<section class="block">
  <div class="wrap">
    <div class="callout warn">
      <h3>Not tested here</h3>
      <p>This site has not bought, unboxed, installed or used this product, and has no customer reviews or photographs to draw on. Everything above describes the listing and the decision, not an experience. FTC guidance is explicit that you cannot describe experience with a product you have not tried. ${srcBadge("S03", 2)}</p>
    </div>
  </div>
</section>

${gs.length ? `<section class="block"><div class="wrap">
  <div class="section-head"><div><h2>Guides that go with it</h2></div></div>
  <div class="shelf">${gs.map((g) => guideCard(g, 2)).join("")}</div>
</div></section>` : ""}`;

  add(`products/${prod.slug}/index.html`, layout({
    title: `${prod.short_title} — listing checked ${prod.confirmation_date} | ${site.name}`,
    description: `${prod.short_title}. ASIN ${prod.asin_observed}. ${prod.buyer_fit}`,
    depth: 2,
    urlPath: `products/${prod.slug}/`,
    current: "products/",
    page: "product",
    jsonld: [crumbLd([["", "Home"], ["products/", "All products"], [`products/${prod.category}/`, cat.name], [`products/${prod.slug}/`, prod.short_title]])],
    body: crumbs([["", "Home"], ["products/", "All products"], [`products/${cat.slug}/`, cat.name], [`products/${prod.slug}/`, prod.short_title]], 2) + body
  }));
}

/* ---- guides index ---- */

{
  const body = `
<div class="wrap page-head">
  <p class="kicker">Editorial &middot; ${guideMeta.length} guides</p>
  <h1>Buying guides, written as questions</h1>
  <p class="standfirst">One guide a week for the first month, each tied to a category that has a verified product. They are questions because the useful part of a buying decision is usually a measurement, not a ranking.</p>
</div>
<div class="wrap">
  <div class="callout">
    <h3>What these guides do not claim</h3>
    <p>${esc(guidesNote)}</p>
  </div>
  <div class="table-wrap" style="margin-top:18px">
    <table>
      <caption>Publishing cadence for this issue. All four published ${esc(site.built_display)}; later issues add one guide at a time.</caption>
      <thead><tr><th scope="col">Week</th><th scope="col">Guide</th><th scope="col">Category</th><th scope="col">Reader intent</th><th scope="col">Published</th><th scope="col">Source</th></tr></thead>
      <tbody>
        ${guideMeta.map((g) => {
          const relProds = productsForGuide(g);
          const badges = relProds.length
            ? [...new Set(relProds.map((rp) => rp.confirmation_source))].map((id) => srcBadge(id, 1)).join(" ")
            : srcBadge("S01", 1);
          return `<tr>
          <td class="num">${g.week}</td>
          <td><a href="${g.slug}/"><strong>${esc(g.title)}</strong></a></td>
          <td><a href="../products/${g.category}/">${esc(catOf(g.category).name)}</a></td>
          <td>${esc(g.intent)}</td>
          <td>${esc(g.published)}</td>
          <td>${badges}</td>
        </tr>`;
        }).join("")}
      </tbody>
    </table>
  </div>
  <div class="shelf" style="margin-top:22px">${guideMeta.map((g) => guideCard(g, 1)).join("")}</div>

  <h2 style="margin-top:34px">Working-title editorial hypotheses (countertop appliances)</h2>
  <p class="prose">The four buyer-question titles supplied in the project brief are presented below strictly as <strong>working-title editorial hypotheses</strong>—never as claims about popularity, search volume, or product superiority. Because none of the submitted links resolved to a countertop appliance (<a href="../flagged/#F03">F03</a>), no unsubmitted appliance ASINs are invented here; full working checklists are also preserved in our <a href="../archive/practical-home/guides.html">archived Practical Home edition</a>.</p>
  <div class="table-wrap" style="margin-top:14px">
    <table>
      <caption>Working-title editorial hypotheses for kitchen appliance comparisons. Every row cites official USDA food-safety guidance.</caption>
      <thead><tr><th scope="col">Working title (editorial hypothesis)</th><th scope="col">Core buyer comparison checklist</th><th scope="col">Catalog status</th><th scope="col">Official reference</th></tr></thead>
      <tbody>
        <tr>
          <td><strong>Basket or oven-style air fryer: what should you compare?</strong></td>
          <td>Compare single-layer cooking footprint, front door vs. drawer clearance, and heat-safe unloading space on the counter.</td>
          <td><span class="badge warn">Working hypothesis (no ASIN submitted)</span></td>
          <td>${srcBadge("S25", 1, "USDA FSIS")}</td>
        </tr>
        <tr>
          <td><strong>A no-hype checklist for comparing air fryer capacity</strong></td>
          <td>Size for weeknight single-layer portions rather than total liter volume; overcrowding restricts rapid air circulation.</td>
          <td><span class="badge warn">Working hypothesis (no ASIN submitted)</span></td>
          <td>${srcBadge("S25", 1, "USDA FSIS")}</td>
        </tr>
        <tr>
          <td><strong>How to assess cleanup and counter-space trade-offs</strong></td>
          <td>Check rear/top ventilation clearance under upper cabinets and measure whether removable trays lie flat in your sink basin.</td>
          <td><span class="badge warn">Working hypothesis (no ASIN submitted)</span></td>
          <td>${srcBadge("S25", 1, "USDA FSIS")}</td>
        </tr>
        <tr>
          <td><strong>Questions to ask before buying a multi-function kitchen appliance</strong></td>
          <td>Verify weekly-use modes in the manufacturer manual and confirm cabinet storage room for idle racks and accessories.</td>
          <td><span class="badge warn">Working hypothesis (no ASIN submitted)</span></td>
          <td>${srcBadge("S25", 1, "USDA FSIS")}</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p class="link-note" style="margin-top:18px">The next topic will be chosen from measured queries, not instinct. Until an analytics endpoint is live, that measurement does not exist: <a href="../flagged/#F05">F05</a>, <a href="../measurement/">measurement page</a>.</p>
</div>`;

  add("guides/index.html", layout({
    title: `Buying guides — DIY home upgrades | ${site.name}`,
    description: "Four question-shaped buying guides for peel-and-stick wallpaper tools and under-cabinet kitchen storage, with the measurements to take before ordering.",
    depth: 1,
    urlPath: "guides/",
    current: "guides/",
    page: "guides",
    jsonld: [crumbLd([["", "Home"], ["guides/", "Guides"]])],
    body: crumbs([["", "Home"], ["guides/", "Guides"]], 1) + body
  }));
}

/* ---- guide pages ---- */

for (const g of guideMeta) {
  const copy = guideCopy[g.slug];
  const cat = catOf(g.category);
  const relProds = productsForGuide(g);
  const others = guideMeta.filter((x) => x.slug !== g.slug).slice(0, 3);
  const body = `
<div class="wrap page-head">
  <p class="kicker">${esc(cat.name)} &middot; Week ${g.week} &middot; ${esc(g.published_display)}</p>
  <h1>${esc(g.title)}</h1>
  <p class="standfirst">${esc(g.dek)}</p>
  <div class="bylines">
    <span>No hands-on testing</span><span class="dot">&middot;</span>
    <span>No search-volume or popularity claims</span><span class="dot">&middot;</span>
    <span>Product claims quoted from the listing</span>
  </div>
</div>
<section class="wrap">
  <div class="prose">
    ${copy.intro}
    ${copy.body}
  </div>
  <div class="callout" style="max-width:72ch">
    <h3>Next step</h3>
    <p>${esc(g.next_step)}</p>
  </div>
</section>
${relProds.length ? `<section class="block"><div class="wrap">
  <div class="section-head"><div><h2>${relProds.length === 1 ? "The product this guide relates to" : "Products this guide relates to"}</h2><p>${relProds.length === 1 ? "One verified listing in this category. Not a recommendation, a reference point." : `${relProds.length} verified listings in this category. Not a ranking, a set of reference points.`}</p></div></div>
  <div class="shelf">${relProds.map((rp) => productCard(rp, 2)).join("")}</div>
</div></section>` : ""}
<section class="block"><div class="wrap">
  <div class="section-head"><div><h2>More guides</h2></div><a class="more" href="../../guides/">All guides &rarr;</a></div>
  <div class="shelf">${others.map((o) => guideCard(o, 2)).join("")}</div>
</div></section>`;

  add(`guides/${g.slug}/index.html`, layout({
    title: `${g.title} | ${site.name}`,
    description: g.dek,
    depth: 2,
    urlPath: `guides/${g.slug}/`,
    current: "guides/",
    page: "guide",
    guideSlug: g.slug,
    jsonld: [
      {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: g.title,
        description: g.dek,
        datePublished: g.published,
        dateModified: g.published,
        author: { "@type": "Organization", name: site.name, url: abs("") },
        publisher: { "@type": "Organization", name: site.name, url: abs("") },
        mainEntityOfPage: abs(`guides/${g.slug}/`),
        isAccessibleForFree: true
      },
      crumbLd([["", "Home"], ["guides/", "Guides"], [`guides/${g.slug}/`, g.title]])
    ],
    body: crumbs([["", "Home"], ["guides/", "Guides"], [`guides/${g.slug}/`, g.short_title]], 2) + body
  }));
}

/* ---- about / methodology ---- */

{
  const body = `
<div class="wrap page-head">
  <p class="kicker">Method</p>
  <h1>How this site verifies a product</h1>
  <p class="standfirst">The rule is simple and it is enforced by a script: every published value must trace to an official source, and anything that cannot is left blank and listed on the flagged page.</p>
</div>
<section class="wrap">
  <div class="prose">
    <h2>The five steps</h2>
    <ol>
      <li><strong>Resolve the link.</strong> Each supplied link is fetched once, and the final URL and page title are recorded. The redirect target is stored in its own field, never merged with the intended ASIN.</li>
      <li><strong>Read the listing.</strong> The listing title, category breadcrumb, and explicitly stated Product Information / Technical Details fields (such as brand, model number, dimensions, weight, and UPC when present) are copied verbatim, with the retrieval date.</li>
      <li><strong>Record the source.</strong> Every row carries an ID that maps to a URL in the <a href="../sources/">source register</a>.</li>
      <li><strong>Refuse the rest.</strong> Prices, star ratings, review counts, availability, commission rates and images are not published, because this site has no sanctioned route to them.</li>
      <li><strong>Flag the gap.</strong> Anything unverified is written up at <a href="../flagged/">Flagged for review</a> with what it needs.</li>
    </ol>

    <h2>What &ldquo;verified&rdquo; means here, and what it does not</h2>
    <p><strong>Verified</strong> means: on the date shown, a fetch returned a live listing page whose title, breadcrumb, and Product Information fields matched what is published here. That is all it means. It does not mean the product is good, that the price is what you will pay, or that the listing will still exist next month.</p>
    <p><strong>Not verified</strong> means the value is blank, or the sentence says so explicitly. Inference is not used to fill a gap. Where a UPC or Date First Available is absent from an official listing table, that cell stays blank and badged unverified.</p>

    <h2>Why the shop has no prices or star ratings</h2>
    <p>Amazon&rsquo;s Associates Program Policies allow a site to show prices and availability only if Amazon serves the link containing that data, or if the data comes from the Creators API or PA API. Customer reviews and star ratings are restricted the same way. This site has neither an API licence nor an Amazon-served widget, so those numbers are omitted. ${srcBadge("S01", 2)}</p>
    <p>There is a second reason, and it is editorial rather than legal: a price scraped into a static page is wrong the moment it is built. A shop that shows a wrong price is worse than one that sends you to the live listing.</p>

    <h2>Why nothing here claims experience</h2>
    <p>FTC guidance says you cannot talk about your experience with a product you have not tried. No product on this site has been bought or used, so the copy describes the listing and the buying decision, and product pages say so on the page. ${srcBadge("S03", 2)}</p>

    <h2>Automation, and the rule that governs it</h2>
    <p>Amazon&rsquo;s current program terms add explicit Agent Terms: software that accesses program content must identify itself in its user agent as <span class="mono">Agent/[agent name]</span>, must not conceal that it is automated, and must not circumvent measures meant to distinguish computers from humans. ${srcBadge("S01", 2)}</p>
    <div class="callout warn">
      <p><strong>The verification fetches for this issue did not set that user agent, and no Associates credential was used.</strong> That is recorded as irregularity <a href="../flagged/#F13">F13</a> rather than quietly fixed, because it changes what an automated build of this site is allowed to do next.</p>
    </div>

    <h2>What is automated, and what is gated</h2>
    <div class="table-wrap" style="margin:18px 0">
      <table>
        <caption>Automation boundaries for this build.</caption>
        <thead><tr><th scope="col">Step</th><th scope="col">Automated?</th><th scope="col">Gate</th></tr></thead>
        <tbody>
          <tr><td>Page build from <span class="mono">data/*.json</span></td><td>Yes</td><td>Build fails if data is malformed ${srcBadge("S07", 1)}</td></tr>
          <tr><td>Link, disclosure and sitemap checks</td><td>Yes</td><td><span class="mono">scripts/validate.mjs</span> must pass before push ${srcBadge("S01", 1)} ${srcBadge("S08", 1)}</td></tr>
          <tr><td>Event instrumentation</td><td>Yes</td><td>No endpoint until one is deployed (<a href="../flagged/#F05">F05</a>) ${srcBadge("S14", 1)}</td></tr>
          <tr><td>Publishing a product value</td><td>No</td><td>Manual read of an official source, with the source ID recorded ${srcBadge("S03", 1)}</td></tr>
          <tr><td>Commission, conversion or revenue figures</td><td>No</td><td>First-party report only, dated, in the <a href="../ledger/">ledger</a> ${srcBadge("S23", 1)}</td></tr>
          <tr><td>Associates link enrolment</td><td>No</td><td>Associates Central sign-in (<a href="../flagged/#F01">F01</a>) ${srcBadge("S02", 1)}</td></tr>
        </tbody>
      </table>
    </div>

    <h2>What this site is not</h2>
    <p>It is not a review site, and it does not rank products. With one verified product per category, a ranking would be an invention. It is also not affiliated with Amazon beyond participation in the Associates program.</p>
  </div>
</section>`;

  add("about/index.html", layout({
    title: `How we verify a product — method and limits | ${site.name}`,
    description: "The verification method behind every product page: resolve the link, read the listing, record the source, refuse what cannot be sourced, flag the gap.",
    depth: 1,
    urlPath: "about/",
    current: "about/",
    page: "about",
    jsonld: [crumbLd([["", "Home"], ["about/", "How we verify"]])],
    body: crumbs([["", "Home"], ["about/", "How we verify"]], 1) + body
  }));
}

/* ---- disclosures ---- */

{
  const body = `
<div class="wrap page-head">
  <p class="kicker">Compliance</p>
  <h1>Disclosures</h1>
  <p class="standfirst">Who earns what, where the disclosure appears, and which program rules shape this site. Each statement below is tied to a source you can open.</p>
</div>
<section class="wrap">
  <div class="prose">
    <h2>Affiliate disclosure</h2>
    <p>${esc(site.disclosure_long)}</p>
    <p>The tracking ID used on this site is <span class="mono">${esc(TAG)}</span>. It was supplied by the site owner. This site does not claim that the ID is enrolled or active in an Associates account: that confirmation requires signing in to Associates Central and is flagged as <a href="../flagged/#F01">F01</a> and <a href="../flagged/#F12">F12</a>.</p>

    <h2>Where the disclosure appears</h2>
    <ul>
      <li><strong>A strip directly under the masthead</strong> on every page, above the content, marked <em>Sponsored</em>, with a link to this page.</li>
      <li><strong>Repeated in the footer</strong> of every page, in the affiliate paragraph.</li>
      <li><strong>On the link itself</strong>: every outbound product link to Amazon is labelled <em>Sponsored</em> and carries <span class="mono">rel="sponsored nofollow noopener"</span> per Google&rsquo;s outbound link qualification guidance. ${srcBadge("S27", 1)}</li>
    </ul>
    <p>FTC guidance asks for a disclosure that is hard to miss, placed with the endorsement rather than only on an about page, in simple language such as &ldquo;advertisement&rdquo;, &ldquo;ad&rdquo; or &ldquo;sponsored&rdquo;. That is why the strip sits under the masthead rather than in a footer-only position, and why the word used is <em>Sponsored</em>. ${srcBadge("S03", 2)}</p>
    <p>Amazon&rsquo;s program terms also require Associates to satisfy applicable disclosure law and to disclose cookies, pixels and third-party data collection accurately. This site sets no cookies and makes no third-party requests, which is stated on the <a href="../measurement/">measurement page</a>. ${srcBadge("S01", 2)}</p>

    <h2>How links are built</h2>
    <p>Outbound product links go to <span class="mono">https://www.amazon.com/dp/&lt;ASIN&gt;?tag=${esc(TAG)}</span>. Amazon&rsquo;s Participation Requirements require the Associates tag to appear as a parameter in the link URL. ${srcBadge("S01", 2)} ${srcBadge("S24", 1)}</p>
    <p>No redirector, cloaker or link shortener sits in front of these links, and clicks are not intercepted: a click is recorded and the browser navigates straight to Amazon. Amazon&rsquo;s policies prohibit obscuring the URL containing Special Links, and prohibit shortening links in a way that makes it unclear you are linking to an Amazon Site. ${srcBadge("S01", 2)}</p>
    <p>The three short links supplied by the site owner are published only as provenance records on the product pages and in the <a href="../ledger/">ledger</a>, labelled as unvalidated. They are not used as the call to action. The reasons are on <a href="../flagged/#F01">F01</a>.</p>

    <h2>What is deliberately not published</h2>
    <div class="table-wrap" style="margin:18px 0">
      <table>
        <caption>Omitted data and the rule that drives the omission.</caption>
        <thead><tr><th scope="col">Data</th><th scope="col">Status</th><th scope="col">Reason and source</th></tr></thead>
        <tbody>
          <tr><td>Prices and availability</td><td>Not published</td><td>Only via Amazon-served links or Creators API (PA-API 5.0 deprecated) ${srcBadge("S01", 2)} ${srcBadge("S26", 1)}</td></tr>
          <tr><td>Star ratings and customer reviews</td><td>Not published</td><td>Only via Creators API (PA-API 5.0 deprecated) ${srcBadge("S01", 2)} ${srcBadge("S26", 1)}</td></tr>
          <tr><td>Price tracking or price alerts</td><td>Not built</td><td>Not permitted without agreement ${srcBadge("S01", 2)}</td></tr>
          <tr><td>Product photos and Amazon marks</td><td>Not used</td><td>Program content carries its own licence ${srcBadge("S01", 2)} ${srcBadge("S02", 2)}</td></tr>
          <tr><td>Commission rates and earnings</td><td>Not published</td><td>Account custom rate card requires sign-in ${srcBadge("S17", 1)}; public standard table cited only as category bounds ${srcBadge("S23", 1)}</td></tr>
          <tr><td>Conversion scores and revenue forecasts</td><td>Not published</td><td>No first-party data exists; nothing is modelled ${srcBadge("S03", 1)}</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Privacy, in one paragraph</h2>
    <p>No cookies. No third-party scripts, fonts, images or pixels. No advertising identifiers. Measurement is five defined events, queued in your own browser and sent nowhere until an endpoint is configured; if your browser sends Do Not Track or Global Privacy Control, the site records nothing. Details and the current deployment status are on the <a href="../measurement/">measurement page</a>.</p>

    <h2>Trademarks</h2>
    <p>Amazon and Amazon.com are trademarks of Amazon.com, Inc. or its affiliates. This site uses the name only to say where a link goes. It is not endorsed by or sponsored by Amazon, and it is not an Amazon site.</p>

    <h2>Corrections</h2>
    <p>Every claim on this site is one click from its source through the <a href="../sources/">source register</a>. If a source has changed, the row is wrong and should be corrected: the flagged page is the place where disagreements and gaps are already listed.</p>
  </div>
</section>`;

  add("disclosures/index.html", layout({
    title: `Disclosures — affiliate, privacy and data | ${site.name}`,
    description: "Amazon Associates disclosure, where it appears on every page, how links are built, and the data this site deliberately does not publish.",
    depth: 1,
    urlPath: "disclosures/",
    current: "",
    page: "disclosures",
    jsonld: [crumbLd([["", "Home"], ["disclosures/", "Disclosures"]])],
    body: crumbs([["", "Home"], ["disclosures/", "Disclosures"]], 1) + body
  }));
}

/* ---- sources register ---- */

{
  const rows = sourceList.map((s) => {
    const badge = s.verified ? `<span class="badge ok">Read</span>` : `<span class="badge warn">${s.type === "unavailable" ? "No access" : "Secondary"}</span>`;
    return `<tr id="${s.id}">
      <td class="mono">${s.id}</td>
      <td><a href="${s.url}" data-citation="true" target="_blank" rel="noopener">${esc(s.title)}</a><br><span class="link-note">${esc(s.url)}</span></td>
      <td>${esc(s.publisher)}</td>
      <td>${esc(s.page_date)}</td>
      <td>${esc(s.retrieved)}</td>
      <td>${badge}</td>
      <td><ul style="margin:0;padding-left:16px">${s.supports.map((x) => `<li style="margin-bottom:4px">${esc(x)}</li>`).join("")}</ul>
        ${s.quotes && s.quotes.length ? `<details style="margin-top:6px"><summary class="link-note">Quoted text (${s.quotes.length})</summary>${s.quotes.map((q) => `<blockquote style="margin:8px 0 0;padding-left:10px;border-left:2px solid var(--line-strong);font-size:13px">${esc(q)}</blockquote>`).join("")}</details>` : ""}
      </td>
    </tr>`;
  }).join("");

  const sgRows = parallelPasses.map((sg) => {
    const refUrl = sg.source_url.startsWith(BASE) ? SRC["S08"].url : sg.source_url;
    return `<tr id="${esc(sg.code)}">
      <td class="mono">${esc(sg.code)}</td>
      <td><strong>${esc(sg.area)}</strong></td>
      <td>${esc(sg.implementation)}</td>
      <td><span class="badge ${sg.status.startsWith("Done") ? "ok" : "warn"}">${esc(sg.status)}</span></td>
      <td>${extCiteLink(refUrl, "Official reference")}${sg.code === "SG-28" ? ` &middot; <a href="../feed.xml">feed.xml</a>` : ""}</td>
    </tr>`;
  }).join("");

  const allSpecRows = productSpecs.flatMap((spec) =>
    spec.attributes.map((attr) => `<tr>
      <td class="mono">${esc(spec.observed_asin)}</td>
      <td>${esc(attr.field)}</td>
      <td>${attr.value !== "" ? esc(attr.value) : ""}</td>
      <td><span class="badge ${attr.status === "Verified" ? "ok" : "warn"}">${esc(attr.status)}</span></td>
      <td>${extCiteLink(attr.source_url, attr.source_label)}</td>
    </tr>`)
  ).join("");

  const body = `
<div class="wrap page-head">
  <p class="kicker">Provenance &middot; ${sourceList.length} sources + SG-27..SG-30</p>
  <h1>Source register</h1>
  <p class="standfirst">Every source used on this site, what it supports, when it was retrieved, and whether it could actually be read. Two entries are marked as unreadable on purpose: pretending otherwise is how a register becomes decoration.</p>
</div>
<div class="wrap">
  <div class="callout">
    <h3>Reading the badges</h3>
    <p><span class="badge ok">Read</span> means the page was retrieved and the quoted text was read on it. <span class="badge warn">Secondary</span> means the page is not first-party documentation and is used only to explain a gap. <span class="badge warn">No access</span> means the page exists but sits behind a sign-in wall, so nothing was cited from it.</p>
  </div>
  <div class="table-wrap">
    <table>
      <caption>${esc(readJson("data/sources.json").method)}</caption>
      <thead><tr><th scope="col">ID</th><th scope="col">Source</th><th scope="col">Publisher</th><th scope="col">Page date</th><th scope="col">Retrieved</th><th scope="col">Status</th><th scope="col">What it supports</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </div>

  <h2 style="margin-top:34px">Parallel publication passes (SG-27..SG-30)</h2>
  <div class="table-wrap" style="margin-top:12px">
    <table>
      <caption>Navigation labels, shipped RSS 2.0 feed, Search Console readiness, and privacy-preserving reader capture.</caption>
      <thead><tr><th scope="col">Pass ID</th><th scope="col">Area</th><th scope="col">Verified implementation</th><th scope="col">Status</th><th scope="col">Official source</th></tr></thead>
      <tbody>${sgRows}</tbody>
    </table>
  </div>

  <h2 style="margin-top:34px">Consolidated 52-row product attribute verification table</h2>
  <p class="prose">Every catalog attribute read from the three resolved Amazon detail pages on ${esc(site.built_display)}. Blank value cells represent unverified or gated attributes and are never inferred.</p>
  <div class="table-wrap" style="margin-top:12px">
    <table>
      <caption>Line-by-line product specification checks across ASINs B08FKW9JRM, B0BSKQW2T2, and B08DY9HRWD.</caption>
      <thead><tr><th scope="col">Observed ASIN</th><th scope="col">Attribute</th><th scope="col">Confirmed value (blank = unverified)</th><th scope="col">Status</th><th scope="col">Official source</th></tr></thead>
      <tbody>${allSpecRows}</tbody>
    </table>
  </div>
  <p class="link-note" style="margin-top:12px">Machine-readable copies: <a href="../data/sources.json">data/sources.json</a> &middot; <a href="../data/product-specs.json">data/product-specs.json</a> &middot; <a href="../data/verified-sources.json">data/verified-sources.json</a>.</p>
</div>`;

  add("sources/index.html", layout({
    title: `Source register — ${sourceList.length} official sources | ${site.name}`,
    description: "Every source behind this site: Amazon Associates policies and operating agreement, FTC disclosure guidance, Google and GitHub documentation, and the live Amazon listings.",
    depth: 1,
    urlPath: "sources/",
    current: "",
    page: "sources",
    jsonld: [crumbLd([["", "Home"], ["sources/", "Source register"]])],
    body: crumbs([["", "Home"], ["sources/", "Source register"]], 1) + body
  }));
}

/* ---- flagged ---- */

{
  const order = { high: 0, medium: 1, low: 2, info: 3 };
  const sorted = flagged.slice().sort((a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id));
  const counts = { high: 0, medium: 0, low: 0, info: 0 };
  flagged.forEach((f) => counts[f.severity]++);

  const body = `
<div class="wrap page-head">
  <p class="kicker">Open items &middot; ${flagged.length} flagged</p>
  <h1>Flagged for review</h1>
  <p class="standfirst">Everything this build could not confirm, could not access, or chose not to publish, with the source that explains it and what would close it. None of these block the site: they are published so they can be reviewed after the fact.</p>
</div>
<div class="wrap">
  <div class="stat-grid">
    <div class="stat"><span class="n">${counts.high}</span><span class="l">High severity</span></div>
    <div class="stat"><span class="n">${counts.medium}</span><span class="l">Medium</span></div>
    <div class="stat"><span class="n">${counts.low}</span><span class="l">Low</span></div>
    <div class="stat"><span class="n">${counts.info}</span><span class="l">Withheld by design</span></div>
  </div>
  <div class="table-wrap">
    <table>
      <caption>${esc(readJson("data/flagged.json").legend)}</caption>
      <thead><tr><th scope="col">ID</th><th scope="col">Severity</th><th scope="col">Finding</th><th scope="col">What would close it</th><th scope="col">Sources</th></tr></thead>
      <tbody>
        ${sorted.map((f) => `<tr id="${f.id}" style="scroll-margin-top:80px">
          <td class="mono">${f.id}</td>
          <td><span class="badge ${f.severity}">${f.severity === "info" ? "withheld" : f.severity}</span></td>
          <td><strong>${esc(f.title)}</strong><br><span class="link-note">${esc(f.what)}</span></td>
          <td><span class="link-note">${esc(f.needs)}</span></td>
          <td>${f.sources.length ? f.sources.map((id) => srcBadge(id, 1)).join(" ") : `<span class="blank">none</span>`}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>
</div>
<section class="block"><div class="wrap">
  <div class="section-head"><div><h2>The detail, item by item</h2><p>Why each one matters, and what this build did about it.</p></div></div>
  <div class="grid-2">
    ${sorted.map((f) => `<article class="card" style="scroll-margin-top:80px">
      <p><span class="badge ${f.severity}">${f.severity === "info" ? "withheld" : f.severity}</span> <span class="mono link-note">${f.id}</span></p>
      <h3 class="card-title">${esc(f.title)}</h3>
      <p><strong>Why it matters.</strong> ${esc(f.why_it_matters)}</p>
      <p><strong>What this build did.</strong> ${esc(f.action)}</p>
      <p class="link-note"><strong>Recorded status:</strong> ${esc(f.status)}</p>
      ${f.sources.length ? `<p class="link-note">Sources: ${f.sources.map((id) => srcBadge(id, 1)).join(" ")}</p>` : ""}
    </article>`).join("")}
  </div>
</div></section>`;

  add("flagged/index.html", layout({
    title: `Flagged for review — ${flagged.length} open items | ${site.name}`,
    description: "Every unverified value, unreadable source and withheld data point on this site, with the source that explains it and what would close it.",
    depth: 1,
    urlPath: "flagged/",
    current: "",
    page: "flagged",
    jsonld: [crumbLd([["", "Home"], ["flagged/", "Flagged for review"]])],
    body: crumbs([["", "Home"], ["flagged/", "Flagged for review"]], 1) + body
  }));
}

/* ---- measurement ---- */

{
  const body = `
<div class="wrap page-head">
  <p class="kicker">Measurement</p>
  <h1>What is measured, and what is not</h1>
  <p class="standfirst">Five events, defined in advance, recorded in the visitor&rsquo;s browser, and sent nowhere until an endpoint exists. This page is the honest status of that, not a dashboard of numbers that do not exist.</p>
</div>
<div class="wrap">
  <div class="callout warn">
    <h3>Current status: instrumented, not collecting</h3>
    <p><strong>Endpoint configured:</strong> ${site.analytics.endpoint ? `<span class="mono">${esc(site.analytics.endpoint)}</span>` : `<span class="blank">none</span>`}. With no endpoint, no event leaves the browser: the five events accumulate in this browser&rsquo;s local storage and appear in the table at the bottom of this page. That is a real limitation, recorded as <a href="../flagged/#F05">F05</a>, not a placeholder pretending to be analytics.</p>
  </div>

  <h2 style="margin-top:30px">The five events</h2>
  <div class="table-wrap">
    <table>
      <caption>Event contract for <span class="mono">site_id: ${esc(site.analytics.site_id)}</span>. Payload fields are the complete list sent for each event.</caption>
      <thead><tr><th scope="col">#</th><th scope="col">Event</th><th scope="col">Fires when</th><th scope="col">Payload</th><th scope="col">Question it answers</th><th scope="col">Policy basis</th></tr></thead>
      <tbody>
        ${events.map((e, i) => `<tr>
          <td class="num">${i + 1}</td>
          <td><span class="mono">${esc(e.id)}</span></td>
          <td>${esc(e.when)}</td>
          <td>${e.payload.map((x) => `<span class="mono link-note">${esc(x)}</span>`).join(" ")}</td>
          <td>${esc(e.why)}</td>
          <td>${srcBadge("S01", 1)} ${srcBadge("S03", 1)}</td>
        </tr>`).join("")}
      </tbody>
    </table>
  </div>

  <h2 style="margin-top:30px">Privacy rules, enforced in code</h2>
  <ul class="prose" style="max-width:72ch">
    <li>No cookies are set, and none are read.</li>
    <li>No third-party scripts, fonts, images or pixels are loaded. The page makes no request off this domain except when a visitor clicks a Sponsored link.</li>
    <li>The session identifier lives in <span class="mono">sessionStorage</span> and dies with the tab.</li>
    <li>The referrer is reduced to a class (<span class="mono">none</span>, <span class="mono">internal</span>, <span class="mono">search</span>, <span class="mono">external</span>); the full URL is never stored.</li>
    <li>No IP address, user agent or location is recorded by the client. The collector is specified to discard the connecting IP.</li>
    <li>If the browser sets Do Not Track or Global Privacy Control, no event is recorded at all.</li>
    <li>The local queue is capped at 200 events and can be cleared or exported below.</li>
  </ul>

  <h2 style="margin-top:30px">To turn collection on</h2>
  <ol class="prose" style="max-width:72ch">
    <li>Deploy either the Cloudflare Worker collector in <a href="../worker/collect.js">worker/collect.js</a> or the self-hosted Node.js collector in <a href="../analytics-server/server.mjs">analytics-server/server.mjs</a> (both accept <span class="mono">POST /collect</span> with the JSON contract above).</li>
    <li>Put that URL in <span class="mono">data/site.json</span> under <span class="mono">analytics.endpoint</span>, then run <span class="mono">node scripts/build.mjs</span>. The value is written into <span class="mono">assets/js/config.js</span> at build time.</li>
    <li>Reload the site: events are sent with <span class="mono">navigator.sendBeacon</span>, so they survive the outbound click.</li>
    <li>Add a dated row to the <a href="../ledger/">campaign ledger</a> once a first-party report exists. Until then the ledger stays empty.</li>
  </ol>

  <h2 style="margin-top:30px">Search and indexing status</h2>
  <div class="table-wrap">
    <table>
      <caption>Findability checklist. Only what is true is ticked.</caption>
      <thead><tr><th scope="col">Item</th><th scope="col">Status</th><th scope="col">Detail</th></tr></thead>
      <tbody>
        <tr><td>One canonical host</td><td><span class="badge ok">Done</span></td><td>Canonical link on every page pointing at <span class="mono">${esc(BASE)}</span> ${srcBadge("S14", 1)}</td></tr>
        <tr><td>XML sitemap</td><td><span class="badge ok">Done</span></td><td><a href="../sitemap.xml">sitemap.xml</a>, referenced from <a href="../robots.txt">robots.txt</a> ${srcBadge("S08", 1)}</td></tr>
        <tr><td>RSS feed</td><td><span class="badge ok">Done</span></td><td><a href="../feed.xml">feed.xml</a>, RSS 2.0, also a valid sitemap format ${srcBadge("S08", 1)}</td></tr>
        <tr><td>robots.txt</td><td><span class="badge warn">Advisory only</span></td><td>Published at <a href="../robots.txt">/robots.txt</a> inside the project path, which is not the host root, so it may be ignored. The noindex meta tag is the real control. <a href="../flagged/#F14">F14</a> ${srcBadge("S19", 1)}</td></tr>
        <tr><td>Search Console property</td><td><span class="badge warn">Blocked</span></td><td>No verification token available; the build emits the meta tag as soon as one is supplied. <a href="../flagged/#F04">F04</a> ${srcBadge("S09", 1)}</td></tr>
        <tr><td>Measured queries</td><td><span class="badge warn">None yet</span></td><td>Requires Search Console plus a collection endpoint. No keyword volume is claimed anywhere on this site. ${srcBadge("S09", 1)}</td></tr>
      </tbody>
    </table>
  </div>

  <h2 style="margin-top:30px">Events held in this browser</h2>
  <p class="link-note" id="local-summary">Reading local storage&hellip;</p>
  <div class="table-tools">
    <button class="chip" type="button" id="export-events">Export JSON</button>
    <button class="chip" type="button" id="clear-events">Clear local events</button>
  </div>
  <div class="table-wrap" id="local-events"><p class="empty">Nothing recorded in this browser yet.</p></div>
  <p class="link-note" style="margin-top:12px">This table is your own browser only. It is not shared, not aggregated, and not visible to anyone else.</p>
</div>`;

  add("measurement/index.html", layout({
    title: `Measurement — five events, privacy rules, current status | ${site.name}`,
    description: "The five defined measurement events, the privacy rules enforced in code, what is not collection yet, and how to deploy the self-hosted collector.",
    depth: 1,
    urlPath: "measurement/",
    current: "",
    page: "measurement",
    jsonld: [crumbLd([["", "Home"], ["measurement/", "Measurement"]])],
    body: crumbs([["", "Home"], ["measurement/", "Measurement"]], 1) + body
  }));
}

/* ---- ledger ---- */

{
  const rawSubmissions = [
    { rowNum: 1, prod: products[0], dupNote: "" },
    { rowNum: 2, prod: products[1], dupNote: "" },
    { rowNum: 3, prod: products[1], dupNote: "Exact duplicate of submission 2 (F02)" },
    { rowNum: 4, prod: products[2], dupNote: "" }
  ];
  const intentRows = rawSubmissions.map(({ rowNum, prod, dupNote }) => {
    const s = SRC[prod.submitted_links[0]];
    return `<tr>
      <td><span class="mono">#${rowNum}</span> <a href="${s.url}" data-sponsored="amazon" data-link-kind="provenance" data-citation="true" target="_blank" rel="sponsored nofollow noopener" class="mono">${esc(s.url.replace("https://", ""))}</a>${dupNote ? `<br><span class="badge warn">${esc(dupNote)}</span>` : ""}</td>
      <td><span class="badge warn">Unverified (blank)</span></td>
      <td class="mono">${esc(prod.asin_observed)}</td>
      <td><a href="${tagged(prod.asin_observed)}" data-sponsored="amazon" data-asin="${esc(prod.asin_observed)}" rel="sponsored nofollow noopener" class="mono">dp/${esc(prod.asin_observed)}?tag=${esc(TAG)}</a></td>
      <td>${esc(prod.confirmation_date)}</td>
      <td>${srcBadge(prod.confirmation_source, 1)}</td>
      <td class="mono" style="word-break:break-all;max-width:280px">${esc(prod.observed_redirect_target.slice(0, 74))}&hellip;</td>
      <td><span class="badge warn">no</span></td>
    </tr>`;
  }).join("");

  const body = `
<div class="wrap page-head">
  <p class="kicker">Data surfaces</p>
  <h1>Product-intent record and campaign ledger</h1>
  <p class="standfirst">Two records that stay separate: what a link was supposed to point at, and what it actually returned. Below them, a campaign ledger with a defined schema and no rows, because no first-party report has been obtained.</p>
</div>

<section class="wrap">
  <h2>1. Product-intent confirmation record (all 4 submitted rows)</h2>
  <p class="prose">For each submitted link: the intended ASIN, the official listing URL, the confirmation date and the source, with the observed redirect target kept in its own field. Submission #3 repeats submission #2 (<a href="../flagged/#F02">F02</a>). Intended ASINs remain blank and unverified rather than merged with observed redirect targets.</p>
  <div class="table-wrap">
    <table>
      <caption>Published from <span class="mono">data/product-intents.csv</span>. Blank intended ASIN means unconfirmed operator intent, kept strictly separate from observed redirect ASINs.</caption>
      <thead><tr><th scope="col">Submitted link</th><th scope="col">Intended ASIN</th><th scope="col">Observed ASIN</th><th scope="col">Official listing URL</th><th scope="col">Confirmed</th><th scope="col">Source</th><th scope="col">Observed redirect target</th><th scope="col">Tracking confirmed</th></tr></thead>
      <tbody>${intentRows}</tbody>
    </table>
  </div>
  <p class="link-note" style="margin-top:10px">Official Amazon ASIN definition: ${srcBadge("S24", 1)} (plus Seller Central notes on <a href="../flagged/#F06">F06</a>).</p>
</section>

<section class="block">
  <div class="wrap">
    <h2>2. Campaign ledger</h2>
    <p class="prose">Empty by design. A row is added only from an authorised first-party report, with the timestamp, the source, the channel, eligible sessions, clicks and reported orders. Blank means &ldquo;not obtained&rdquo;; it never means zero. No conversion score, revenue forecast or commission percentage is presented anywhere on this site, because the rate card and reports both require a sign-in this build did not have.</p>
    <div class="table-wrap">
      <table>
        <thead><tr><th scope="col">record_id</th><th scope="col">timestamp_utc</th><th scope="col">source</th><th scope="col">channel</th><th scope="col" class="num">eligible_sessions</th><th scope="col" class="num">outbound_clicks</th><th scope="col" class="num">reported_orders</th><th scope="col" class="num">revenue_reported</th><th scope="col">provenance_url</th></tr></thead>
        <tbody></tbody>
      </table>
      <p class="empty">0 rows. No first-party report has been obtained, so this table has nothing to show and nothing has been estimated.</p>
    </div>
    <p class="link-note" style="margin-top:10px">Schema and column rules: <a href="../data/ledger-schema.md">data/ledger-schema.md</a> &middot; CSV: <a href="../data/campaign-ledger.csv">data/campaign-ledger.csv</a> &middot; Intent CSV: <a href="../data/product-intents.csv">data/product-intents.csv</a></p>
  </div>
</section>`;

  add("ledger/index.html", layout({
    title: `Product-intent record and empty campaign ledger | ${site.name}`,
    description: "The product-intent confirmation record, with intended ASIN and observed redirect in separate fields, and a campaign ledger that is empty because no first-party report exists.",
    depth: 1,
    urlPath: "ledger/",
    current: "ledger/",
    page: "ledger",
    jsonld: [crumbLd([["", "Home"], ["ledger/", "Ledger"]])],
    body: crumbs([["", "Home"], ["ledger/", "Ledger"]], 1) + body
  }));
}

/* ---- automation & compliance gate ---- */

{
  const autoBody = `
<div class="wrap page-head">
  <p class="kicker">Trustworthy machinery</p>
  <h1>Automation &amp; compliance gate</h1>
  <p class="standfirst">Automate deterministic checks—HTML generation, link tagging, disclosure placement, XML feeds, and line-by-line source auditing—and put hard compliance gates in front of product intent, Creators API credentials, and first-party Associates reports.</p>
</div>
<section class="wrap">
  <div class="callout">
    <h3>CLI verification commands</h3>
    <p><span class="mono">node scripts/build.mjs &amp;&amp; node scripts/validate.mjs</span> &middot; Rebuilds every page from <span class="mono">data/*.json</span> and enforces disclosures, <span class="mono">rel="sponsored nofollow"</span>, single affiliate tag, sitemap, and table-row citations.<br>
    <span class="mono">python3 scripts/platform_engine.py audit</span> &middot; Audits all 52 product specification rows, 25 sources, and blank unverified fields.<br>
    <span class="mono">python3 -m unittest discover -s tests -v</span> &middot; Runs automated compliance, Special Link, Creators API cache-TTL, and campaign-ledger tests.</p>
  </div>

  <h2 style="margin-top:28px">7-stage publishing &amp; policy gate</h2>
  <div class="table-wrap">
    <table>
      <caption>Automated checks vs. human-gated compliance steps across the repository.</caption>
      <thead><tr><th scope="col">Stage</th><th scope="col">Mode</th><th scope="col">Rule enforced</th><th scope="col">Status</th><th scope="col">Official policy</th></tr></thead>
      <tbody>
        <tr><td><strong>1. Product-intent vs. redirect separation</strong></td><td>Automated + Human gate</td><td>Keeps <span class="mono">intended_asin</span> (<span class="mono">null</span>) strictly separate from <span class="mono">asin_observed</span> and <span class="mono">observed_redirect_target</span>; rejects 9-character <span class="mono">link.amazon</span> share tokens as ASINs.</td><td><span class="badge ok">Enforced</span></td><td>${srcBadge("S24", 1)} ${srcBadge("S10", 1)}</td></tr>
        <tr><td><strong>2. Special Link tagging &amp; short-link boundary</strong></td><td>Automated + Associates gate</td><td>Formats outbound product links as <span class="mono">dp/&lt;ASIN&gt;?tag=${esc(TAG)}</span> without cloaking; records supplied <span class="mono">link.amazon</span> URLs as unresolved rather than claiming invalidity (<a href="../flagged/#F01">F01</a>).</td><td><span class="badge warn">Enrolment pending</span></td><td>${srcBadge("S01", 1)} ${srcBadge("S02", 1)}</td></tr>
        <tr><td><strong>3. Above-fold &amp; footer disclosures</strong></td><td>Automated (<span class="mono">validate.mjs</span>)</td><td>Requires the masthead Sponsored disclosure strip above the fold and the footer affiliate disclosure on 100% of pages.</td><td><span class="badge ok">Passing</span></td><td>${srcBadge("S03", 1)} ${srcBadge("S02", 1)}</td></tr>
        <tr><td><strong>4. Line-by-line source &amp; blank-field audit</strong></td><td>Automated (<span class="mono">platform_engine.py</span>)</td><td>Requires an official <span class="mono">https://</span> citation on every table row and keeps unverified attributes blank.</td><td><span class="badge ok">Passing</span></td><td>${srcBadge("S03", 1)}</td></tr>
        <tr><td><strong>5. Creators API price, rating &amp; image gate</strong></td><td>Policy gate (<span class="mono">creators_api_client.py</span>)</td><td>Blocks static prices, ratings, and hotlinked Amazon images; enforces &le;24h UTC-stamped cache TTL once Creators API credentials are added (PA-API 5.0 deprecated).</td><td><span class="badge warn">Gated (F07/F09)</span></td><td>${srcBadge("S01", 1)} ${srcBadge("S18", 1)} ${srcBadge("S26", 1)}</td></tr>
        <tr><td><strong>6. Agent user-agent &amp; crawl discipline</strong></td><td>Policy gate (<a href="../flagged/#F13">F13</a>)</td><td>Requires <span class="mono">Agent/[agent name]</span> user-agent identification and non-circumvention on any future automated Amazon fetches.</td><td><span class="badge warn">Documented</span></td><td>${srcBadge("S01", 1)}</td></tr>
        <tr><td><strong>7. Evidence-only campaign ledger</strong></td><td>Automated (<span class="mono">validate.mjs</span> + <span class="mono">ci.yml</span>)</td><td>Enforces empty ledger until authorized Associates reports exist; rejects fabricated conversion scores or revenue forecasts.</td><td><span class="badge ok">Passing</span></td><td>${srcBadge("S17", 1)} ${srcBadge("S23", 1)}</td></tr>
      </tbody>
    </table>
  </div>
</section>`;

  add("automation/index.html", layout({
    title: `Automation & compliance gate | ${site.name}`,
    description: "Automated static build, disclosure and link validation, Creators API policy wrapper, and human compliance gates for Amazon Associates.",
    depth: 1,
    urlPath: "automation/",
    current: "automation/",
    page: "automation",
    jsonld: [crumbLd([["", "Home"], ["automation/", "Automation & compliance gate"]])],
    body: crumbs([["", "Home"], ["automation/", "Automation & compliance gate"]], 1) + autoBody
  }));
}

/* ---- executive summary ---- */

{
  const pending = flagged.filter((f) => f.severity !== "info").length;
  const body = `
<div class="wrap page-head">
  <p class="kicker">Executive summary &middot; ${esc(site.built_display)}</p>
  <h1>What this build contains, and what it proved</h1>
  <p class="standfirst">One page for the reader who will not read the site: what was verified, what was refused, what is still blocked, and where every claim traces to.</p>
</div>
<section class="wrap">
  <div class="stat-grid">
    <div class="stat"><span class="n">${products.length}</span><span class="l">Products, each resolved from a supplied link to a live listing</span></div>
    <div class="stat"><span class="n">${guideMeta.length}</span><span class="l">Question-shaped guides, one per week of the issue</span></div>
    <div class="stat"><span class="n">${sourceList.length}</span><span class="l">Registered sources, ${sourceList.filter((s) => s.verified).length} read, ${sourceList.filter((s) => !s.verified).length} not readable</span></div>
    <div class="stat"><span class="n">${flagged.length}</span><span class="l">Items flagged for review (${pending} actionable, ${flagged.length - pending} withheld by design)</span></div>
  </div>

  <div class="prose">
    <h2>What was verified</h2>
    <ul>
      <li>Three supplied short links each resolved to a live Amazon product page, and the final URL and listing title were recorded: <span class="mono">B08FKW9JRM</span> (Art3d smoothing tool kit), <span class="mono">B0BSKQW2T2</span> (paper towel holder), <span class="mono">B08DY9HRWD</span> (ORDORA 8-tier pan organiser).</li>
      <li>The short-link tokens are not ASINs: they contain lowercase letters, and <span class="mono">/dp/B0HMGG4M2</span> returned no product page. ASINs are recorded from the resolved pages, in a separate field from the intended value.</li>
      <li>Amazon&rsquo;s Associates Program Policies and Operating Agreement were read directly, including the clauses that govern price display, review and rating display, link cloaking, link shortening, price tracking and automated agents.</li>
      <li>FTC disclosure guidance was read directly, and the disclosure strip placement follows it: under the masthead, above the content, on every page, repeated in the footer.</li>
      <li>GitHub Pages is enabled on this repository with the legacy build from <span class="mono">main:/</span>, so the site publishes from the repository root with no build step on GitHub&rsquo;s side.</li>
    </ul>

    <h2>What was refused</h2>
    <ul>
      <li>No prices, star ratings, review counts, availability or product images, because this site has no Amazon-served link widget and no Creators/PA API access.</li>
      <li>No commission percentages, conversion scores or revenue forecasts, because the rate schedule and the reports both require a sign-in.</li>
      <li>No hands-on experience claims, because nothing was bought or used.</li>
      <li>No inferred catalog values: where <span class="mono">UPC</span> or <span class="mono">Date First Available</span> is absent from an official listing table, the cell stays blank and badged unverified.</li>
      <li>No search-volume or popularity claims for any guide title.</li>
    </ul>

    <h2>What is still blocked</h2>
    <ol>
      ${flagged.filter((f) => f.severity === "high" || f.severity === "medium").map((f) => `<li><strong>${f.id} ${esc(f.title)}</strong> &mdash; ${esc(f.needs)}</li>`).join("")}
    </ol>

    <h2>How the site is built</h2>
    <p>Every page is generated from <span class="mono">data/*.json</span> by <span class="mono">scripts/build.mjs</span>. No page is hand-edited, so the disclosure strip, the navigation, the canonical URL and the link attributes cannot drift between pages. <span class="mono">scripts/validate.mjs</span> then enforces: one <span class="mono">h1</span> per page, a disclosure on every page, <span class="mono">rel="sponsored nofollow"</span> on every Amazon link, the correct tag on every product URL, no cloaked redirects, every internal link resolving, every page in the sitemap, and a well-formed feed.</p>

    <h2>Where the numbers will come from</h2>
    <p>Five events are instrumented and firing in the browser: <span class="mono">page_view</span>, <span class="mono">disclosure_view</span>, <span class="mono">outbound_click</span>, <span class="mono">site_search</span>, <span class="mono">guide_read</span>. They are queued locally and sent nowhere until an endpoint is deployed. The campaign ledger stays empty until a dated first-party report exists. That is the whole measurement story, and it is deliberately boring.</p>

    <h2>Release record</h2>
    <div class="table-wrap" style="margin:18px 0">
      <table>
        <caption>Only fields that are actually known are shown. Blank means not recorded, never zero.</caption>
        <tbody>
          <tr><th scope="row">Pull request</th><td>${release.pr_url ? `<a href="${esc(release.pr_url)}" target="_blank" rel="noopener">#${esc(release.pr_number)} — ${esc(release.pr_url)}</a>` : `<span class="blank">not recorded</span>`} ${srcBadge("S14", 1)}</td></tr>
          <tr><th scope="row">Merge commit</th><td>${release.merge_commit ? `<span class="mono">${esc(release.merge_commit)}</span>` : `<span class="blank">not recorded</span>`} ${srcBadge("S14", 1)}</td></tr>
          <tr><th scope="row">Merged at</th><td>${release.merged_at ? esc(release.merged_at) + " UTC" : `<span class="blank">not recorded</span>`} ${srcBadge("S14", 1)}</td></tr>
          <tr><th scope="row">Published URL</th><td><a href="${esc(release.pages_url)}" target="_blank" rel="noopener">${esc(release.pages_url)}</a> ${srcBadge("S14", 1)}</td></tr>
          <tr><th scope="row">Pages build</th><td>${esc(release.pages_status)} ${srcBadge("S14", 1)}</td></tr>
          <tr><th scope="row">Pages source</th><td><span class="mono">${esc(release.pages_source)}</span> (${esc(release.pages_build_type)}) ${srcBadge("S07", 1)}</td></tr>
        </tbody>
      </table>
    </div>

    <h2>Read next</h2>
    <ul>
      <li><a href="../sources/">Source register</a> &mdash; every source, SG-27..SG-30 passes, and 52 product spec rows</li>
      <li><a href="../flagged/">Flagged for review</a> &mdash; ${flagged.length} open items</li>
      <li><a href="../automation/">Automation &amp; compliance gate</a> &mdash; CLI checks and policy gates</li>
      <li><a href="../about/">How we verify</a> &mdash; method, limits and the automation boundary</li>
      <li><a href="../disclosures/">Disclosures</a> &mdash; affiliate, privacy and data omissions</li>
      <li><a href="../EXECUTIVE_SUMMARY.md">EXECUTIVE_SUMMARY.md</a> in the repository</li>
    </ul>
  </div>
</section>`;

  add("summary/index.html", layout({
    title: `Executive summary — what this build verified | ${site.name}`,
    description: "Executive summary: three products verified against live Amazon listings, four question-shaped guides, what was refused, and what remains blocked.",
    depth: 1,
    urlPath: "summary/",
    current: "",
    page: "summary",
    jsonld: [crumbLd([["", "Home"], ["summary/", "Executive summary"]])],
    body: crumbs([["", "Home"], ["summary/", "Executive summary"]], 1) + body
  }));
}

/* ---- search ---- */

{
  const indexData = [
    ...products.map((p) => ({
      title: p.short_title,
      path: `products/${p.slug}/`,
      url: abs(`products/${p.slug}/`),
      kind: "Product",
      summary: `${p.buyer_fit} ASIN ${p.asin_observed}.`,
      tags: [p.brand, p.category, p.asin_observed, "amazon", "sponsored"].filter(Boolean)
    })),
    ...CATS.map((c) => ({
      title: c.name,
      path: `products/${c.slug}/`,
      url: abs(`products/${c.slug}/`),
      kind: "Category",
      summary: c.blurb,
      tags: ["category", c.kicker, c.slug]
    })),
    ...guideMeta.map((g) => ({
      title: g.title,
      path: `guides/${g.slug}/`,
      url: abs(`guides/${g.slug}/`),
      kind: "Guide",
      summary: g.dek,
      tags: ["guide", g.category, g.short_title]
    })),
    { title: "All products", path: "products/", url: abs("products/"), kind: "Page", summary: "The verified product register with source links.", tags: ["table", "register"] },
    { title: "Side-by-side comparisons", path: "products/comparisons/", url: abs("products/comparisons/"), kind: "Page", summary: "Dimensions, materials, weights and catalog identifiers compared side by side.", tags: ["comparison", "dimensions", "specs"] },
    { title: "Guides", path: "guides/", url: abs("guides/"), kind: "Page", summary: "All buying guides, working-title hypotheses and publishing cadence.", tags: ["editorial", "air fryer"] },
    { title: "How we verify", path: "about/", url: abs("about/"), kind: "Page", summary: "Method, verification levels, automation boundaries.", tags: ["method", "sources"] },
    { title: "Automation & compliance gate", path: "automation/", url: abs("automation/"), kind: "Page", summary: "CLI checks, Special Link gate, Creators API TTL and human gates.", tags: ["automation", "gate", "cli"] },
    { title: "Disclosures", path: "disclosures/", url: abs("disclosures/"), kind: "Page", summary: "Affiliate disclosure, link policy, privacy, withheld data.", tags: ["affiliate", "ftc", "privacy"] },
    { title: "Source register", path: "sources/", url: abs("sources/"), kind: "Page", summary: "Every official source, SG-27..SG-30 passes, and 52 product spec rows.", tags: ["sources", "provenance", "SG-27"] },
    { title: "Flagged for review", path: "flagged/", url: abs("flagged/"), kind: "Page", summary: "Unverified values, unreadable sources and withheld data.", tags: ["verification", "issues"] },
    { title: "Measurement", path: "measurement/", url: abs("measurement/"), kind: "Page", summary: "The five events, privacy rules and current status.", tags: ["analytics", "events"] },
    { title: "Ledger", path: "ledger/", url: abs("ledger/"), kind: "Page", summary: "Product-intent record and the empty campaign ledger.", tags: ["data", "ledger"] },
    { title: "Executive summary", path: "summary/", url: abs("summary/"), kind: "Page", summary: "What this build verified, refused and left blocked.", tags: ["summary"] }
  ];

  const body = `
<div class="wrap page-head">
  <p class="kicker">Search</p>
  <h1>Search this site</h1>
  <p class="standfirst">Searches are recorded as the <span class="mono">site_search</span> event so the next guide can be chosen from what people actually typed. The query is stored, not who typed it.</p>
  <form class="table-tools" data-search-form action="./" method="get" role="search">
    <label for="q" style="position:absolute;left:-9999px">Search</label>
    <input class="search-input" id="q" name="q" type="search" placeholder="wallpaper, paper towel, cabinet, disclosures&hellip;" autocomplete="off">
    <button class="btn" type="submit">Search</button>
  </form>
  <p class="link-note" id="search-count">Type a word above to search the site.</p>
</div>
<div class="wrap" id="search-results"></div>`;

  add("search/index.html", layout({
    title: `Search | ${site.name}`,
    description: "Search the products, categories, guides and verification pages on this site.",
    depth: 1,
    urlPath: "search/",
    current: "search/",
    page: "search",
    noindex: true,
    indexData,
    body: crumbs([["", "Home"], ["search/", "Search"]], 1) + body
  }));
}

/* ---- 404 ---- */

{
  const body = `
<div class="wrap page-head">
  <p class="kicker">404</p>
  <h1>That page is not here</h1>
  <p class="standfirst">The link may be old, or the page may have moved when the site was rebuilt. These three are always a safe start.</p>
  <div class="btn-row">
    <a class="btn" href="./products/">All products</a>
    <a class="btn secondary" href="./guides/">Guides</a>
    <a class="btn secondary" href="./search/">Search</a>
  </div>
</div>`;

  add("404.html", layout({
    title: `Page not found | ${site.name}`,
    description: "That page is not here. Start from the product register, the guides, or search.",
    depth: 0,
    urlPath: null,
    current: "",
    page: "404",
    noindex: true,
    body
  }));
}

/* --------------------------------------------------------------- write out */

let written = 0;
for (const page of pages) {
  const target = path.join(ROOT, page.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, page.html);
  written++;
}

/* sitemap */
{
  const urls = pages
    .filter((p) => !p.file.endsWith("404.html") && !p.file.startsWith("search/"))
    .map((p) => {
      const urlPath = p.file.endsWith("index.html") ? p.file.slice(0, -"index.html".length) : p.file;
      return `  <url>\n    <loc>${esc(abs(urlPath))}</loc>\n    <lastmod>${site.built}</lastmod>\n    <changefreq>${urlPath === "" ? "weekly" : "monthly"}</changefreq>\n    <priority>${urlPath === "" ? "1.0" : urlPath.startsWith("guides/") || urlPath.startsWith("products/") ? "0.8" : "0.5"}</priority>\n  </url>`;
    })
    .join("\n");
  fs.writeFileSync(path.join(ROOT, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
}

/* feed */
{
  const items = [
    ...guideMeta.map((g) => ({
      title: g.title,
      link: abs(`guides/${g.slug}/`),
      desc: g.dek,
      date: g.published
    })),
    ...products.map((p) => ({
      title: `Listing checked: ${p.short_title}`,
      link: abs(`products/${p.slug}/`),
      desc: `${p.buyer_fit} ASIN ${p.asin_observed}, verified ${p.confirmation_date}.`,
      date: p.confirmation_date
    }))
  ];
  const body = items.map((i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <guid isPermaLink="true">${esc(i.link)}</guid>
      <description>${esc(i.desc)}</description>
      <pubDate>${new Date(`${i.date}T09:00:00Z`).toUTCString()}</pubDate>
    </item>`).join("\n");
  fs.writeFileSync(path.join(ROOT, "feed.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)} — new guides and checked listings</title>
    <link>${esc(BASE)}</link>
    <atom:link href="${esc(abs("feed.xml"))}" rel="self" type="application/rss+xml"/>
    <description>${esc(site.description)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date(`${site.built}T09:00:00Z`).toUTCString()}</lastBuildDate>
${body}
  </channel>
</rss>
`);
}

/* robots */
fs.writeFileSync(path.join(ROOT, "robots.txt"), `# ${site.name}
# Advisory only. This is a GitHub project site, so this file sits at /DIYHOME1/robots.txt
# and not at the host root that crawlers read (flagged as F14).
# The search page and the 404 page carry a noindex meta tag, which is the actual control.
User-agent: *
Allow: /
Disallow: /search/

Sitemap: ${abs("sitemap.xml")}
`);

/* config.js (generated — edit data/site.json instead) */
fs.writeFileSync(path.join(ROOT, "assets/js/config.js"), `/* Generated by scripts/build.mjs from data/site.json. Do not edit by hand. */
window.DIYHOME_CONFIG = {
  siteId: ${JSON.stringify(site.analytics.site_id)},
  endpoint: ${JSON.stringify(site.analytics.endpoint || "")},
  associateTag: ${JSON.stringify(TAG)},
  respectDnt: true
};
`);

/* .nojekyll so GitHub Pages serves the files as-is */
fs.writeFileSync(path.join(ROOT, ".nojekyll"), "");

console.log(`Built ${written} pages + sitemap.xml + feed.xml + robots.txt + assets/js/config.js`);
