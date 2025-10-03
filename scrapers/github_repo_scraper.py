"""
Scraper for fetching pre-processed JSON data from GitHub repository branches.
This fetches data from specific branches like data_lk_acts, data_lk_extraordinary_gazettes, etc.
"""
import time
from typing import List, Dict
from .common.http import get
from .common.model import Item
from .common.io import dedupe_by_url, write_catalog_and_latest

GITHUB_API_BASE = "https://api.github.com/repos/nuuuwan/lk_legal_docs"
GITHUB_RAW_BASE = "https://raw.githubusercontent.com/nuuuwan/lk_legal_docs"

def fetch_all_documents_from_branch(branch: str, base_path: str, doc_type: str, start_year: int = 2020) -> List[dict]:
    """
    Fetch all documents from a GitHub branch with nested structure: decades → years → docs.
    
    Args:
        branch: GitHub branch name (e.g., 'data_lk_acts')
        base_path: Base path within branch (e.g., 'data/lk_acts')
        doc_type: Document type (e.g., 'Act', 'Bill', 'Extraordinary Gazette')
        start_year: Only fetch documents from this year onwards for speed
    
    Returns:
        List of normalized Item dictionaries
    """
    items = []
    
    try:
        # Get decades directories (1980s, 1990s, 2000s, 2020s, etc.)
        api_url = f"{GITHUB_API_BASE}/contents/{base_path}?ref={branch}"
        print(f"Fetching decade directories from: {api_url}")
        
        response = get(api_url)
        decades = response.json()
        
        if not isinstance(decades, list):
            print(f"Warning: Expected list of decades, got {type(decades)}")
            return items
        
        # Filter for directory items only
        decade_dirs = [d for d in decades if d.get('type') == 'dir']
        print(f"Found {len(decade_dirs)} decade directories")
        
        # Process each decade
        for decade in decade_dirs:
            decade_name = decade['name']
            
            # Skip old decades for speed (optional optimization)
            if decade_name < "2020s":
                print(f"Skipping {decade_name} (before 2020)")
                continue
                
            print(f"\nProcessing decade: {decade_name}")
            decade_path = f"{base_path}/{decade_name}"
            
            # Get year directories within this decade
            year_url = f"{GITHUB_API_BASE}/contents/{decade_path}?ref={branch}"
            year_response = get(year_url)
            years = year_response.json()
            
            if not isinstance(years, list):
                continue
                
            year_dirs = [y for y in years if y.get('type') == 'dir']
            print(f"  Found {len(year_dirs)} years in {decade_name}")
            
            # Process each year
            for year_dir in year_dirs:
                year_name = year_dir['name']
                year_int = int(year_name)
                
                # Skip years before start_year
                if year_int < start_year:
                    continue
                    
                print(f"  Processing year: {year_name}")
                year_path = f"{decade_path}/{year_name}"
                
                # Get all document directories for this year
                doc_url = f"{GITHUB_API_BASE}/contents/{year_path}?ref={branch}"
                doc_response = get(doc_url)
                doc_folders = doc_response.json()
                
                if not isinstance(doc_folders, list):
                    continue
                
                doc_dirs = [d for d in doc_folders if d.get('type') == 'dir']
                print(f"    Found {len(doc_dirs)} documents in {year_name}")
                
                # Fetch metadata from each document (limit to recent ones for speed)
                for i, doc_dir in enumerate(doc_dirs[:100]):  # Limit to 100 most recent per year
                    doc_name = doc_dir['name']
                    metadata_url = f"{GITHUB_RAW_BASE}/{branch}/{year_path}/{doc_name}/metadata.json"
                    
                    try:
                        response = get(metadata_url, timeout=10)
                        metadata = response.json()
                        
                        item_dict = transform_metadata_to_item(metadata, doc_type)
                        if item_dict:
                            items.append(item_dict)
                        
                        # Rate limiting
                        if (i + 1) % 10 == 0:
                            time.sleep(0.5)
                            
                    except Exception as e:
                        print(f"      Error fetching {doc_name}: {e}")
                        continue
                
                time.sleep(1)  # Rate limit between years
        
        print(f"\nSuccessfully fetched {len(items)} items from {branch}")
        
    except Exception as e:
        print(f"Error fetching from GitHub branch {branch}: {e}")
    
    return items

def transform_metadata_to_item(metadata: Dict, doc_type: str) -> dict:
    """
    Transform GitHub metadata.json to our Item model format.
    
    Expected metadata structure:
    {
        "id": "2024-01-23-...",
        "doc_num": "01-2024",
        "date": "2024-01-23",
        "description": "...",
        "doc_type_name": "acts",
        "lang_to_source_url": {
            "en": "https://...",
            "si": "https://...",
            "ta": "https://..."
        }
    }
    """
    try:
        # Extract ID and date
        doc_id = metadata.get('id') or metadata.get('doc_num', '')
        date = metadata.get('date', '1970-01-01')
        
        # Extract title/description
        title = metadata.get('description', '') or metadata.get('title', '') or doc_id
        
        # Extract PDF URL (prefer English, fallback to any available language)
        lang_urls = metadata.get('lang_to_source_url', {})
        pdf_url = lang_urls.get('en') or lang_urls.get('si') or lang_urls.get('ta') or ''
        
        # Extract available languages
        languages = list(lang_urls.keys()) if lang_urls else []
        
        # Determine raw type name
        raw_type = metadata.get('doc_type_name', doc_type.lower())
        
        # Create Item
        if not doc_id or not date:
            return None
            
        item = Item.make(
            type=doc_type,
            date=date,
            title=title,
            url=pdf_url or f"https://documents.gov.lk/{doc_id}",
            languages=languages,
            summary=title,
            raw=raw_type
        )
        
        return item.model_dump()
        
    except Exception as e:
        print(f"  Error transforming metadata: {e}")
        return None

def run_github_acts(out_dir: str):
    """Fetch Acts from GitHub data_lk_acts branch (2020 onwards for speed)"""
    print("Starting GitHub Acts scraper...")
    docs = fetch_all_documents_from_branch(
        branch='data_lk_acts',
        base_path='data/lk_acts',
        doc_type='Act',
        start_year=2020
    )
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)
    print(f"✓ Completed: {len(docs)} Acts written to {out_dir}")

def run_github_extraordinary_gazettes(out_dir: str):
    """Fetch Extraordinary Gazettes from GitHub (2020 onwards)"""
    print("Starting GitHub Extraordinary Gazettes scraper...")
    docs = fetch_all_documents_from_branch(
        branch='data_lk_extraordinary_gazettes',
        base_path='data/lk_extraordinary_gazettes',
        doc_type='Extraordinary Gazette',
        start_year=2020
    )
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)
    print(f"✓ Completed: {len(docs)} Extraordinary Gazettes written to {out_dir}")

def run_github_bills(out_dir: str):
    """Fetch Bills from GitHub (2020 onwards)"""
    print("Starting GitHub Bills scraper...")
    docs = fetch_all_documents_from_branch(
        branch='data_lk_bills',
        base_path='data/lk_bills',
        doc_type='Bill',
        start_year=2020
    )
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)
    print(f"✓ Completed: {len(docs)} Bills written to {out_dir}")
