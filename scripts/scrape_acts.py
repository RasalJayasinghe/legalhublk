#!/usr/bin/env python3
"""
Script to scrape Acts and save to public/data/acts/
Run this manually or via GitHub Actions to update Acts data.
"""
import sys
import os

# Add scrapers directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from scrapers.acts import scrape_all_acts
from scrapers.common.io import write_catalog_and_latest

def main():
    print("Starting Acts scraping...")
    
    # Scrape all acts
    acts = scrape_all_acts()
    
    # Write to output directory
    out_dir = os.path.join("public", "data", "acts")
    
    if write_catalog_and_latest(acts, out_dir, latest_n=100):
        print(f"✓ Successfully written {len(acts)} acts to {out_dir}")
        return 0
    else:
        print("✗ No changes to Acts data")
        return 0

if __name__ == '__main__':
    sys.exit(main())
