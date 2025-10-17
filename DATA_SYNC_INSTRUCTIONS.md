# How to Sync 2025 Gazettes and Latest Data

## Problem
The platform is showing only 2024 gazettes because the latest data hasn't been synced from documents.gov.lk yet.

## Solution Options

### Option 1: Trigger GitHub Actions Manually (Recommended)
1. Go to your GitHub repository
2. Click on the **Actions** tab
3. Select **"Sync Legal Data (documents.gov.lk)"** workflow
4. Click **"Run workflow"** button
5. Select the main branch and click **"Run workflow"**
6. Wait for the workflow to complete (it will scrape all data including 2025 gazettes)
7. The data will be automatically committed to `public/data/` directories

### Option 2: Run Python Scraper Locally
```bash
# Install Python dependencies
cd scrapers
pip install -r requirements.txt

# Run the gazette scraper for 2025
python -m scrapers.cli gazettes --from-year 2004 --to-year 2025 --out public/data/gazettes

# Run other scrapers if needed
python -m scrapers.cli extra-gazettes --from-year 2004 --to-year 2025 --out public/data/extra-gazettes
python -m scrapers.cli acts --out public/data/acts
python -m scrapers.cli bills --out public/data/bills

# Merge all latest data into one file
python -m scrapers.cli merge-latest --root public/data
```

### Option 3: Wait for Automatic Sync
The GitHub Actions workflow runs automatically every day at midnight UTC. Just wait for the next scheduled run.

## What Gets Scraped

The scraper will fetch:
- **Gazettes**: 2004-2025 (including latest 2025 gazettes from Oct 17, 2025)
- **Extraordinary Gazettes**: 2004-2025
- **Acts**: All available acts
- **Bills**: All available bills
- **Forms & Notices**: All available forms and notices

## Data Sources
- Primary: https://documents.gov.lk/view/gazettes/2025.html (38 gazettes in 2025)
- GitHub Repo: https://github.com/nuuuwan/lk_legal_docs (for historical data)

## Verification
After syncing, check:
1. `public/data/gazettes/latest.json` - Should contain 2025 gazettes
2. `public/data/all/latest.json` - Merged data from all sources
3. The app should show "Synced latest documents" toast with updated count

## Search Functionality
The search now includes debug logs. Check browser console to see:
- When search index is being built
- Search query execution
- Number of search results

If search isn't working:
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for messages like "Starting search index build for X documents"
4. Search should work once you see "Search index build complete"
