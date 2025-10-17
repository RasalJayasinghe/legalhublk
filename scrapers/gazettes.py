import re, time
from urllib.parse import urljoin
from .common.http import soup
from .common.model import Item
from .common.io import dedupe_by_url, write_catalog_and_latest

BASE = "https://documents.gov.lk"
DATE_PAGE = re.compile(r"^/view/gazettes/\d{4}-\d{2}-\d{2}\.html$")
PDF = re.compile(r"\.pdf$", re.I)

def _year_date_pages(year:int):
    try:
        s = soup(f"{BASE}/view/gazettes/{year}.html")
        return sorted({a['href'].strip() for a in s.select("a[href]") if DATE_PAGE.match(a['href'].strip())})
    except Exception:
        return []

def _lang_from_name(name:str):
    m = re.search(r"([EST])\.pdf$", name, re.I)
    return {"E":"en","S":"si","T":"ta"}.get(m.group(1).upper()) if m else None

def crawl(from_year:int, to_year:int):
    rows = []
    for y in range(from_year, to_year+1):
        for dp in _year_date_pages(y):
            date = re.search(r"/(\d{4}-\d{2}-\d{2})\.html$", dp).group(1)
            try:
                s = soup(urljoin(BASE, dp))
                for a in s.select("a[href]"):
                    href = a["href"].strip()
                    if not PDF.search(href):
                        continue
                    url = urljoin(BASE, href)
                    title = a.get_text(strip=True) or url.split("/")[-1]
                    lang = _lang_from_name(url) or "en"
                    rows.append(Item.make(type="Gazette", date=date, title=title,
                                          url=url, languages=[lang], raw="gazettes").model_dump())
                time.sleep(1)  # politeness
            except Exception:
                # Skip problematic date pages, continue crawling
                continue
    return dedupe_by_url(rows)

def run(from_year:int, to_year:int, out_dir:str):
    docs = crawl(from_year, to_year)
    docs.sort(key=lambda d: d["date"], reverse=True)
    write_catalog_and_latest(docs, out_dir)