#!/usr/bin/env python3
"""
Temporary script to manually sync data and populate local files
"""

import json
import requests
import os
from datetime import datetime

def download_json(url):
    """Download and parse JSON from URL."""
    try:
        print(f"Downloading: {url}")
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error downloading {url}: {e}")
        return None

def normalize_document(raw_doc):
    """Normalize document to our schema."""
    # Extract fields from the lk_legal_docs structure
    doc_id = raw_doc.get('id', raw_doc.get('doc_num', ''))
    
    # Get title from description or other fields
    title = raw_doc.get('description', raw_doc.get('title', ''))
    
    # Get date
    date_str = raw_doc.get('date', '')
    
    # Determine type from doc_type_name
    doc_type_name = raw_doc.get('doc_type_name', '').lower()
    if 'extra-gazette' in doc_type_name or 'extraordinary' in doc_type_name:
        doc_type = 'Extraordinary Gazette'
    elif 'gazette' in doc_type_name:
        doc_type = 'Gazette'
    elif 'act' in doc_type_name:
        doc_type = 'Act'
    elif 'bill' in doc_type_name:
        doc_type = 'Bill'
    else:
        doc_type = 'Gazette'  # Default
    
    # Extract languages and PDF URL from lang_to_source_url
    lang_mapping = raw_doc.get('lang_to_source_url', {})
    languages = list(lang_mapping.keys()) if lang_mapping else ['en']
    pdf_url = lang_mapping.get('en', lang_mapping.get('si', lang_mapping.get('ta', '')))
    
    return {
        'id': doc_id,
        'type': doc_type,
        'title': title,
        'date': date_str,
        'languages': languages,
        'pdf_url': pdf_url,
        'summary': title,  # Use title as summary
        'source': 'lk_legal_docs'
    }

def main():
    print("Running manual sync...")
    
    # Download from the actual repository structure
    all_url = "https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/all.json"
    latest_url = "https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/latest-100.json"
    
    # Try downloading
    all_data = download_json(all_url)
    latest_data = download_json(latest_url)
    
    if not all_data:
        print("Failed to download all data, exiting")
        return
    
    print(f"Downloaded {len(all_data)} total documents")
    if latest_data:
        print(f"Downloaded {len(latest_data)} latest documents")
    
    # Normalize documents
    all_docs = []
    for raw_doc in all_data:
        try:
            normalized = normalize_document(raw_doc)
            all_docs.append(normalized)
        except Exception as e:
            print(f"Error normalizing document: {e}")
    
    latest_docs = []
    if latest_data:
        for raw_doc in latest_data:
            try:
                normalized = normalize_document(raw_doc)
                latest_docs.append(normalized)
            except Exception as e:
                print(f"Error normalizing latest document: {e}")
    
    # Sort by date (newest first)
    def sort_key(doc):
        try:
            return datetime.fromisoformat(doc['date'].replace('Z', '+00:00'))
        except:
            return doc['date']
    
    all_docs.sort(key=sort_key, reverse=True)
    latest_docs.sort(key=sort_key, reverse=True)
    
    # Prepare output
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
    
    # Create output directory
    os.makedirs('public/data', exist_ok=True)
    
    # Write files
    with open('public/data/catalog.json', 'w', encoding='utf-8') as f:
        json.dump(catalog_data, f, indent=2, ensure_ascii=False)
    
    with open('public/data/latest.json', 'w', encoding='utf-8') as f:
        json.dump(latest_output_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nSync completed:")
    print(f"  Catalog: {len(all_docs)} documents")
    print(f"  Latest: {len(latest_docs)} documents")
    print(f"  Files written to public/data/")
    
    # Show some recent documents
    print(f"\nRecent documents:")
    for doc in all_docs[:5]:
        print(f"  {doc['date']} - {doc['type']} - {doc['title'][:60]}...")

if __name__ == '__main__':
    main()