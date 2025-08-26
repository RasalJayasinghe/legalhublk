import subprocess
import sys
import os
import json
from datetime import datetime

def create_sample_data():
    """Create sample data for testing the new structure"""
    print("Creating sample data for testing...")
    
    # Sample documents for each type
    sample_docs = {
        "acts": [
            {
                "id": "2025-01-15-12345678",
                "type": "Act",
                "title": "Sample Act Amendment 2025",
                "date": "2025-01-15", 
                "languages": ["en"],
                "pdf_url": "https://documents.gov.lk/files/pdf/2025/01/act_sample.pdf",
                "summary": "Sample Act Amendment 2025",
                "source": "documents.gov.lk",
                "rawTypeName": "acts"
            }
        ],
        "bills": [
            {
                "id": "2025-01-14-87654321",
                "type": "Bill",
                "title": "Sample Bill for Testing 2025",
                "date": "2025-01-14",
                "languages": ["en"],
                "pdf_url": "https://documents.gov.lk/files/pdf/2025/01/bill_sample.pdf", 
                "summary": "Sample Bill for Testing 2025",
                "source": "documents.gov.lk",
                "rawTypeName": "bills"
            }
        ],
        "forms": [
            {
                "id": "2025-01-13-11223344",
                "type": "Form",
                "title": "Sample Legal Form 2025",
                "date": "2025-01-13",
                "languages": ["en"],
                "pdf_url": "https://documents.gov.lk/files/pdf/2025/01/form_sample.pdf",
                "summary": "Sample Legal Form 2025", 
                "source": "documents.gov.lk",
                "rawTypeName": "forms"
            }
        ],
        "notices": [
            {
                "id": "2025-01-12-55667788",
                "type": "Notice", 
                "title": "Sample Legal Notice 2025",
                "date": "2025-01-12",
                "languages": ["en"],
                "pdf_url": "https://documents.gov.lk/files/pdf/2025/01/notice_sample.pdf",
                "summary": "Sample Legal Notice 2025",
                "source": "documents.gov.lk", 
                "rawTypeName": "notices"
            }
        ],
        "gazettes": [
            {
                "id": "2025-01-11-99887766",
                "type": "Gazette",
                "title": "Sample Gazette January 2025",
                "date": "2025-01-11",
                "languages": ["en"],
                "pdf_url": "https://documents.gov.lk/files/pdf/2025/01/gazette_sample.pdf",
                "summary": "Sample Gazette January 2025",
                "source": "documents.gov.lk",
                "rawTypeName": "gazettes"
            }
        ],
        "extra-gazettes": [
            {
                "id": "2025-01-10-44556677",
                "type": "Extraordinary Gazette",
                "title": "Sample Extraordinary Gazette 2025",
                "date": "2025-01-10", 
                "languages": ["en"],
                "pdf_url": "https://documents.gov.lk/files/pdf/2025/01/extra_gazette_sample.pdf",
                "summary": "Sample Extraordinary Gazette 2025",
                "source": "documents.gov.lk",
                "rawTypeName": "extra-gazettes"
            }
        ]
    }
    
    # Create directory structure and files
    current_time = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    
    for doc_type, docs in sample_docs.items():
        # Create per-type directories and files
        type_dir = f"public/data/{doc_type}"
        os.makedirs(type_dir, exist_ok=True)
        
        catalog_data = {
            "updated_at": current_time,
            "count": len(docs),
            "documents": docs
        }
        
        latest_data = {
            "updated_at": current_time, 
            "count": len(docs),
            "documents": docs
        }
        
        with open(f"{type_dir}/catalog.json", "w", encoding="utf-8") as f:
            json.dump(catalog_data, f, indent=2, ensure_ascii=False)
            
        with open(f"{type_dir}/latest.json", "w", encoding="utf-8") as f:
            json.dump(latest_data, f, indent=2, ensure_ascii=False)
            
        print(f"✅ Created {doc_type} data files")
    
    # Create merged "all" directory
    all_dir = "public/data/all"
    os.makedirs(all_dir, exist_ok=True)
    
    # Merge all documents
    all_docs = []
    for docs in sample_docs.values():
        all_docs.extend(docs)
    
    # Sort by date descending
    all_docs.sort(key=lambda x: x["date"], reverse=True)
    
    merged_catalog = {
        "updated_at": current_time,
        "count": len(all_docs),
        "documents": all_docs
    }
    
    merged_latest = {
        "updated_at": current_time,
        "count": len(all_docs),
        "documents": all_docs
    }
    
    with open(f"{all_dir}/catalog.json", "w", encoding="utf-8") as f:
        json.dump(merged_catalog, f, indent=2, ensure_ascii=False)
        
    with open(f"{all_dir}/latest.json", "w", encoding="utf-8") as f:
        json.dump(merged_latest, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Created merged all data files")
    print(f"📊 Total documents: {len(all_docs)}")
    print("🎉 Sample data creation complete!")

if __name__ == "__main__":
    create_sample_data()