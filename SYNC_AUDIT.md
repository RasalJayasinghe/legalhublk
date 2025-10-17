# Sync Audit & Fix Plan

Status: INVESTIGATED and PATCHED (requires re-running the GitHub Action)

## Findings
- Daily sync workflow has multiple failed runs (per your screenshot).
- Frontend is reading local JSON at `public/data/**/latest.json` which currently contains data only up to 2024-12-27.
- Gazettes for 2025 exist on the source site.

## Root Causes (likely)
1. Source site intermittently blocks scripted requests (403/429). Our scraper used a bot-like User-Agent and parallel jobs increased the chance of blocks.
2. Fail-fast runs caused the entire job to fail when a single year/day page errored.

## Fixes Implemented
- Updated scraper HTTP headers to a modern browser User-Agent and added standard Accept headers (`scrapers/common/http.py`).
- Made `gazettes` crawler resilient: when a date page fails, we skip and continue instead of aborting the entire run (`scrapers/gazettes.py`).
- Reduced GitHub Actions matrix parallelism to 3 to avoid rate-limiting (`.github/workflows/sync-lk-legal-docs.yml`).
- Frontend remote fallback: if local data is stale (< 2025), it will fetch from the repository’s raw JSON as a temporary fallback (`useDocumentSync.tsx`).

## What You Need To Do
1. Go to GitHub → Actions → “Sync Legal Data (documents.gov.lk)” → Run workflow (main).
2. Wait for it to complete; it will commit refreshed JSON to `public/data/` (including 2025 gazettes).
3. Refresh the app. The homepage, Latest, and Gazettes filters should show 2025 entries.

## Verification Checklist
- [ ] `public/data/gazettes/latest.json` contains dates from 2025.
- [ ] `public/data/all/latest.json` top entry is a 2025 date.
- [ ] Homepage shows 2025 items at the top.
- [ ] Gazettes filter shows 2025 weeks (10-17, 10-10, etc.).

If the run still fails, share the failing step logs (HTTP status) and we will bump delays or add targeted retries.
