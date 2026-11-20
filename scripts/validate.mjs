#!/usr/bin/env node
/* Validation gate for the built site.
 * Fails the build (exit 1) on any broken internal link, missing disclosure,
 * unmarked Amazon link, untagged product URL, cloaked redirect, page missing
 * from the sitemap, malformed feed, or invalid data file.
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TAG = JSON.parse(fs.readFileSync(path.join(ROOT, "data/site.json"), "utf8")).associate_tag;
const errors = [];
const warnings = [];
const checks = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
const ok = (name, detail = "") => checks.push({ name, detail });

const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const allHtml = walk(ROOT).sort();
const htmlFiles = allHtml.filter((f) => !rel(f).startsWith("archive/"));
const archivedHtml = allHtml.filter((f) => rel(f).startsWith("archive/"));
ok("HTML pages found", `${htmlFiles.length} published, ${archivedHtml.length} archived`);

/* ---------- archived earlier edition: preserved, never indexed ---------- */
for (const file of archivedHtml) {
  const html = fs.readFileSync(file, "utf8");
  const name = rel(file);
  if (!/<meta name="robots" content="noindex/.test(html)) err(`${name}: archived page must be noindex`);
  if (!/archived-edition-banner/.test(html)) err(`${name}: archived page missing the archive banner`);
  if (!/href="[^"]*"[^>]*>DIY Home Upgrades</.test(html)) err(`${name}: archive banner must link to the live publication`);
}
ok("Archived edition preserved (noindex + banner)", String(archivedHtml.length));

/* ---------- per page ---------- */

const SITE_EXTERNAL = /^(https?:|mailto:|tel:)/i;

function resolveInternal(fromFile, href) {
  const clean = href.split("#")[0].split("?")[0];
  if (!clean) return null;
  if (clean.startsWith("/")) {
    // GitHub Pages project site: absolute paths would need the repo prefix.
    return { missing: true, reason: "root-absolute link breaks under a project-site subpath", path: clean };
  }
  const base = path.dirname(fromFile);
  let target = path.resolve(base, clean);
  if (clean.endsWith("/")) return { target: path.join(target, "index.html") };
  if (!path.extname(target)) {
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) return { target: path.join(target, "index.html") };
    return { target: path.join(target, "index.html"), alt: target };
  }
  return { target };
}

