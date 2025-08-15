#!/usr/bin/env python3
"""Manual sync to quickly test and populate data"""

import json
import requests
from datetime import datetime
import os

def fetch_and_sync():
    print("Fetching data from lk_legal_docs repository...")
    
    # Try the all.json endpoint
    all_url = "https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/all.json"
    latest_url = "https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/latest-100.json"
    
    try:
        # Fetch all documents
        print(f"Fetching: {all_url}")
        response = requests.get(all_url, timeout=30)
        response.raise_for_status()
        all_docs = response.json()
        print(f"✓ Downloaded {len(all_docs)} total documents")
        
        # Fetch latest documents
        print(f"Fetching: {latest_url}")
        response = requests.get(latest_url, timeout=30)
        response.raise_for_status()
        latest_docs = response.json()
        print(f"✓ Downloaded {len(latest_docs)} latest documents")
        
        # Show sample of August 2025 documents (the new ones)
        august_2025_docs = [doc for doc in all_docs if doc.get('date', '').startswith('2025-08')]
        print(f"\n🔥 Found {len(august_2025_docs)} August 2025 documents (NEW!):")
        for doc in august_2025_docs[:5]:
            print(f"  • {doc.get('date', 'N/A')} - {doc.get('doc_type_name', 'N/A')} - {doc.get('description', 'N/A')[:60]}...")
        
        # Normalize documents for our frontend
        def normalize_doc(raw):
            doc_type_name = raw.get('doc_type_name', '').lower()
            if 'extra-gazette' in doc_type_name:
                doc_type = 'Extraordinary Gazette'
            elif 'gazette' in doc_type_name:
                doc_type = 'Gazette'
            elif 'act' in doc_type_name:
                doc_type = 'Act'
            elif 'bill' in doc_type_name:
                doc_type = 'Bill'
            else:
                doc_type = 'Gazette'
            
            lang_mapping = raw.get('lang_to_source_url', {})
            languages = list(lang_mapping.keys()) if lang_mapping else ['en']
            pdf_url = lang_mapping.get('en', lang_mapping.get('si', lang_mapping.get('ta', '')))
            
            return {
                'id': raw.get('id', raw.get('doc_num', '')),
                'type': doc_type,
                'title': raw.get('description', raw.get('title', '')),
                'date': raw.get('date', ''),
                'languages': languages,
                'pdf_url': pdf_url,
                'summary': raw.get('description', raw.get('title', '')),
                'source': 'lk_legal_docs'
            }
        
        # Normalize all documents
        normalized_all = [normalize_doc(doc) for doc in all_docs]
        normalized_latest = [normalize_doc(doc) for doc in latest_docs]
        
        # Sort by date (newest first)
        normalized_all.sort(key=lambda x: x['date'], reverse=True)
        normalized_latest.sort(key=lambda x: x['date'], reverse=True)
        
        # Create output structure
        current_time = datetime.utcnow().isoformat() + 'Z'
        
        catalog_data = {
            'updated_at': current_time,
            'count': len(normalized_all),
            'documents': normalized_all
        }
        
        latest_data = {
            'updated_at': current_time,
            'count': len(normalized_latest),
            'documents': normalized_latest
        }
        
        # Write to files
        os.makedirs('public/data', exist_ok=True)
        
        with open('public/data/catalog.json', 'w', encoding='utf-8') as f:
            json.dump(catalog_data, f, indent=2, ensure_ascii=False)
        
        with open('public/data/latest.json', 'w', encoding='utf-8') as f:
            json.dump(latest_data, f, indent=2, ensure_ascii=False)
        
        print(f"\n✅ SYNC COMPLETED!")
        print(f"📁 Catalog: {len(normalized_all)} documents")
        print(f"📁 Latest: {len(normalized_latest)} documents")
        print(f"⏰ Updated at: {current_time}")
        
        # Show proof of the 4 new documents
        print(f"\n🎯 PROOF - Recent August 2025 documents now available:")
        recent_august = [doc for doc in normalized_all if doc['date'].startswith('2025-08')][:4]
        for i, doc in enumerate(recent_august, 1):
            print(f"  {i}. {doc['date']} - {doc['type']} - {doc['title'][:50]}...")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == '__main__':
    fetch_and_sync()