from pydantic import BaseModel, Field, HttpUrl
from typing import List, Literal, Optional

DocType = Literal["Gazette","Extraordinary Gazette","Act","Bill","Form","Notice"]

class Item(BaseModel):
    id: str
    type: DocType
    title: str
    date: str                           # YYYY-MM-DD
    languages: List[str] = Field(default_factory=list)  # ['en','si','ta'] when known
    pdf_url: Optional[HttpUrl] = None
    detail_url: Optional[HttpUrl] = None
    summary: str = ""
    source: str = "documents.gov.lk"
    rawTypeName: str = ""               # site-specific label

    @classmethod
    def make(cls, *, type: DocType, date: str, title: str, url: str,
             languages=None, summary="", raw=""):
        return cls(
            id=f"{date}-{abs(hash(url)) & 0xffffffff:08x}",
            type=type, title=title, date=date,
            languages=languages or [], pdf_url=url,
            summary=summary or title, rawTypeName=raw
        )