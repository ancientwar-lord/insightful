from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, func
from ..db import get_session
from ..model import QueryKeyword, FetchHistory, NewsArticle, NewsSource, ArticleAction, SourceFetchHistory
from ..schemas import (
    KeywordListResponse, 
    KeywordResponse,
    HistoryListResponse,
    FetchHistoryResponse,
    NewsListResponse,
    NewsArticleResponse,
    NewsQueryParams,
    KeywordUpdateRequest
)

router = APIRouter(
    prefix="/keywords",
    tags=["Keywords"]
)

@router.get("/", response_model=KeywordListResponse)
def get_keywords(session: Session = Depends(get_session)):
    count_stmt = select(func.count(QueryKeyword.id))
    total_count = session.exec(count_stmt).one()
    
    statement = select(QueryKeyword).order_by(QueryKeyword.is_pinned.desc(), QueryKeyword.id.desc())
    results = session.exec(statement).all()
    
    return KeywordListResponse(
        total=total_count,
        keywords=[KeywordResponse.model_validate(kw) for kw in results]
    )

@router.get("/{id}", response_model=KeywordResponse)
def get_keyword(id: int, session: Session = Depends(get_session)):
    keyword = session.get(QueryKeyword, id)
    if not keyword:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found")
    return KeywordResponse.model_validate(keyword)

@router.patch("/{id}", response_model=KeywordResponse)
def update_keyword(id: int, request: KeywordUpdateRequest, session: Session = Depends(get_session)):
    keyword = session.get(QueryKeyword, id)
    if not keyword:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found")
        
    if request.keyword is not None:
        keyword.keyword = request.keyword
    if request.discription is not None:
        keyword.discription = request.discription
    if request.is_pinned is not None:
        keyword.is_pinned = request.is_pinned
    if request.advanced_query is not None:
        keyword.advanced_query = request.advanced_query if request.advanced_query else None
    if request.exclude_domains is not None:
        keyword.exclude_domains = request.exclude_domains if request.exclude_domains else None
        
    session.add(keyword)
    session.commit()
    session.refresh(keyword)
    return KeywordResponse.model_validate(keyword)

@router.get("/{id}/history", response_model=HistoryListResponse)
def get_keyword_history(id: int, session: Session = Depends(get_session)):
    keyword = session.get(QueryKeyword, id)
    if not keyword:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found")
        
    count_stmt = select(func.count(FetchHistory.id)).where(FetchHistory.query_keyword_id == id)
    total_count = session.exec(count_stmt).one()
    
    statement = select(FetchHistory).where(FetchHistory.query_keyword_id == id).order_by(FetchHistory.id.desc())
    results = session.exec(statement).all()
    
    return HistoryListResponse(
        total=total_count,
        histories=[FetchHistoryResponse.model_validate(hist) for hist in results]
    )

@router.get("/{id}/articles", response_model=NewsListResponse)
def get_keyword_articles(
    id: int,
    params: NewsQueryParams = Depends(),
    session: Session = Depends(get_session)
):
    keyword = session.get(QueryKeyword, id)
    if not keyword:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found")
        
    skip = params.skip
    limit = params.limit
    
    count_stmt = select(func.count(NewsArticle.id)).where(NewsArticle.query_keyword_id == id)
    total_count = session.exec(count_stmt).one()
    
    statement = select(NewsArticle, NewsSource).join(NewsSource).where(NewsArticle.query_keyword_id == id)
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

@router.get("/{id}/history/{history_id}/articles", response_model=NewsListResponse)
def get_history_articles(
    id: int,
    history_id: int,
    params: NewsQueryParams = Depends(),
    session: Session = Depends(get_session)
):
    history = session.get(FetchHistory, history_id)
    if not history or history.query_keyword_id != id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="History not found")
        
    skip = params.skip
    limit = params.limit
    
    count_stmt = select(func.count(NewsArticle.id)).where(NewsArticle.fetch_history_id == history_id)
    total_count = session.exec(count_stmt).one()
    
    statement = select(NewsArticle, NewsSource).join(NewsSource).where(NewsArticle.fetch_history_id == history_id)
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

@router.delete("/{id}", status_code=status.HTTP_200_OK)
def delete_keyword(id: int, session: Session = Depends(get_session)):
    keyword = session.get(QueryKeyword, id)
    if not keyword:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Keyword not found")
        
    # 1. Fetch and delete articles associated with this keyword
    articles = session.exec(select(NewsArticle).where(NewsArticle.query_keyword_id == id)).all()
    for article in articles:
        # Delete actions for each article first
        actions = session.exec(select(ArticleAction).where(ArticleAction.article_id == article.id)).all()
        for action in actions:
            session.delete(action)
        session.delete(article)
        
    # 2. Fetch and delete FetchHistory records associated with this keyword
    histories = session.exec(select(FetchHistory).where(FetchHistory.query_keyword_id == id)).all()
    for history in histories:
        # Delete related SourceFetchHistory records first
        src_histories = session.exec(select(SourceFetchHistory).where(SourceFetchHistory.fetch_history_id == history.id)).all()
        for src_hist in src_histories:
            session.delete(src_hist)
        session.delete(history)
        
    # 3. Delete the QueryKeyword itself
    session.delete(keyword)
    session.commit()
    
    return {"message": f"Keyword '{keyword.keyword}' and all its associated articles/histories deleted successfully."}
