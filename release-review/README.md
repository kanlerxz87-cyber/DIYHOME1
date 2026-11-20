# Independent post-deployment check

Run this against the **deployed canonical root**, not the development server. It reads public files only; it never follows product links, creates a referral click, accepts a tracking identifier, or contacts the analytics collector.

```sh
python3 -m unittest discover -s release-review -v
python3 release-review/check_release.py https://kanlerxz87-cyber.github.io/DIYHOME1/ > release-result.json
```

Exit 1 means findings or an incomplete crawl. Exit 0 means only that the automated checks below passed. Keep the timestamped JSON with the release record. Compare the deployed build SHA with the merged SHA using `gh api repos/kanlerxz87-cyber/DIYHOME1/pages/builds/latest` for branch-based Pages. For Actions-based Pages, use the successful deployment for the `github-pages` environment instead.

## What it measures

- Up to 150 same-publication URLs reached from internal hyperlinks, `sitemap.xml`, and linked feed documents. XML must parse; sitemap and feed entry destinations must stay under the canonical HTTPS root.
- Parsed HTML titles and canonical URLs; two instances of the start of the Associates statement outside script, style, template, and head elements.
- `sponsored` tokens on recognized Amazon listing, tagged and short links without resolving those links. Official policy references are not product links.

## What still requires separate evidence

This is **not** a compliance or commercial-performance certification. It does not verify CSS visibility, above-the-fold placement, every possible URL form, fragment IDs, JS-created links, image assets, product intent, enrolled Special Links, report attribution, order counts, analytics ingestion, or the veracity of editorial claims. Review placement on mobile and desktop. Confirm intended destination and report attribution in the enrolled Associates workflow. Never turn a passed link-markup check into a claim of verified attribution.

## Initial release observation — 2026-11-20 UTC

|Observation|Evidence|
|---|---|
|At 05:56 UTC, Pages reported `built` for base commit `faef47897b70ec6570215b9414849a2ef794e836`. This is not evidence that the new shop was deployed.|[Pages build record (latest, mutable)](https://api.github.com/repos/kanlerxz87-cyber/DIYHOME1/pages/builds/latest) · [base tree (immutable)](https://github.com/kanlerxz87-cyber/DIYHOME1/tree/faef47897b70ec6570215b9414849a2ef794e836)|
|The public homepage fetched at that point contained the heading `DIYHOME1` only. Publication acceptance is pending, not passed.|[Public homepage](https://kanlerxz87-cyber.github.io/DIYHOME1/)|
|Independent site build skipped: earlier active integration claims overlap. Release checker is isolated from shared site files.|[Coordination issue](https://github.com/kanlerxz87-cyber/DIYHOME1/issues/1) · [earliest recorded board](https://github.com/kanlerxz87-cyber/DIYHOME1/blob/158f4deca03b406d9075ad7539117afe216f900f/COORDINATION.md)|