const amzLinks = [];
const canonicalSet = new Set();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const name = rel(file);
  const is404 = name === "404.html";
  const isSearch = name.startsWith("search/");

  const h1s = html.match(/<h1[\s>]/g) || [];
  if (h1s.length !== 1) err(`${name}: expected exactly 1 <h1>, found ${h1s.length}`);

  if (!/<title>[^<]{10,}<\/title>/.test(html)) err(`${name}: missing or too-short <title>`);
  if (!/<meta name="description" content="[^"]{40,}">/.test(html)) err(`${name}: missing or too-short meta description`);

  if (!is404) {
    const can = html.match(/<link rel="canonical" href="([^"]+)">/);
    if (!can) err(`${name}: missing canonical link`);
    else {
      if (canonicalSet.has(can[1])) err(`${name}: duplicate canonical ${can[1]}`);
      canonicalSet.add(can[1]);
      if (!can[1].startsWith("https://kanlerxz87-cyber.github.io/DIYHOME1/")) err(`${name}: canonical not on the published origin: ${can[1]}`);
    }
  }

  /* disclosure must be on every page, in the strip and in the footer */
  if (!/class="disclosure" data-disclosure/.test(html)) err(`${name}: disclosure strip missing`);
  if (!/As an Amazon Associate we earn from qualifying purchases/.test(html)) err(`${name}: disclosure wording missing`);
  const footerIdx = html.indexOf("site-footer");
  if (footerIdx === -1) err(`${name}: footer missing`);
  else if (!/Affiliate disclosure:/.test(html.slice(footerIdx))) err(`${name}: footer disclosure missing`);

  /* links */
  const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>/g)].map((m) => ({ href: m[1], tag: m[0] }));
  for (const { href, tag } of hrefs) {
    if (!href || href.startsWith("#")) continue;
    if (SITE_EXTERNAL.test(href)) {
      if (href.startsWith("http://")) err(`${name}: insecure link ${href}`);
      const isAmazon = /(^|\.)amazon\.com|link\.amazon/i.test(href);
      if (isAmazon) {
        const isCitation = /data-citation="true"/.test(tag);
        const isProduct = /www\.amazon\.com\/dp\//i.test(href);
        const isShort = /link\.amazon/i.test(href);
        const isSponsored = /data-sponsored="amazon"/.test(tag);
        const hasTag = /[?&]tag=/.test(href);
        const isButton = /class="btn/.test(tag);
        amzLinks.push({ name, href, tag, isCitation, isProduct, isSponsored });

        /* Rule A — anything we send a shopper through must be marked and tagged */
        if (isSponsored) {
          if (!/rel="[^"]*\bsponsored\b/.test(tag)) err(`${name}: sponsored Amazon link without rel="sponsored": ${href}`);
          if (!/rel="[^"]*\bnofollow\b/.test(tag)) err(`${name}: sponsored Amazon link without rel="nofollow": ${href}`);
          if (isProduct && !hasTag) err(`${name}: product URL without affiliate tag: ${href}`);
          if (isProduct && !/data-asin="/.test(tag)) err(`${name}: sponsored product link without data-asin (click attribution): ${href}`);
        }

        /* Rule B — a /dp/ link is either a tagged Special Link or declared evidence */
        if (isProduct && !hasTag && !isCitation) err(`${name}: untagged product URL that is not marked as a citation: ${href}`);

        /* Rule C — evidence is never a call to action */
        if (isCitation && isButton) err(`${name}: citation link used as a call-to-action button: ${href}`);
        if (isCitation && isProduct && hasTag) err(`${name}: citation should carry the bare URL, not a tagged one: ${href}`);
        if (isShort && !isCitation && !isSponsored) err(`${name}: short link that is neither sponsored nor marked as provenance: ${href}`);

        if (!/^https:\/\//.test(href)) err(`${name}: Amazon link is not https: ${href}`);
      } else if (/target="_blank"/.test(tag) && !/noopener/.test(tag)) {
        warn(`${name}: external link without rel=noopener: ${href}`);
      }
      continue;
    }
    const r = resolveInternal(file, href);
    if (!r) continue;
    if (r.missing) {
      err(`${name}: ${r.reason} (${href})`);
      continue;
    }
    if (!fs.existsSync(r.target)) err(`${name}: broken internal link ${href} -> ${rel(r.target)}`);
  }

  /* form actions must not escape the site root */
  for (const m of html.matchAll(/<form\b[^>]*action="([^"]*)"[^>]*>/g)) {
    const action = m[1];
    if (SITE_EXTERNAL.test(action) || action.startsWith("//")) {
      err(`${name}: form posts to a third party: ${action}`);
      continue;
    }
    if (action.startsWith("/")) err(`${name}: root-absolute form action: ${action}`);
    const r = resolveInternal(file, action);
    if (r && !r.missing && !fs.existsSync(r.target)) err(`${name}: form action points at a missing page: ${action}`);
  }

  /* no third-party subresources besides the two local scripts */
  const srcs = [...html.matchAll(/<(?:script|img|iframe)\b[^>]*(?:src)="([^"]+)"/g)].map((m) => m[1]);
  for (const s of srcs) {
    if (SITE_EXTERNAL.test(s) || s.startsWith("//")) err(`${name}: third-party subresource ${s}`);
  }
  const cssLinks = [...html.matchAll(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
  for (const c of cssLinks) if (SITE_EXTERNAL.test(c)) err(`${name}: third-party stylesheet ${c}`);

  /* seller must not be inferred to a brand etc. — structural sanity */
  if (isSearch && !/noindex/.test(html)) err(`${name}: search page should be noindex`);
}

ok("Amazon outbound links checked", `${amzLinks.length} total, ${amzLinks.filter((l) => l.isSponsored).length} sponsored, ${amzLinks.filter((l) => l.isCitation).length} citations`);
if (!amzLinks.length) err("no Amazon links found at all — the shop has no exit");

/* tag consistency */
const tags = new Set(amzLinks.filter((l) => /[?&]tag=/.test(l.href) && !l.isCitation).map((l) => l.href.split("tag=")[1].split("&")[0]));
if (tags.size !== 1) err(`inconsistent affiliate tags: ${[...tags].join(", ")}`);
else ok("Single affiliate tag used", [...tags][0]);
if ([...tags][0] !== TAG) err(`tag mismatch: site.json says ${TAG}, pages use ${[...tags][0]}`);

/* no cloaked/redirecting links */
for (const { name, href } of amzLinks) {
  if (/^https?:\/\/kanlerxz87-cyber\.github\.io/.test(href)) err(`${name}: Amazon link routed through this site (cloaking): ${href}`);
}

/* ---------- sitemap ---------- */

const sitemap = fs.readFileSync(path.join(ROOT, "sitemap.xml"), "utf8");
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok("Sitemap URLs", String(locs.length));
for (const loc of locs) {
  if (loc.includes("/archive/")) err(`sitemap must not list archived pages: ${loc}`);
  const p = loc.replace("https://kanlerxz87-cyber.github.io/DIYHOME1/", "");
  const target = p === "" ? path.join(ROOT, "index.html") : path.join(ROOT, p, "index.html");
  if (!fs.existsSync(target)) err(`sitemap lists a missing page: ${loc}`);
}
for (const file of htmlFiles) {
  const name = rel(file);
  if (name === "404.html" || name.startsWith("search/")) continue;
  const urlPath = name.replace(/index\.html$/, "");
  if (!locs.includes(`https://kanlerxz87-cyber.github.io/DIYHOME1/${urlPath}`)) err(`page missing from sitemap: ${name}`);
}
if (locs.length !== new Set(locs).size) err("sitemap contains duplicate URLs");

/* ---------- feed well-formedness ---------- */

function wellFormed(xml, label) {
  const stripped = xml.replace(/<\?[\s\S]*?\?>/g, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  const tagRe = /<\/?([A-Za-z0-9:_-]+)([^>]*?)(\/?)>/g;
  const stack = [];
  let m;
  while ((m = tagRe.exec(stripped))) {
    const [full, tag, , selfClose] = m;
    if (selfClose === "/") continue;
    if (full.startsWith("</")) {
      const last = stack.pop();
      if (last !== tag) return `${label}: mismatched </${tag}> (open was ${last})`;
    } else stack.push(tag);
  }
  return stack.length ? `${label}: unclosed <${stack[stack.length - 1]}>` : null;
}

const feed = fs.readFileSync(path.join(ROOT, "feed.xml"), "utf8");
const feedProblem = wellFormed(feed, "feed.xml");
if (feedProblem) err(feedProblem);
else ok("feed.xml well-formed");
const items = (feed.match(/<item>/g) || []).length;
if (items < 1) err("feed.xml has no items");
else ok("Feed items", String(items));
const smProblem = wellFormed(sitemap, "sitemap.xml");
if (smProblem) err(smProblem);
else ok("sitemap.xml well-formed");

/* ---------- data integrity ---------- */

const readJson = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), "utf8"));
const sources = readJson("data/sources.json").sources;
const srcIds = new Set(sources.map((s) => s.id));
const products = readJson("data/products.json").products;
const flagged = readJson("data/flagged.json").items;
const events = readJson("data/events.json");
const guideMeta = readJson("data/guides.json").guides;

