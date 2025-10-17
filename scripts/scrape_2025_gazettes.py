#!/usr/bin/env python3
"""
Scrape 2025 gazettes from documents.gov.lk and update local JSON files.

Usage:
    python3 scripts/scrape_2025_gazettes.py

Requirements:
    pip install -r scrapers/requirements.txt
"""
import os
import sys

# Add parent directory to path so we can import scrapers module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.gazettes import crawl
from scrapers.common.io import write_catalog_and_latest, write_all_latest


def main():
    print("Starting 2025 gazette scrape from documents.gov.lk...")
    
    # Ensure output directories exist
    os.makedirs('public/data/gazettes', exist_ok=True)
    os.makedirs('public/data/all', exist_ok=True)

    # Crawl only 2025 gazettes
    print("Fetching 2025 gazette pages...")
    docs = crawl(2025, 2025)
    
    if not docs:
        print("WARNING: No documents found for 2025!")
        return
    
    # Sort by date descending (newest first)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)

    # Write per-type outputs (gazettes/catalog.json and gazettes/latest.json)
    print(f"Writing {len(docs)} documents to public/data/gazettes/...")
    write_catalog_and_latest(docs, 'public/data/gazettes', latest_n=500)

    # Build merged "all/latest.json" using only gazettes for now
    print("Writing merged feed to public/data/all/latest.json...")
    write_all_latest({'gazettes': docs}, 'public/data', latest_n=500)

    print("\n✅ Done!")
    print(f"Total 2025 gazettes: {len(docs)}")
    if docs:
        print(f"Newest: {docs[0].get('date')} - {docs[0].get('title', '')[:80]}")
        print(f"Oldest: {docs[-1].get('date')} - {docs[-1].get('title', '')[:80]}")
    
    print("\nFiles updated:")
    print("  - public/data/gazettes/catalog.json")
    print("  - public/data/gazettes/latest.json")
    print("  - public/data/all/latest.json")
    print("\nCommit these files to deploy the updates.")


if __name__ == "__main__":
    main()
