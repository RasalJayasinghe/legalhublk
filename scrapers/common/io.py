import os, json, hashlib
from datetime import datetime, timezone
from typing import List, Dict

def _sha(b: bytes) -> str:
    return hashlib.sha256(b).hexdigest()

def _write_if_changed(path: str, data: dict) -> bool:
    blob = json.dumps(data, ensure_ascii=False, separators=(",",":"))
    new_hash = _sha(blob.encode())
    old_hash = _sha(open(path,"rb").read()) if os.path.exists(path) else None
    if new_hash != old_hash:
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path,"w",encoding="utf-8") as f: f.write(blob)
        return True
    return False

def write_catalog_and_latest(items: List[dict], out_dir: str, latest_n=100):
    os.makedirs(out_dir, exist_ok=True)
    items_sorted = sorted(items, key=lambda d: d.get("date",""), reverse=True)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    catalog = {"updated_at": now, "count": len(items_sorted), "documents": items_sorted}
    latest  = {"updated_at": now, "count": min(latest_n, len(items_sorted)),
               "documents": items_sorted[:latest_n]}
    cat_changed = _write_if_changed(os.path.join(out_dir,"catalog.json"), catalog)
    lat_changed = _write_if_changed(os.path.join(out_dir,"latest.json"), latest)
    return cat_changed or lat_changed

def dedupe_by_url(items: List[dict]) -> List[dict]:
    by: Dict[str, dict] = {}
    for d in items:
        # Prefer common keys; fall back to 'url' used by our scrapers
        key = d.get("pdf_url") or d.get("detail_url") or d.get("url")
        if not key:
            # Last resort fallbacks seen in some sources
            key = d.get("pdf") or d.get("href")
        if not key:
            continue
        old = by.get(key)
        if not old or d.get("date","") > old.get("date",""):
            by[key] = d
    return list(by.values())

def write_all_latest(buckets: Dict[str, List[dict]], out_dir: str, latest_n=300):
    # Merge small "latest" for super-fast home/search
    merged = []
    for _, docs in buckets.items():
        merged.extend(docs[:latest_n])     # assume docs already newest-first
    merged.sort(key=lambda d: d.get("date",""), reverse=True)
    write_catalog_and_latest(merged, os.path.join(out_dir, "all"), latest_n=latest_n)