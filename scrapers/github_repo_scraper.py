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

def fetch_github_json_files(branch: str, path: str, doc_type: str) -> List[dict]:
    """
    Fetch all JSON files from a specific GitHub branch and path.
    
    Args:
        branch: GitHub branch name (e.g., 'data_lk_acts')
        path: Path within the branch (e.g., 'data/lk_acts')
        doc_type: Document type for normalization (e.g., 'Act', 'Bill', 'Extraordinary Gazette')
    
    Returns:
        List of normalized Item dictionaries
    """
    items = []
    
    try:
        # Get directory contents from GitHub API
        api_url = f"{GITHUB_API_BASE}/contents/{path}?ref={branch}"
        print(f"Fetching directory listing from: {api_url}")
        
        response = get(api_url)
        contents = response.json()
        
        if not isinstance(contents, list):
            print(f"Warning: Expected list, got {type(contents)}")
            return items
        
        # Filter for directories (each document has its own folder)
        directories = [item for item in contents if item.get('type') == 'dir']
        print(f"Found {len(directories)} document directories")
        
        # Fetch metadata.json from each directory
        for i, dir_item in enumerate(directories):
            dir_name = dir_item['name']
            metadata_url = f"{GITHUB_RAW_BASE}/{branch}/{path}/{dir_name}/metadata.json"
            
            try:
                print(f"[{i+1}/{len(directories)}] Fetching: {dir_name}")
                response = get(metadata_url, timeout=10)
                metadata = response.json()
                
                # Transform to Item format
                item_dict = transform_metadata_to_item(metadata, doc_type)
                if item_dict:
                    items.append(item_dict)
                
                # Rate limiting - be gentle with GitHub API
                if (i + 1) % 10 == 0:
                    time.sleep(1)
                    
            except Exception as e:
                print(f"  Error fetching {dir_name}: {e}")
                continue
        
        print(f"Successfully fetched {len(items)} items from {branch}")
        
    except Exception as e:
        print(f"Error fetching from GitHub branch {branch}: {e}")
    
    return items

def transform_metadata_to_item(metadata: Dict, doc_type: str) -> dict:
    """
    Transform GitHub metadata.json to our Item model format.
    
    Expected metadata structure:
    {
        "id": "2025-01-15-...",
        "doc_num": "...",
        "date": "2025-01-15",
        "description": "...",
        "doc_type_name": "gazettes",
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
            url=pdf_url or f"https://documents.gov.lk/{doc_id}",  # Fallback URL
            languages=languages,
            summary=title,
            raw=raw_type
        )
        
        return item.model_dump()
        
    except Exception as e:
        print(f"  Error transforming metadata: {e}")
        return None

def run_github_acts(out_dir: str):
    """Fetch Acts from GitHub data_lk_acts branch"""
    print("Starting GitHub Acts scraper...")
    docs = fetch_github_json_files(
        branch='data_lk_acts',
        path='data/lk_acts', 
        doc_type='Act'
    )
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)
    print(f"Completed: {len(docs)} Acts written to {out_dir}")

def run_github_extraordinary_gazettes(out_dir: str):
    """Fetch Extraordinary Gazettes from GitHub data_lk_extraordinary_gazettes branch"""
    print("Starting GitHub Extraordinary Gazettes scraper...")
    docs = fetch_github_json_files(
        branch='data_lk_extraordinary_gazettes',
        path='data/lk_extraordinary_gazettes',
        doc_type='Extraordinary Gazette'
    )
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)
    print(f"Completed: {len(docs)} Extraordinary Gazettes written to {out_dir}")

def run_github_bills(out_dir: str):
    """Fetch Bills from GitHub data_lk_bills branch"""
    print("Starting GitHub Bills scraper...")
    docs = fetch_github_json_files(
        branch='data_lk_bills',
        path='data/lk_bills',
        doc_type='Bill'
    )
    docs = dedupe_by_url(docs)
    docs.sort(key=lambda d: d.get("date", ""), reverse=True)
    write_catalog_and_latest(docs, out_dir)
    print(f"Completed: {len(docs)} Bills written to {out_dir}")
