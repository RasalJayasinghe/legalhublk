import re, time
from urllib.parse import urljoin
from .common.http import soup
from .common.model import Item
from .common.io import dedupe_by_url, write_catalog_and_latest

BASE = "https://documents.gov.lk"
PDF = re.compile(r"\.pdf$", re.I)

def _extract_pdf_links(row_cells):
    """Extract PDF links from table cells"""
    pdfs = []
    for cell in row_cells:
        for a in cell.select("a[href]"):
            href = a.get("href", "").strip()
            if PDF.search(href):
                pdfs.append({
                    'url': urljoin(BASE, href),
                    'text': a.get_text(strip=True)
                })
    return pdfs

def _lang_from_url(url:str):
    """Determine language from URL pattern"""
    m = re.search(r"_([EST])\.pdf$", url, re.I)
    return {"E":"en","S":"si","T":"ta"}.get(m.group(1).upper()) if m else "en"

def crawl(year:int):
    """Crawl extraordinary gazettes for a given year"""
    rows = []
    try:
        url = f"{BASE}/view/extra-gazettes/egz_{year}.html"
        s = soup(url)
        
        # Find the table with extraordinary gazettes
        table = s.find("table")
        if not table:
            return []
        
        # Process each row (skip header)
        for tr in table.find_all("tr")[1:]:  # Skip header row
            cells = tr.find_all("td")
            if len(cells) < 4:
                continue
            
            # Extract data from cells
            gazette_num = cells[0].get_text(strip=True)
            date_str = cells[1].get_text(strip=True)
            description = cells[2].get_text(strip=True)
            
            # Parse date to YYYY-MM-DD format
            try:
                # Format: 2025-10-19
                if re.match(r'\d{4}-\d{2}-\d{2}', date_str):
                    date = date_str
                else:
                    continue
            except:
                continue
            
            # Extract PDF links
            pdf_links = _extract_pdf_links(cells[3:])
            
            if not pdf_links:
                # No direct links found, skip
                continue
            
            # Create entries for each PDF link (one per language)
            langs_seen = set()
            for pdf in pdf_links:
                lang = _lang_from_url(pdf['url'])
                if lang not in langs_seen:
                    langs_seen.add(lang)
                    
            # Create a single entry with all languages
            title = f"Extraordinary Gazette {gazette_num} - {description}"
            item = Item.make(
                type="Extraordinary Gazette",
                date=date,
                title=title,
                url=pdf_links[0]['url'],  # Primary URL
                languages=list(langs_seen),
                raw="extra-gazettes"
            )
            rows.append(item.model_dump())
        
        time.sleep(1)  # Be polite
    except Exception as e:
        print(f"Error crawling {year}: {e}")
        return []
    
    return dedupe_by_url(rows)

def run(year:int, out_dir:str):
    """Scrape extraordinary gazettes and write to files"""
    docs = crawl(year)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)
    return docs
