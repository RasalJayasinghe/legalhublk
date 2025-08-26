import re
from urllib.parse import urljoin
from .common.http import soup
from .common.model import Item
from .common.io import dedupe_by_url, write_catalog_and_latest

BASE = "https://documents.gov.lk"
PDF = re.compile(r"\.pdf$", re.I)

def extract_year_links(main_url):
    """Extract year links from the main acts/bills page"""
    s = soup(main_url)
    year_links = []
    
    # Find all year links
    for link in s.select("a"):
        href = link.get("href", "")
        if href and ("acts_" in href or "bl_" in href):
            full_url = urljoin(BASE, href)
            year_links.append(full_url)
    
    return year_links

def extract_acts_data():
    """Extract acts data from all year pages"""
    main_url = "https://documents.gov.lk/view/acts/acts.html"
    year_links = extract_year_links(main_url)
    items = []
    
    # Limit to recent years to avoid overwhelming the system
    recent_years = [link for link in year_links if any(year in link for year in ["2025", "2024", "2023", "2022", "2021"])]
    
    for year_url in recent_years:
        try:
            s = soup(year_url)
            
            # Find the table and extract rows
            for row in s.select("table tr")[1:]:  # Skip header row
                cells = row.select("td")
                if len(cells) < 4:
                    continue
                    
                act_number = cells[0].get_text(strip=True)
                date_str = cells[1].get_text(strip=True)
                description = cells[2].get_text(strip=True)
                
                # Extract PDF links from the Download column
                download_links = cells[3].select("a[href$='.pdf']")
                languages = []
                pdf_url = None
                
                for link in download_links:
                    href = link["href"].strip()
                    if not PDF.search(href):
                        continue
                        
                    full_url = urljoin(BASE, href)
                    link_text = link.get_text(strip=True).lower()
                    
                    # Use English PDF as primary, collect all languages
                    if link_text == "english" and not pdf_url:
                        pdf_url = full_url
                    languages.append(link_text)
                    
                    # If no English found, use first PDF
                    if not pdf_url:
                        pdf_url = full_url
                
                if pdf_url and description:
                    # Clean up the date format
                    try:
                        # Convert date from format like "2023-07-22" 
                        date = date_str if re.match(r"\d{4}-\d{2}-\d{2}", date_str) else "1970-01-01"
                    except:
                        date = "1970-01-01"
                        
                    title = f"Act {act_number}: {description}"
                    
                    items.append(Item.make(
                        type="Act",
                        date=date,
                        title=title,
                        url=pdf_url,
                        languages=languages,
                        raw="acts"
                    ).model_dump())
        except Exception as e:
            print(f"Error processing {year_url}: {e}")
            continue
    
    return items

def extract_bills_data():
    """Extract bills data from all year pages"""
    main_url = "https://documents.gov.lk/view/bills/bl.html"
    year_links = extract_year_links(main_url)
    items = []
    
    # Limit to recent years to avoid overwhelming the system
    recent_years = [link for link in year_links if any(year in link for year in ["2025", "2024", "2023", "2022", "2021"])]
    
    for year_url in recent_years:
        try:
            s = soup(year_url)
            
            # Find the table and extract rows
            for row in s.select("table tr")[1:]:  # Skip header row
                cells = row.select("td")
                if len(cells) < 4:
                    continue
                    
                bill_number = cells[0].get_text(strip=True)
                date_str = cells[1].get_text(strip=True)
                description = cells[2].get_text(strip=True)
                
                # Extract PDF links from the Download column
                download_links = cells[3].select("a[href$='.pdf']")
                languages = []
                pdf_url = None
                
                for link in download_links:
                    href = link["href"].strip()
                    if not PDF.search(href):
                        continue
                        
                    full_url = urljoin(BASE, href)
                    link_text = link.get_text(strip=True).lower()
                    
                    # Use English PDF as primary, collect all languages
                    if link_text == "english" and not pdf_url:
                        pdf_url = full_url
                    languages.append(link_text)
                    
                    # If no English found, use first PDF
                    if not pdf_url:
                        pdf_url = full_url
                
                if pdf_url and description:
                    # Clean up the date format
                    try:
                        # Convert date from format like "2023-07-22" 
                        date = date_str if re.match(r"\d{4}-\d{2}-\d{2}", date_str) else "1970-01-01"
                    except:
                        date = "1970-01-01"
                        
                    title = f"Bill {bill_number}: {description}"
                    
                    items.append(Item.make(
                        type="Bill",
                        date=date,
                        title=title,
                        url=pdf_url,
                        languages=languages,
                        raw="bills"
                    ).model_dump())
        except Exception as e:
            print(f"Error processing {year_url}: {e}")
            continue
    
    return items

def run_acts(out_dir: str):
    """Run acts scraper"""
    docs = extract_acts_data()
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)

def run_bills(out_dir: str):
    """Run bills scraper"""
    docs = extract_bills_data()
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)