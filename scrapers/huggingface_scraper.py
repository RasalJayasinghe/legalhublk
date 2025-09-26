import json
import os
from typing import List, Dict, Any
from .common.model import Item
from .common.io import write_catalog_and_latest, dedupe_by_url

def fetch_hf_acts_full() -> List[Dict[str, Any]]:
    """Fetch full Acts documents from Hugging Face dataset"""
    try:
        from datasets import load_dataset
        # Check if dataset exists first
        print("Attempting to load nuuuwan/lk-acts-docs dataset...")
        dataset = load_dataset("nuuuwan/lk-acts-docs")
        
        items = []
        for split in dataset.keys():
            for row in dataset[split]:
                # Transform HF data to our Item format
                item_data = {
                    "id": f"hf-acts-{row.get('id', abs(hash(str(row))) & 0xffffffff:08x)}",
                    "type": "Act",
                    "title": row.get("title", "").strip(),
                    "date": row.get("date", "").strip()[:10],  # YYYY-MM-DD format
                    "languages": row.get("languages", ["en"]),
                    "pdf_url": row.get("pdf_url"),
                    "detail_url": row.get("detail_url"),
                    "summary": row.get("summary", row.get("title", "")),
                    "source": "huggingface/nuuuwan/lk-acts-docs",
                    "rawTypeName": "HF Act",
                    "full_content": row.get("content", ""),  # Full document content
                    "metadata": {
                        "act_number": row.get("act_number"),
                        "year": row.get("year"),
                        "gazette_date": row.get("gazette_date"),
                        "effective_date": row.get("effective_date")
                    }
                }
                items.append(item_data)
        
        print(f"Fetched {len(items)} full Acts documents from Hugging Face")
        return items
        
    except ImportError:
        print("Warning: 'datasets' package not available. Skipping HF Acts full documents.")
        return []
    except Exception as e:
        print(f"Error fetching HF Acts full documents: {e}")
        print("Note: The dataset 'nuuuwan/lk-acts-docs' may not exist on Hugging Face.")
        print("Please create this dataset or use an alternative data source.")
        return []

def fetch_hf_acts_chunks() -> List[Dict[str, Any]]:
    """Fetch Acts chunks from Hugging Face dataset"""
    try:
        from datasets import load_dataset
        # Check if dataset exists first
        print("Attempting to load nuuuwan/lk-acts-chunks dataset...")
        dataset = load_dataset("nuuuwan/lk-acts-chunks")
        
        items = []
        for split in dataset.keys():
            for row in dataset[split]:
                # Transform chunk data to our format
                item_data = {
                    "id": f"hf-chunk-{row.get('chunk_id', abs(hash(str(row))) & 0xffffffff:08x)}",
                    "type": "Act",
                    "title": f"{row.get('parent_title', 'Act')} - Section {row.get('section', '')}",
                    "date": row.get("date", "").strip()[:10],
                    "languages": row.get("languages", ["en"]),
                    "pdf_url": row.get("parent_pdf_url"),
                    "detail_url": row.get("parent_detail_url"),
                    "summary": row.get("chunk_text", "")[:200] + "...",
                    "source": "huggingface/nuuuwan/lk-acts-chunks",
                    "rawTypeName": "HF Act Chunk",
                    "chunk_content": row.get("chunk_text", ""),
                    "chunk_metadata": {
                        "parent_id": row.get("parent_id"),
                        "chunk_index": row.get("chunk_index"),
                        "section": row.get("section"),
                        "subsection": row.get("subsection"),
                        "paragraph": row.get("paragraph"),
                        "start_char": row.get("start_char"),
                        "end_char": row.get("end_char")
                    }
                }
                items.append(item_data)
        
        print(f"Fetched {len(items)} Acts chunks from Hugging Face")
        return items
        
    except ImportError:
        print("Warning: 'datasets' package not available. Skipping HF Acts chunks.")
        return []
    except Exception as e:
        print(f"Error fetching HF Acts chunks: {e}")
        print("Note: The dataset 'nuuuwan/lk-acts-chunks' may not exist on Hugging Face.")
        print("Please create this dataset or use an alternative data source.")
        return []

def run_hf_acts_full(out_dir: str):
    """Main entry point for scraping HF Acts full documents"""
    print(f"Fetching Hugging Face Acts full documents...")
    items = fetch_hf_acts_full()
    
    if not items:
        print("No HF Acts full documents found.")
        return
    
    # Dedupe and sort
    items = dedupe_by_url(items)
    items.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    # Write to output
    changed = write_catalog_and_latest(items, out_dir, latest_n=100)
    print(f"HF Acts full: {'Updated' if changed else 'No changes'} - {len(items)} documents")

def run_hf_acts_chunks(out_dir: str):
    """Main entry point for scraping HF Acts chunks"""
    print(f"Fetching Hugging Face Acts chunks...")
    items = fetch_hf_acts_chunks()
    
    if not items:
        print("No HF Acts chunks found.")
        return
    
    # Dedupe and sort
    items = dedupe_by_url(items)
    items.sort(key=lambda x: x.get("date", ""), reverse=True)
    
    # Write to output
    changed = write_catalog_and_latest(items, out_dir, latest_n=200)
    print(f"HF Acts chunks: {'Updated' if changed else 'No changes'} - {len(items)} documents")