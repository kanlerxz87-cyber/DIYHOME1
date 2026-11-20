# Coordination — DIYHOME1

Shared task board for parallel agent sessions. This session works on branch
`arena/2d099948-diyhome1`, branched from `faef478` of `main` (status: active).

Session ID of this session: `arena-2d099948-diyhome1`. This is the only active
session, so it claims every task below. Each task is worked line by line,
committed, and pushed before the next task begins. `git pull --rebase` is run
before every push. No other session has claimed any of these tasks.

| Task | Status | Owner | Files touched | Sources / verification |
|------|--------|-------|---------------|------------------------|
| T-001 Repo review & baseline verification | done | arena-2d099948-diyhome1 | COORDINATION.md, README.md | git history, repo listing (repo contained only README.md) |
| T-002 Site scaffolding (brand, CSS, nav, disclosure strip) | done | arena-2d099948-diyhome1 | assets/css/main.css, assets/js/app.js | Internal link check: OK; JS syntax: OK |
| T-003 Landing page (publication front page, products first) | done | arena-2d099948-diyhome1 | index.html | Disclosure strip above fold; products lead |
| T-004 Product dashboard table + product-intent confirmation records | done | arena-2d099948-diyhome1 | products.html | All product values blank + unverified (Amazon not reachable from sandbox) |
| T-005 Category pages | done | arena-2d099948-diyhome1 | categories/kitchen-appliances.html | Category assignment flagged unverified (working hypothesis) |
| T-006 Question-shaped guides + RSS feed + sitemap | done | arena-2d099948-diyhome1 | guides.html, feed.xml, sitemap.xml | feed.xml + sitemap.xml well-formed (tag-balance check OK) |
| T-007 Privacy-preserving analytics + outbound click counter (5 events) | done | arena-2d099948-diyhome1 | assets/js/analytics.js, privacy.html | Client-side + beacon to /api/collect; backend collector not hostable on static Pages (follow-up, not a blocker). Five events defined and flagged for confirmation. |
| T-008 Compliance: disclosure above fold, sponsored links, Associates statement | done | arena-2d099948-diyhome1 | disclosure.html, all pages | Disclosure strip on every page + footer; all outbound product links rel="sponsored"; official source links for manual review |
| T-009 Flagged for Review page + irregularities log | done | arena-2d099948-diyhome1 | flagged.html | Irregularities published with source links; do not block merge |
| T-010 Campaign ledger (empty, well-defined, dated provenance) | done | arena-2d099948-diyhome1 | data/campaign-ledger.json | JSON valid; entries empty pending authorized first-party reports |
| T-011 GitHub Pages enable + deploy verification | in progress | arena-2d099948-diyhome1 | repo settings (Pages) | — |
| T-012 PR to main + merge + publish record | unclaimed | — | — | — |

Working rules
- Claim a task by writing your session ID, setting status `in progress`, and committing+pushing that claim immediately.
- Never start a task another session has claimed. Keep file scopes non-overlapping.
- If a task needs a file owned by another session, log the request here instead of editing it.
- Small, frequent commits. `git pull --rebase` before every push.
- On merge conflict: stop, resolve without discarding the other session's work, log what happened.
- If a session crashes or its claim is >60 minutes old with no commits, another session may take over and note the handoff.
- When a task is finished, record sources, verification performed, and irregularities here, then mark it `done`.
- Never mark anything verified without checking it against an official source; link that source.
- Shared outputs (table data, index, navigation) are changed only by the final integration session once all other tasks are done; that session re-verifies line by line, confirms the build with no broken links, and publishes to GitHub Pages.
- Flagged irregularities and unverified items do NOT block the merge; they are published on the clearly labeled "Flagged for Review" page.

Irregularities found (baseline + build)
- Repo contained only README.md ("# DIYHOME1"); no existing source register, dashboard, or site to review.
- Submitted outbound links are Amazon short links (`https://link.amazon/...`). They cannot be resolved or verified from this sandbox (outbound network is limited to GitHub/npm/PyPI). Per project guidance, their compliance status is treated as unresolved; they are NOT claimed invalid.
- URL path segments (B0hmGG4m2, B03QDuGdo, B0hpD2JGQ) are 9 characters; Amazon ASINs are 10 characters, so these segments are NOT asserted to be ASINs. Intended ASIN is left blank and flagged unverified in the product-intent confirmation record.
- Duplicate submission: https://link.amazon/B03QDuGdo appears twice; treated as one product entry with a note.
- "The five defined events" are not enumerated in the project brief; a minimal event set is defined in T-007 and flagged for confirmation.
- Product prices, reviews, commission potential: not confirmed; left blank (never inferred).
- Self-hosted analytics endpoint /api/collect not hostable on static GitHub Pages; client queues locally (documented in privacy.html and flagged.html).
- Search Console property setup requires Google account access; not done. Sitemap.xml and feed.xml are published.

Sources used for manual review (official, linked on /disclosure.html and /flagged.html):
- Amazon Associates Operating Agreement: https://affiliate-program.amazon.com/help/operating-agreement
- Amazon Associates program help: https://affiliate-program.amazon.com/help
- FTC Endorsement Guides: https://www.ftc.gov/business-guidance/resources/ftc-endorsement-guides-what-people-are-asking
- Sitemap protocol: https://sitemaps.org/
- RSS 2.0 specification: https://www.rssboard.org/rss-specification

Verification performed this session
- All internal links across HTML/XML: OK (no broken links).
- sitemap.xml and feed.xml: well-formed.
- data/campaign-ledger.json: valid JSON.
- assets/js/analytics.js, assets/js/app.js: valid syntax.
- All product confirmation-record values left blank and flagged unverified; nothing inferred.
