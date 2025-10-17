import re, time
from urllib.parse import urljoin
from .common.http import soup
from .common.model import Item
from .common.io import dedupe_by_url, write_catalog_and_latest
from .sources import SOURCES

BASE = "https://documents.gov.lk"
PDF = re.compile(r"\.pdf$", re.I)
DATE_IN_NAME = re.compile(r"(\d{4}-\d{2}-\d{2})")   # best-effort; fallback handled below

def _extract_pdf_items(list_url: str, row_selector: str, type_label: str, raw_name: str):
    s = soup(list_url)
    items = []
    for a in s.select(row_selector):
        href = a["href"].strip()
        if not PDF.search(href): 
            continue
        url = urljoin(BASE, href)
        title = a.get_text(strip=True) or url.split("/")[-1]
        m = DATE_IN_NAME.search(url) or DATE_IN_NAME.search(title)
        date = m.group(1) if m else "1970-01-01"  # fallback if date not on the row
        items.append(Item.make(type=type_label, date=date, title=title, url=url,
                               languages=[], raw=raw_name).model_dump())
    return items

def crawl(kind: str):
    cfg = SOURCES[kind]
    rows = []
    for seed in cfg["seed_urls"]:
        rows.extend(_extract_pdf_items(seed, cfg["row_selector"], type_label=kind[:-1].capitalize() if kind.endswith('s') else kind.capitalize(), raw_name=kind))
        time.sleep(1)
    return dedupe_by_url(rows)

def run(kind: str, out_dir: str):
    docs = crawl(kind)
    docs.sort(key=lambda d: d.get("date",""), reverse=True)
    write_catalog_and_latest(docs, out_dir)