#!/usr/bin/env python3
"""
LegalHub LK Document Sync Script

Downloads legal documents from the lk_legal_docs_data repository,
normalizes the data, and generates optimized JSON files for the frontend.
"""

import json
import os
import sys
import tempfile
from datetime import datetime
from typing import Dict, List, Any, Optional
import requests


def get_env_var(name: str, default: str = "") -> str:
    """Get environment variable with optional default."""
    return os.environ.get(name, default)


def download_json(url: str) -> Optional[Dict[str, Any]]:
    """Download and parse JSON from URL with error handling."""
    try:
        print(f"Downloading: {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Error downloading {url}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON from {url}: {e}")
        return None


def normalize_document(raw_doc: Dict[str, Any]) -> Dict[str, Any]:
    """
    Normalize a raw document to the standard schema.
    
    Expected output schema:
    {
        id: string,
        type: 'Act' | 'Bill' | 'Gazette' | 'Extraordinary Gazette',
        title: string,
        date: string, // ISO format
        languages: string[], // ['en', 'si', 'ta']
        pdf_url: string,
        summary: string,
        source: string
    }
    """
    # Extract basic fields
    doc_id = raw_doc.get('id', '')
    title = raw_doc.get('title', '').strip()
    date_str = raw_doc.get('date', '')
    
    # Determine document type from various fields
    doc_type = raw_doc.get('type', '').lower()
    if 'act' in doc_type or 'act' in title.lower():
        normalized_type = 'Act'
    elif 'bill' in doc_type or 'bill' in title.lower():
        normalized_type = 'Bill'
    elif 'extraordinary' in doc_type or 'extraordinary' in title.lower():
        normalized_type = 'Extraordinary Gazette'
    elif 'gazette' in doc_type or 'gazette' in title.lower():
        normalized_type = 'Gazette'
    else:
        # Fallback based on ID pattern or content
        if 'act' in doc_id.lower():
            normalized_type = 'Act'
        elif 'bill' in doc_id.lower():
            normalized_type = 'Bill'
        elif 'extraordinary' in doc_id.lower():
            normalized_type = 'Extraordinary Gazette'
        else:
            normalized_type = 'Gazette'
    
    # Extract languages
    languages = []
    lang_field = raw_doc.get('language', raw_doc.get('languages', []))
    if isinstance(lang_field, list):
        languages = lang_field
    elif isinstance(lang_field, str):
        languages = [lang_field] if lang_field else []
    
    # Ensure we have at least 'en' if no languages specified
    if not languages:
        languages = ['en']
    
    # PDF URL
    pdf_url = raw_doc.get('pdf_url', raw_doc.get('url', ''))
    
    # Summary
    summary = raw_doc.get('summary', raw_doc.get('description', ''))
    
    # Source reference
    source = raw_doc.get('source', 'lk_legal_docs_data')
    
    return {
        'id': doc_id,
        'type': normalized_type,
        'title': title,
        'date': date_str,
        'languages': languages,
        'pdf_url': pdf_url,
        'summary': summary,
        'source': source
    }


def sort_documents_by_date(documents: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Sort documents by date, newest first."""
    def get_sort_key(doc):
        date_str = doc.get('date', '')
        try:
            # Try to parse as ISO date
            return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        except:
            # Fallback to string sorting for non-ISO dates
            return date_str
    
    return sorted(documents, key=get_sort_key, reverse=True)


def write_json_atomically(filepath: str, data: Dict[str, Any]) -> None:
    """Write JSON data to file atomically using temporary file."""
    os.makedirs(os.path.dirname(filepath), exist_ok=True)
    
    # Write to temporary file first
    with tempfile.NamedTemporaryFile(
        mode='w', 
        dir=os.path.dirname(filepath),
        delete=False,
        suffix='.tmp'
    ) as tmp_file:
        json.dump(data, tmp_file, indent=2, ensure_ascii=False)
        tmp_filepath = tmp_file.name
    
    # Atomic move
    os.replace(tmp_filepath, filepath)
    print(f"Written: {filepath} ({len(json.dumps(data))} bytes)")


def main():
    """Main sync function."""
    print("Starting LegalHub LK document sync...")
    
    # Get configuration from environment
    source_base = get_env_var('SOURCE_BASE', 'https://raw.githubusercontent.com/nuuuwan/lk_legal_docs_data/main')
    source_all = get_env_var('SOURCE_ALL', 'data_1980s_2020s/all.json')
    source_latest = get_env_var('SOURCE_LATEST', 'data_2020s/latest-100.json')
    output_dir = get_env_var('OUTPUT_DIR', 'public/data')
    
    # Construct URLs
    all_url = f"{source_base}/{source_all}"
    latest_url = f"{source_base}/{source_latest}"
    
    print(f"Source URLs:")
    print(f"  All: {all_url}")
    print(f"  Latest: {latest_url}")
    print(f"Output directory: {output_dir}")
    
    # Download data
    all_data = download_json(all_url)
    latest_data = download_json(latest_url)
    
    if not all_data:
        print("Failed to download all documents data")
        sys.exit(1)
    
    if not latest_data:
        print("Failed to download latest documents data")
        sys.exit(1)
    
    # Process all documents
    all_docs = []
    if isinstance(all_data, list):
        raw_docs = all_data
    elif isinstance(all_data, dict) and 'documents' in all_data:
        raw_docs = all_data['documents']
    else:
        raw_docs = []
    
    for raw_doc in raw_docs:
        try:
            normalized = normalize_document(raw_doc)
            all_docs.append(normalized)
        except Exception as e:
            print(f"Error normalizing document {raw_doc.get('id', 'unknown')}: {e}")
    
    # Process latest documents
    latest_docs = []
    if isinstance(latest_data, list):
        raw_latest = latest_data
    elif isinstance(latest_data, dict) and 'documents' in latest_data:
        raw_latest = latest_data['documents']
    else:
        raw_latest = []
    
    for raw_doc in raw_latest:
        try:
            normalized = normalize_document(raw_doc)
            latest_docs.append(normalized)
        except Exception as e:
            print(f"Error normalizing latest document {raw_doc.get('id', 'unknown')}: {e}")
    
    # Sort documents by date (newest first)
    all_docs = sort_documents_by_date(all_docs)
    latest_docs = sort_documents_by_date(latest_docs)
    
    # Prepare output data
    current_time = datetime.utcnow().isoformat() + 'Z'
    
    catalog_data = {
        'updated_at': current_time,
        'count': len(all_docs),
        'documents': all_docs
    }
    
    latest_output_data = {
        'updated_at': current_time,
        'count': len(latest_docs),
        'documents': latest_docs
    }
    
    # Write output files
    catalog_path = os.path.join(output_dir, 'catalog.json')
    latest_path = os.path.join(output_dir, 'latest.json')
    
    write_json_atomically(catalog_path, catalog_data)
    write_json_atomically(latest_path, latest_output_data)
    
    print(f"\nSync completed successfully:")
    print(f"  Catalog: {len(all_docs)} documents")
    print(f"  Latest: {len(latest_docs)} documents")
    print(f"  Updated at: {current_time}")


if __name__ == '__main__':
    main()