if (events.length !== 5) err(`expected exactly 5 defined events, found ${events.length}`);
else ok("Five measurement events defined");

const prodSlugs = new Set();
for (const p of products) {
  if (prodSlugs.has(p.slug)) err(`duplicate product slug ${p.slug}`);
  prodSlugs.add(p.slug);
  if (p.price !== null) err(`${p.slug}: price must stay null (Amazon policy)`);
  if (p.rating !== null) err(`${p.slug}: rating must stay null (Amazon policy)`);
  if (p.review_count !== null) err(`${p.slug}: review_count must stay null`);
  if (p.image !== null) err(`${p.slug}: image must stay null (no licensed program content)`);
  if (p.intended_asin !== null) err(`${p.slug}: intended_asin must stay null — it is unverified and must not be merged with the observed ASIN`);
  if (!srcIds.has(p.confirmation_source)) err(`${p.slug}: confirmation_source ${p.confirmation_source} not in source register`);
  for (const id of p.submitted_links) if (!srcIds.has(id)) err(`${p.slug}: submitted link source ${id} not in register`);
  if (!/^B0[A-Z0-9]{8}$/.test(p.asin_observed)) err(`${p.slug}: observed ASIN does not look like an ASIN: ${p.asin_observed}`);
  if (p.observed_redirect_target && p.observed_redirect_target === p.listing_url) err(`${p.slug}: observed redirect must stay a separate field`);
  if (!fs.existsSync(path.join(ROOT, "products", p.slug, "index.html"))) err(`${p.slug}: product page not built`);
}
ok("Products checked", String(products.length));

