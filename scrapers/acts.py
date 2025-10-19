#!/usr/bin/env python3
"""
Scraper for Acts from documents.gov.lk
Fetches Acts from 2018 onwards.
"""
import re
from typing import List
from scrapers.common.http import soup
from scrapers.common.model import Item
from scrapers.common.io import write_catalog_and_latest, dedupe_by_url

BASE = "https://documents.gov.lk"

def parse_acts_page(year: int) -> List[Item]:
    """Parse a single year's Acts page."""
    url = f"{BASE}/view/acts/acts_{year}.html"
    print(f"Scraping {url}...")
    
    try:
        doc = soup(url)
        items = []
        
        # Find the table with acts
        table = doc.find('table')
        if not table:
            print(f"  No table found for {year}")
            return []
        
        rows = table.find_all('tr')[1:]  # Skip header row
        
        for row in rows:
            cols = row.find_all('td')
            if len(cols) < 4:
                continue
            
            # Extract act number and year from first column
            act_num_text = cols[0].get_text(strip=True)
            act_match = re.match(r'(\d+)/(\d{4})', act_num_text)
            if not act_match:
                continue
            
            act_num = act_match.group(1)
            act_year = act_match.group(2)
            
            # Extract date
            date_text = cols[1].get_text(strip=True)
            
            # Extract description/title
            title = cols[2].get_text(strip=True)
            
            # Extract PDF links
            links = cols[3].find_all('a')
            languages = []
            pdf_url = None
            
            for link in links:
                link_text = link.get_text(strip=True).lower()
                href = link.get('href', '')
                
                if 'english' in link_text:
                    languages.append('en')
                    if not pdf_url:  # Use English as primary
                        pdf_url = BASE + href if href.startswith('/') else href
                elif 'sinhala' in link_text:
                    languages.append('si')
                    if not pdf_url:
                        pdf_url = BASE + href if href.startswith('/') else href
                elif 'tamil' in link_text:
                    languages.append('ta')
                    if not pdf_url:
                        pdf_url = BASE + href if href.startswith('/') else href
            
            if not pdf_url:
                continue
            
            # Create normalized item
            item = Item.make(
                type="Act",
                date=date_text,
                title=f"Act {act_num}/{act_year} - {title}",
                url=pdf_url,
                languages=languages,
                summary=title,
                raw=f"acts_{year}"
            )
            
            items.append(item)
        
        print(f"  Found {len(items)} acts for {year}")
        return items
    
    except Exception as e:
        print(f"  Error scraping {year}: {e}")
        return []

def scrape_all_acts() -> List[dict]:
    """Scrape all acts from 2018 onwards."""
    all_items = []
    
    # Scrape from 2018 to current year
    current_year = 2025
    for year in range(2018, current_year + 1):
        year_items = parse_acts_page(year)
        all_items.extend(year_items)
    
    # Deduplicate and convert to dict
    unique_items = dedupe_by_url([item.dict() for item in all_items])
    
    print(f"\nTotal unique acts: {len(unique_items)}")
    return unique_items

if __name__ == '__main__':
    import os
    
    out_dir = os.path.join("public", "data", "acts")
    acts = scrape_all_acts()
    
    if write_catalog_and_latest(acts, out_dir, latest_n=100):
        print(f"✓ Acts data written to {out_dir}")
    else:
        print("✗ No changes to Acts data")
