import re
from urllib.parse import urljoin
from .common.http import soup
from .common.model import Item
from .common.io import dedupe_by_url, write_catalog_and_latest

BASE = "https://documents.gov.lk"
PDF = re.compile(r"\.pdf$", re.I)

def extract_forms_data():
    """Extract forms data from the forms page with proper table parsing"""
    url = "https://documents.gov.lk/view/general-forms/forms.html"
    s = soup(url)
    items = []
    
    # Find the table and extract rows
    for row in s.select("table tr")[1:]:  # Skip header row
        cells = row.select("td")
        if len(cells) < 4:
            continue
            
        form_number = cells[0].get_text(strip=True)
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
                
            title = f"Form {form_number}: {description}"
            
            items.append(Item.make(
                type="Form",
                date=date,
                title=title,
                url=pdf_url,
                languages=languages,
                raw="forms"
            ).model_dump())
    
    return items

def extract_notices_data():
    """Extract notices data from the notices page with proper table parsing"""
    url = "https://documents.gov.lk/view/notices/notices.html"
    s = soup(url)
    items = []
    
    # Find the table and extract rows
    for row in s.select("table tr")[1:]:  # Skip header row
        cells = row.select("td")
        if len(cells) < 4:
            continue
            
        published_date = cells[0].get_text(strip=True)
        closing_date = cells[1].get_text(strip=True)
        description = cells[2].get_text(strip=True)
        
        # Extract PDF links from the View column
        view_links = cells[3].select("a[href$='.pdf']")
        languages = []
        pdf_url = None
        
        for link in view_links:
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
            # Convert date format from "2025.02.05" to "2025-02-05"
            try:
                date = published_date.replace(".", "-") if "." in published_date else published_date
                # Validate date format
                if not re.match(r"\d{4}-\d{2}-\d{2}", date):
                    date = "1970-01-01"
            except:
                date = "1970-01-01"
                
            title = f"Notice: {description}"
            if closing_date:
                title += f" (Closes: {closing_date})"
                
            items.append(Item.make(
                type="Notice",
                date=date,
                title=title,
                url=pdf_url,
                languages=languages,
                raw="notices"
            ).model_dump())
    
    return items

def run_forms(out_dir: str):
    """Run forms scraper"""
    docs = extract_forms_data()
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)

def run_notices(out_dir: str):
    """Run notices scraper"""
    docs = extract_notices_data()
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)