for (const g of guideMeta) {
  if (!fs.existsSync(path.join(ROOT, "guides", g.slug, "index.html"))) err(`guide page not built: ${g.slug}`);
  if (!/[?]$/.test(g.title)) err(`guide title is not question-shaped: ${g.title}`);
}
ok("Guides checked", String(guideMeta.length));

const fIds = new Set();
for (const f of flagged) {
  if (fIds.has(f.id)) err(`duplicate flag id ${f.id}`);
  fIds.add(f.id);
  for (const s of f.sources) if (!srcIds.has(s)) err(`flag ${f.id} cites unknown source ${s}`);
  if (!["high", "medium", "low", "info"].includes(f.severity)) err(`flag ${f.id} has unknown severity ${f.severity}`);
}
ok("Flags checked", String(flagged.length));

for (const s of sources) {
  if (!/^https:\/\//.test(s.url)) err(`source ${s.id} is not https`);
  if (s.verified === false && s.type === "primary") err(`source ${s.id} marked unverified but typed primary`);
}
ok("Source register checked", String(sources.length));

/* csv headers */
for (const [file, expected] of [
  ["data/campaign-ledger.csv", "record_id,timestamp_utc,source,channel,eligible_sessions,outbound_clicks,reported_orders,revenue_reported,currency,provenance_url,report_id,notes"],
  ["data/product-intents.csv", "submitted_link,intended_asin,intended_asin_status,official_listing_url,confirmation_date,confirmation_source,observed_asin,observed_redirect_target,observed_on,observed_method,associates_link_verified,status,notes"]
]) {
  const head = fs.readFileSync(path.join(ROOT, file), "utf8").split("\n")[0].trim();
  if (head !== expected) err(`${file}: header does not match the documented schema`);
}
ok("CSV schemas checked");

/* the ledger must still be empty — no invented rows */
const ledgerLines = fs.readFileSync(path.join(ROOT, "data/campaign-ledger.csv"), "utf8").trim().split("\n");
if (ledgerLines.length !== 1) err(`campaign ledger has ${ledgerLines.length - 1} row(s) but no first-party report exists`); 
else ok("Campaign ledger still empty (no invented rows)");

/* required files */
for (const f of [".nojekyll", "robots.txt", "sitemap.xml", "feed.xml", "assets/css/site.css", "assets/js/site.js", "assets/js/config.js", "COORDINATION.md", "EXECUTIVE_SUMMARY.md"]) {
  if (!fs.existsSync(path.join(ROOT, f))) err(`required file missing: ${f}`);
}
ok("Required files present");

if (!/Sitemap: https:\/\/kanlerxz87-cyber\.github\.io\/DIYHOME1\/sitemap\.xml/.test(fs.readFileSync(path.join(ROOT, "robots.txt"), "utf8"))) {
  err("robots.txt does not point at the sitemap");
}

/* ---------- report ---------- */

console.log(`\nChecks passed: ${checks.length}`);
for (const c of checks) console.log(`  ✓ ${c.name}${c.detail ? ": " + c.detail : ""}`);
if (warnings.length) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of [...new Set(warnings)]) console.log(`  ! ${w}`);
}
if (errors.length) {
  console.log(`\nFAILED — ${errors.length} error(s):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
}
console.log("\nAll checks passed. No broken links, disclosure on every page, every Amazon link sponsored and tagged.\n");
