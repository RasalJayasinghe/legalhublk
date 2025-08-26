SOURCES = {
    # Each entry: a list page (or multiple); the scraper will follow pagination if present.
    "acts": {
        "seed_urls": ["https://documents.gov.lk/view/acts/acts.html"],
        "row_selector": "a[href$='.pdf']"
    },
    "bills": {
        "seed_urls": ["https://documents.gov.lk/view/bills/bl.html"],
        "row_selector": "a[href$='.pdf']"
    },
    "forms": {
        "seed_urls": ["https://documents.gov.lk/view/general-forms/forms.html"],
        "row_selector": "a[href$='.pdf']"
    },
    "notices": {
        "seed_urls": ["https://documents.gov.lk/view/notices/notices.html"],
        "row_selector": "a[href$='.pdf']"
    }
}