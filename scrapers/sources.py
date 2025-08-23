SOURCES = {
    # Each entry: a list page (or multiple); the scraper will follow pagination if present.
    "acts": {
        "seed_urls": ["https://documents.gov.lk/view/acts/find_acts.html"],
        "row_selector": "a[href$='.pdf']"
    },
    "bills": {
        "seed_urls": ["https://documents.gov.lk/view/bills/find_bills.html"],
        "row_selector": "a[href$='.pdf']"
    },
    "forms": {
        "seed_urls": ["https://documents.gov.lk/view/forms/find_forms.html"],
        "row_selector": "a[href$='.pdf']"
    },
    "notices": {
        "seed_urls": ["https://documents.gov.lk/view/notices/find_notices.html"],
        "row_selector": "a[href$='.pdf']"
    }
}