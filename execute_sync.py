#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta
import os

def normalize_document(doc):
    """Normalize document data to match frontend expectations"""
    return {
        "id": doc.get("id", doc.get("doc_num", "")),
        "type": doc.get("type", "Gazette" if doc.get("doc_type_name") == "gazettes" else "Extraordinary Gazette" if doc.get("doc_type_name") == "extra-gazettes" else doc.get("doc_type_name", "").title()),
        "title": doc.get("description", doc.get("title", "Untitled")),
        "date": doc.get("date", ""),
        "languages": list(doc.get("lang_to_source_url", {}).keys()) if doc.get("lang_to_source_url") else ["en"],
        "pdf_url": next(iter(doc.get("lang_to_source_url", {}).values())) if doc.get("lang_to_source_url") else "",
        "summary": doc.get("description", doc.get("summary", "")),
        "source": "lk_legal_docs",
        "rawTypeName": doc.get("doc_type_name", "gazettes")
    }

def fetch_latest_documents():
    """Fetch the latest documents from the GitHub repository"""
    try:
        print("Fetching latest documents from GitHub...")
        
        # Get the all.json file which contains all documents
        url = "https://raw.githubusercontent.com/nuuuwan/lk_legal_docs/main/data/all.json"
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        
        all_docs = response.json()
        print(f"Found {len(all_docs)} total documents")
        
        # Sort by date descending to get the latest first
        sorted_docs = sorted(all_docs, key=lambda x: x.get("date", ""), reverse=True)
        
        # Get the latest 50 documents for the catalog
        latest_50 = sorted_docs[:50]
        
        # Normalize all documents
        normalized_catalog = []
        for doc in latest_50:
            normalized = normalize_document(doc)
            if normalized["date"]:  # Only include docs with valid dates
                normalized_catalog.append(normalized)
        
        # Get recent documents (last 60 days to capture more)
        sixty_days_ago = (datetime.now() - timedelta(days=60)).strftime("%Y-%m-%d")
        
        recent_docs = []
        for doc in sorted_docs:
            doc_date = doc.get("date", "")
            if doc_date and doc_date >= sixty_days_ago:
                normalized = normalize_document(doc)
                if normalized["date"]:
                    recent_docs.append(normalized)
        
        # Sort by date descending
        recent_docs.sort(key=lambda x: x["date"], reverse=True)
        
        print(f"Found {len(recent_docs)} documents from last 60 days")
        
        # Create the catalog data
        catalog_data = {
            "updated_at": datetime.utcnow().isoformat() + "Z",
            "count": len(normalized_catalog),
            "documents": normalized_catalog
        }
        
        # Create the latest data (recent documents)
        latest_data = {
            "updated_at": datetime.utcnow().isoformat() + "Z", 
            "count": len(recent_docs),
            "documents": recent_docs
        }
        
        # Ensure directory exists
        os.makedirs("public/data", exist_ok=True)
        
        # Write to files
        with open("public/data/catalog.json", "w", encoding="utf-8") as f:
            json.dump(catalog_data, f, indent=2, ensure_ascii=False)
        
        with open("public/data/latest.json", "w", encoding="utf-8") as f:
            json.dump(latest_data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Successfully updated:")
        print(f"   - catalog.json: {len(normalized_catalog)} documents")
        print(f"   - latest.json: {len(recent_docs)} recent documents")
        
        if recent_docs:
            print(f"📅 Latest document date: {recent_docs[0]['date']}")
            print("🆕 Recent documents:")
            for doc in recent_docs[:5]:
                print(f"   - {doc['date']}: {doc['title']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error fetching documents: {str(e)}")
        return False

if __name__ == "__main__":
    fetch_latest_documents()