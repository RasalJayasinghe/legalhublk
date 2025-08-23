import time, requests
from bs4 import BeautifulSoup

UA = "LegalHubLK/1.0 (+https://legalhub.example)"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": UA})

def get(url, *, timeout=30, max_retries=4, backoff=1.5):
    for i in range(max_retries):
        try:
            r = SESSION.get(url, timeout=timeout)
            r.raise_for_status()
            return r
        except Exception:
            if i == max_retries - 1:
                raise
            time.sleep(backoff ** i)

def soup(url):
    return BeautifulSoup(get(url).text, "lxml")