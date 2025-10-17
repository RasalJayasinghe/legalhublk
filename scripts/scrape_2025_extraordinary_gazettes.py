#!/usr/bin/env python3
"""
Scrape 2025 extraordinary gazettes from documents.gov.lk and update local JSON files.

Usage:
    python3 scripts/scrape_2025_extraordinary_gazettes.py

Requirements:
    pip install -r scrapers/requirements.txt
"""
import os
import sys

# Add parent directory to path so we can import scrapers module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scrapers.extra_gazettes import crawl
from scrapers.common.io import write_catalog_and_latest, write_all_latest


def main():
    print("Starting 2025 extraordinary gazette scrape from documents.gov.lk...")
    
    # Ensure output directories exist
    os.makedirs('public/data/extra-gazettes', exist_ok=True)
    os.makedirs('public/data/all', exist_ok=True)

    # Crawl 2025 extraordinary gazettes
    print("Fetching 2025 extraordinary gazette pages...")
    docs = crawl(2025)
    
    if not docs:
        print("WARNING: No documents found for 2025!")
        return
    
    # Sort by date descending (newest first)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)

    # Write per-type outputs
    print(f"Writing {len(docs)} documents to public/data/extra-gazettes/...")
    write_catalog_and_latest(docs, 'public/data/extra-gazettes', latest_n=500)

    # Read existing regular gazettes
    import json
    regular_gazettes = []
    try:
        with open('public/data/gazettes/latest.json', 'r') as f:
            data = json.load(f)
            regular_gazettes = data.get('documents', [])
    except:
        pass

    # Build merged "all/latest.json"
    print("Writing merged feed to public/data/all/latest.json...")
    all_docs = {'gazettes': regular_gazettes, 'extra-gazettes': docs}
    write_all_latest(all_docs, 'public/data', latest_n=500)

    print("\n✅ Done!")
    print(f"Total 2025 extraordinary gazettes: {len(docs)}")
    if docs:
        print(f"Newest: {docs[0].get('date')} - {docs[0].get('title', '')[:80]}")
        print(f"Oldest: {docs[-1].get('date')} - {docs[-1].get('title', '')[:80]}")
    
    print("\nFiles updated:")
    print("  - public/data/extra-gazettes/catalog.json")
    print("  - public/data/extra-gazettes/latest.json")
    print("  - public/data/all/latest.json")
    print("\nCommit these files to deploy the updates.")


if __name__ == "__main__":
    main()
