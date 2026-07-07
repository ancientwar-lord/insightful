from sqlalchemy import table
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel
from datetime import datetime, timezone
from zoneinfo import ZoneInfo





class NewsArticle(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    # 🔗 CONNECTION LINE (Foreign Key):
    # This column stores which Source ID this article is linked to (e.g. Source ID: 1)
    source_id: int = Field(foreign_key="newssource.id")
    query_keyword_id: Optional[int] = Field(default=None, foreign_key="querykeyword.id")
    fetch_history_id: Optional[int] = Field(default=None, foreign_key="fetchhistory.id")

    # All other standard fields:
    author: Optional[str] = None
    title: str = Field(index=True)
    description: Optional[str] = None
    url: str = Field(unique=True)
    url_to_image: Optional[str] = None
    published_at: datetime
    content: Optional[str] = None

    # [Relationship]: Tells SQLModel that when 'article.source' is accessed,
    # it should fetch the complete source object
    source: "NewsSource" = Relationship(back_populates="articles")
    # 🔥 IMPORTANT: Must be Optional[int], so that older articles can have NULL
    query_keyword: "QueryKeyword" = Relationship(back_populates="articles")
    fetch_history: Optional["FetchHistory"] = Relationship(back_populates="articles")
    # Article pe user ke actions (favourite, spam, to_read, learnings)
    actions: List["ArticleAction"] = Relationship(back_populates="article", cascade_delete=True)


class ArticleAction(SQLModel, table=True):
    """User actions on articles — favourite, spam, to_read, learnings.
    Delete is a direct DB removal, not tracked here."""
    id: Optional[int] = Field(default=None, primary_key=True)
    article_id: int = Field(foreign_key="newsarticle.id", index=True, ondelete="CASCADE")
    action_type: str = Field(index=True)  # "favourite", "spam", "to_read", "learnings"
    description: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))

    article: "NewsArticle" = Relationship(back_populates="actions")

class NewsSource(SQLModel, table=True):
    # An auto-incrementing integer ID should always be created for the database
    id: Optional[int] = Field(default=None, primary_key=True)

    # The 'id' from the API (e.g. 'the-verge') is called 'source_slug'
    # because the word 'id' is reserved for the primary key, and this can also be null
    source_slug: Optional[str] = Field(default=None, index=True)

    # The actual name of the source (e.g. 'The Verge'), this is mandatory
    name: str

    is_pinned: bool = Field(default=False)
    advanced_query: Optional[str] = None

    # [Relationship]: Indicates that this single source can contain multiple articles
    articles: List["NewsArticle"] = Relationship(back_populates="source")
    source_fetch_histories: List["SourceFetchHistory"] = Relationship(back_populates="source")

class SourceFetchHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    source_id: int = Field(foreign_key="newssource.id")
    fetch_history_id: Optional[int] = Field(default=None, foreign_key="fetchhistory.id")
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    total_fetched: int = Field(default=0)
    total_duplicates: int = Field(default=0)
    total_saved: int = Field(default=0)
    
    source: "NewsSource" = Relationship(back_populates="source_fetch_histories")
    fetch_history: Optional["FetchHistory"] = Relationship(back_populates="source_fetch_histories")


class QueryKeyword(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    keyword: str = Field(index=True)
    discription: Optional[str] = None
    is_pinned: bool = Field(default=False)
    advanced_query: Optional[str] = None
    exclude_domains: Optional[str] = None

    articles: List["NewsArticle"] = Relationship(back_populates="query_keyword")
    fetch_histories: List["FetchHistory"] = Relationship(back_populates="query_keyword")


class FetchHistory(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    query_keyword_id: Optional[int] = Field(default=None, foreign_key="querykeyword.id")
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    total_found: int = Field(default=0)
    total_fetched: int = Field(default=0)
    total_duplicates: int = Field(default=0)
    total_saved: int = Field(default=0)

    query_keyword: "QueryKeyword" = Relationship(back_populates="fetch_histories")
    articles: List["NewsArticle"] = Relationship(back_populates="fetch_history")
    source_fetch_histories: List["SourceFetchHistory"] = Relationship(back_populates="fetch_history")


class Note(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))


from sqlalchemy import Column, JSON

class UserInsight(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    trend: str
    summary: str
    supporting_ids: List[int] = Field(default=[], sa_column=Column(JSON))
    relevance_score: int = Field(default=0)
    grounding_score: int = Field(default=0)
    actionability_score: int = Field(default=0)
    eval_explanation: Optional[str] = Field(default="")
    created_at: datetime = Field(default_factory=lambda: datetime.now(ZoneInfo("Asia/Kolkata")))




