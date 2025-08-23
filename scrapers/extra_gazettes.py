import re, time
from urllib.parse import urljoin
from .common.http import soup
from .common.model import Item
from .common.io import dedupe_by_url, write_catalog_and_latest

BASE = "https://documents.gov.lk"
# Extraordinary index pages usually look like .../view/extra-gazettes/egz_2025.html
EGZ_INDEX = "/view/extra-gazettes/egz_{year}.html"
PDF = re.compile(r"\.pdf$", re.I)

def _index_urls(from_year:int, to_year:int):
    return [f"{BASE}{EGZ_INDEX.format(year=y)}" for y in range(from_year, to_year+1)]

def crawl(from_year:int, to_year:int):
    rows = []
    for url in _index_urls(from_year, to_year):
        s = soup(url)
        # any PDF link on the page
        for a in s.select("a[href$='.pdf']"):
            pdf = urljoin(BASE, a["href"].strip())
            # try to infer date (extra gazettes often include yyyy-mm-dd in filename or adjacent text)
            date = "1970-01-01"
            m = re.search(r"(\d{4}-\d{2}-\d{2})", pdf)
            if m: date = m.group(1)
            title = a.get_text(strip=True) or pdf.split("/")[-1]
            rows.append(Item.make(type="Extraordinary Gazette", date=date, title=title,
                                  url=pdf, languages=[], raw="extra-gazettes").model_dump())
        time.sleep(1)
    return dedupe_by_url(rows)

def run(from_year:int, to_year:int, out_dir:str):
    docs = crawl(from_year, to_year)
    docs.sort(key=lambda d: d.get("date",""), reverse=True)
    write_catalog_and_latest(docs, out_dir)