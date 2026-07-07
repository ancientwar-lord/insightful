from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, date as dt_date

class NewsUpdateRequest(BaseModel):
    query: str = Field(default="ai", min_length=1, max_length=50, description="Search query for news")
    source_slug: str | None = Field(default=None, description="Source slug to refresh specific source")

class NewsArticleResponse(BaseModel):
    id: int
    title: str
    description: str | None = None
    url: str
    url_to_image: str | None = None
    published_at: datetime
    content: str | None = None
    source_name: str  # extra field from join
    keyword: str | None = None  # extra field from join with QueryKeyword

class NewsListResponse(BaseModel):
    total: int
    page: int
    limit: int
    articles: list[NewsArticleResponse]

class NewsQueryParams(BaseModel):
    skip: int = Field(default=0, ge=0)
    limit: int = Field(default=21, gt=0, le=100)
    source: str | None = None
    keyword_ids: str | None = Field(default=None, description="Comma-separated keyword IDs")
    source_ids: str | None = Field(default=None, description="Comma-separated source IDs")
    date: dt_date | None = Field(default=None, description="Filter articles by exact date")
    search: str | None = Field(default=None, description="Case-insensitive title search query")

class ErrorResponse(BaseModel):
    detail: str
    status_code: int
    timestamp: datetime

class KeywordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    keyword: str
    discription: str | None = None
    is_pinned: bool
    advanced_query: str | None = None
    exclude_domains: str | None = None

class KeywordListResponse(BaseModel):
    total: int
    keywords: list[KeywordResponse]

class FetchHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fetched_at: datetime
    total_found: int
    total_fetched: int
    total_duplicates: int
    total_saved: int

class HistoryListResponse(BaseModel):
    total: int
    histories: list[FetchHistoryResponse]

class SourceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    source_slug: str | None = None
    name: str
    is_pinned: bool
    advanced_query: str | None = None

class SourceListResponse(BaseModel):
    total: int
    sources: list[SourceResponse]

class SourceFetchHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    fetched_at: datetime
    total_fetched: int
    total_duplicates: int
    total_saved: int

class SourceHistoryListResponse(BaseModel):
    total: int
    histories: list[SourceFetchHistoryResponse]

class SourceCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100, description="Name of the custom source collection")
    source_slug: str = Field(min_length=1, max_length=500, description="Comma-separated domains or source slugs")

class SourceUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    source_slug: str | None = Field(default=None, min_length=1, max_length=500)
    is_pinned: bool | None = None
    advanced_query: str | None = Field(default=None, max_length=500)

class KeywordUpdateRequest(BaseModel):
    keyword: str | None = Field(default=None, min_length=1, max_length=100)
    discription: str | None = Field(default=None, max_length=500)
    is_pinned: bool | None = None
    advanced_query: str | None = Field(default=None, max_length=500)
    exclude_domains: str | None = Field(default=None, max_length=500)


# ─── Article Action Schemas ───────────────────────────────────────────

class ArticleActionCreate(BaseModel):
    action_type: str = Field(description="One of: favourite, spam, to_read, learnings")
    description: str | None = Field(default=None, description="Optional reason/note for the action")

class ArticleActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    article_id: int
    action_type: str
    description: str | None = None
    created_at: datetime

class ArticleActionWithArticle(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    article_id: int
    action_type: str
    description: str | None = None
    created_at: datetime
    article: NewsArticleResponse

class ArticleActionListResponse(BaseModel):
    total: int
    page: int
    limit: int
    actions: list[ArticleActionWithArticle]

class ArticleActionsForArticle(BaseModel):
    article_id: int
    actions: list[ArticleActionResponse]


# ─── Note Schemas ──────────────────────────────────────────────────

class NoteCreateRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200, description="Title of the note")
    content: str = Field(description="Content of the note")

class NoteUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    content: str | None = None

class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

class NoteListResponse(BaseModel):
    total: int
    notes: list[NoteResponse]

