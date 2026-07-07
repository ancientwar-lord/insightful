from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlmodel import Session, select, func, col
from datetime import datetime, timedelta
from ..db import get_session
from ..model import NewsArticle, NewsSource, QueryKeyword, ArticleAction
from ..schemas import NewsListResponse, NewsQueryParams, NewsUpdateRequest, NewsArticleResponse
from ..news_fetcher import fetch_and_store_news

# 1. Create router with prefix and tags
router = APIRouter(
    prefix="/news",          
    tags=["News"]            
)

# 2. GET endpoint (previously "/news", now it remains "/news")
@router.get("/", response_model=NewsListResponse)  # <--  base path
def get_news(
    params: NewsQueryParams = Depends(),
    session: Session = Depends(get_session)
) -> NewsListResponse:
    skip = params.skip
    limit = params.limit
    source = params.source

    # Parse filter params
    keyword_id_list: list[int] = []
    source_id_list: list[int] = []

    if params.keyword_ids:
        try:
            keyword_id_list = [int(x.strip()) for x in params.keyword_ids.split(",") if x.strip()]
        except ValueError:
            pass

    if params.source_ids:
        try:
            source_id_list = [int(x.strip()) for x in params.source_ids.split(",") if x.strip()]
        except ValueError:
            pass

    # Legacy source name filter
    source_id = None
    if source:
        src_obj = session.exec(select(NewsSource).where(NewsSource.name == source)).first()
        if not src_obj:
            return NewsListResponse(total=0, page=1, limit=limit, articles=[])
        source_id = src_obj.id

    # Build count query
    count_stmt = select(func.count(NewsArticle.id))
    if source_id:
        count_stmt = count_stmt.where(NewsArticle.source_id == source_id)
    if source_id_list:
        count_stmt = count_stmt.where(col(NewsArticle.source_id).in_(source_id_list))
    if keyword_id_list:
        count_stmt = count_stmt.where(col(NewsArticle.query_keyword_id).in_(keyword_id_list))
    if params.search:
        count_stmt = count_stmt.where(col(NewsArticle.title).ilike(f"%{params.search}%"))
    if params.date:
        day_start = datetime.combine(params.date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        count_stmt = count_stmt.where(
            NewsArticle.published_at >= day_start,
            NewsArticle.published_at < day_end,
        )

    total_count = session.exec(count_stmt).one()

    # Build main query
    statement = select(NewsArticle, NewsSource).join(NewsSource)
    if source_id:
        statement = statement.where(NewsArticle.source_id == source_id)
    if source_id_list:
        statement = statement.where(col(NewsArticle.source_id).in_(source_id_list))
    if keyword_id_list:
        statement = statement.where(col(NewsArticle.query_keyword_id).in_(keyword_id_list))
    if params.search:
        statement = statement.where(col(NewsArticle.title).ilike(f"%{params.search}%"))
    if params.date:
        day_start = datetime.combine(params.date, datetime.min.time())
        day_end = day_start + timedelta(days=1)
        statement = statement.where(
            NewsArticle.published_at >= day_start,
            NewsArticle.published_at < day_end,
        )

    statement = statement.offset(skip).limit(limit).order_by(NewsArticle.published_at.desc())
    results = session.exec(statement).all()

    response_articles = []
    for article, src in results:
        article_dict = article.model_dump()
        article_dict["source_name"] = src.name
        # Add keyword name if available
        keyword_name = None
        if article.query_keyword_id:
            kw = session.get(QueryKeyword, article.query_keyword_id)
            if kw:
                keyword_name = kw.keyword
        article_dict["keyword"] = keyword_name
        response_articles.append(article_dict)

    return NewsListResponse(
        total=total_count,
        page=(skip // limit) + 1,
        limit=limit,
        articles=response_articles
    )

# 3. POST endpoint (previously "/news/refresh")
@router.post("/refresh")  # <-- "/refresh" will become "/news/refresh" with the base path
def update_news(
    request: NewsUpdateRequest,
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(fetch_and_store_news, request.query, request.source_slug)
    msg = f"News refresh process started for query '{request.query}'"
    if request.source_slug:
        msg = f"News refresh process started for source '{request.source_slug}'"
    
    return {
        "message": f"{msg} in background.",
        "status": "processing"
    }

@router.delete("/bulk")
def bulk_delete_news(
    keyword_ids: str | None = None,
    source_ids: str | None = None,
    search: str | None = None,
    keyword_id: int | None = None,
    source_id: int | None = None,
    session: Session = Depends(get_session)
):
    if not keyword_ids and not source_ids and not search and not keyword_id and not source_id:
        raise HTTPException(status_code=400, detail="Must provide keyword_ids, source_ids, search, keyword_id, or source_id")
        
    stmt = select(NewsArticle)
    has_filter = False
    
    # Handle list-based filters
    if keyword_ids:
        try:
            kw_list = [int(x.strip()) for x in keyword_ids.split(",") if x.strip()]
            if kw_list:
                stmt = stmt.where(col(NewsArticle.query_keyword_id).in_(kw_list))
                has_filter = True
        except ValueError:
            pass
    elif keyword_id:
        stmt = stmt.where(NewsArticle.query_keyword_id == keyword_id)
        has_filter = True
        
    if source_ids:
        try:
            src_list = [int(x.strip()) for x in source_ids.split(",") if x.strip()]
            if src_list:
                stmt = stmt.where(col(NewsArticle.source_id).in_(src_list))
                has_filter = True
        except ValueError:
            pass
    elif source_id:
        stmt = stmt.where(NewsArticle.source_id == source_id)
        has_filter = True
        
    if search:
        stmt = stmt.where(col(NewsArticle.title).ilike(f"%{search}%"))
        has_filter = True
        
    if not has_filter:
        raise HTTPException(status_code=400, detail="Must provide at least one valid filter for bulk delete")
        
    articles = session.exec(stmt).all()
    count = 0
    for article in articles:
        # Delete actions
        actions = session.exec(select(ArticleAction).where(ArticleAction.article_id == article.id)).all()
        for action in actions:
            session.delete(action)
        session.delete(article)
        count += 1
        
    session.commit()
    return {"message": f"Successfully deleted {count} articles."}

# 4. DELETE endpoint — direct delete article from DB
@router.delete("/{article_id}")
def delete_article(
    article_id: int,
    session: Session = Depends(get_session),
):
    article = session.get(NewsArticle, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    
    # Delete associated actions first (cascade should handle, but being explicit)
    actions = session.exec(
        select(ArticleAction).where(ArticleAction.article_id == article_id)
    ).all()
    for action in actions:
        session.delete(action)
    
    session.delete(article)
    session.commit()
    return {"message": f"Article {article_id} deleted permanently"}