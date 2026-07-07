from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from ..db import get_session
from ..model import NewsSource, NewsArticle, ArticleAction, SourceFetchHistory
from ..schemas import (
    SourceListResponse, 
    SourceResponse,
    NewsListResponse,
    NewsArticleResponse,
    NewsArticleResponse,
    NewsQueryParams,
    SourceHistoryListResponse,
    SourceFetchHistoryResponse,
    SourceCreateRequest,
    SourceUpdateRequest
)

router = APIRouter(
    prefix="/sources",
    tags=["Sources"]
)

@router.post("/", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
def create_source(request: SourceCreateRequest, session: Session = Depends(get_session)):
    stmt = select(NewsSource).where(NewsSource.source_slug == request.source_slug, NewsSource.name == request.name)
    existing = session.exec(stmt).first()
    if existing:
        return SourceResponse.model_validate(existing)
        
    source = NewsSource(name=request.name, source_slug=request.source_slug)
    session.add(source)
    session.commit()
    session.refresh(source)
    return SourceResponse.model_validate(source)

@router.patch("/{id}", response_model=SourceResponse)
def update_source(id: int, request: SourceUpdateRequest, session: Session = Depends(get_session)):
    source = session.get(NewsSource, id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
        
    if request.name is not None:
        source.name = request.name
    if request.source_slug is not None:
        source.source_slug = request.source_slug
    if request.is_pinned is not None:
        source.is_pinned = request.is_pinned
    if request.advanced_query is not None:
        source.advanced_query = request.advanced_query if request.advanced_query else None
        
    session.add(source)
    session.commit()
    session.refresh(source)
    return SourceResponse.model_validate(source)


@router.get("/", response_model=SourceListResponse)
def get_sources(session: Session = Depends(get_session)):
    count_stmt = select(func.count(NewsSource.id))
    total_count = session.exec(count_stmt).one()
    
    statement = select(NewsSource).order_by(NewsSource.is_pinned.desc(), NewsSource.id.desc())
    results = session.exec(statement).all()
    
    return SourceListResponse(
        total=total_count,
        sources=[SourceResponse.model_validate(src) for src in results]
    )

@router.get("/{id}/articles", response_model=NewsListResponse)
def get_source_articles(
    id: int,
    params: NewsQueryParams = Depends(),
    session: Session = Depends(get_session)
):
    source = session.get(NewsSource, id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
        
    skip = params.skip
    limit = params.limit
    
    count_stmt = select(func.count(NewsArticle.id)).where(NewsArticle.source_id == id)
    total_count = session.exec(count_stmt).one()
    
    statement = select(NewsArticle, NewsSource).join(NewsSource).where(NewsArticle.source_id == id)
    statement = statement.offset(skip).limit(limit).order_by(NewsArticle.published_at.desc())
    results = session.exec(statement).all()
    
    response_articles = []
    for article, src in results:
        article_dict = article.model_dump()
        article_dict["source_name"] = src.name
        response_articles.append(article_dict)
        
    return NewsListResponse(
        total=total_count,
        page=(skip // limit) + 1,
        limit=limit,
        articles=response_articles
    )

@router.get("/{id}", response_model=SourceResponse)
def get_source(id: int, session: Session = Depends(get_session)):
    source = session.get(NewsSource, id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
    return SourceResponse.model_validate(source)

@router.get("/{id}/history", response_model=SourceHistoryListResponse)
def get_source_history(id: int, session: Session = Depends(get_session)):
    source = session.get(NewsSource, id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
        
    count_stmt = select(func.count(SourceFetchHistory.id)).where(SourceFetchHistory.source_id == id)
    total_count = session.exec(count_stmt).one()
    
    statement = select(SourceFetchHistory).where(SourceFetchHistory.source_id == id).order_by(SourceFetchHistory.id.desc())
    results = session.exec(statement).all()
    
    return SourceHistoryListResponse(
        total=total_count,
        histories=[SourceFetchHistoryResponse.model_validate(h) for h in results]
    )

@router.get("/{id}/history/{history_id}/articles", response_model=NewsListResponse)
def get_source_history_articles(
    id: int,
    history_id: int,
    params: NewsQueryParams = Depends(),
    session: Session = Depends(get_session)
):
    history = session.get(SourceFetchHistory, history_id)
    if not history or history.source_id != id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History not found")
        
    skip = params.skip
    limit = params.limit
    
    # We want articles that have this source's fetch_history_id
    # Wait, the history parameter here is a SourceFetchHistory.
    # SourceFetchHistory links a NewsSource to a FetchHistory (the main fetch run).
    # So we need to filter NewsArticle by BOTH fetch_history_id AND source_id.
    
    count_stmt = select(func.count(NewsArticle.id)).where(
        NewsArticle.fetch_history_id == history.fetch_history_id,
        NewsArticle.source_id == id
    )
    total_count = session.exec(count_stmt).one()
    
    statement = select(NewsArticle, NewsSource).join(NewsSource).where(
        NewsArticle.fetch_history_id == history.fetch_history_id,
        NewsArticle.source_id == id
    ).offset(skip).limit(limit).order_by(NewsArticle.published_at.desc())
    
    results = session.exec(statement).all()
    
    response_articles = []
    for article, src in results:
        article_dict = article.model_dump()
        article_dict["source_name"] = src.name
        response_articles.append(article_dict)
        
    return NewsListResponse(
        total=total_count,
        page=(skip // limit) + 1,
        limit=limit,
        articles=response_articles
    )

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_source(id: int, session: Session = Depends(get_session)):
    source = session.get(NewsSource, id)
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source not found")
        
    # 1. Fetch and delete articles associated with this source
    articles = session.exec(select(NewsArticle).where(NewsArticle.source_id == id)).all()
    for article in articles:
        # Delete actions for each article first
        actions = session.exec(select(ArticleAction).where(ArticleAction.article_id == article.id)).all()
        for action in actions:
            session.delete(action)
        session.delete(article)
        
    # 2. Fetch and delete SourceFetchHistory records associated with this source
    src_histories = session.exec(select(SourceFetchHistory).where(SourceFetchHistory.source_id == id)).all()
    for src_hist in src_histories:
        session.delete(src_hist)
        
    # 3. Delete the NewsSource itself
    session.delete(source)
    session.commit()
    
    return {"message": f"Source '{source.name}' and all its associated articles/histories deleted successfully."}
