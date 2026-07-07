from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select, func, col
from ..db import get_session
from ..model import ArticleAction, NewsArticle, NewsSource, QueryKeyword
from ..schemas import (
    ArticleActionCreate,
    ArticleActionResponse,
    ArticleActionListResponse,
    ArticleActionWithArticle,
    ArticleActionsForArticle,
    NewsArticleResponse,
)

router = APIRouter(
    prefix="/actions",
    tags=["Article Actions"],
)

ALLOWED_ACTIONS = {"favourite", "spam", "to_read", "learnings"}


@router.post("/{article_id}", response_model=ArticleActionResponse)
def create_action(
    article_id: int,
    body: ArticleActionCreate,
    session: Session = Depends(get_session),
):
    if body.action_type not in ALLOWED_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid action_type. Allowed: {', '.join(ALLOWED_ACTIONS)}",
        )

    # Check article exists
    article = session.get(NewsArticle, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    # Check if same action already exists (toggle-safe)
    existing = session.exec(
        select(ArticleAction).where(
            ArticleAction.article_id == article_id,
            ArticleAction.action_type == body.action_type,
        )
    ).first()

    if existing:
        # Update description if re-submitting
        existing.description = body.description
        session.add(existing)
        session.commit()
        session.refresh(existing)
        return existing

    action = ArticleAction(
        article_id=article_id,
        action_type=body.action_type,
        description=body.description,
    )
    session.add(action)
    session.commit()
    session.refresh(action)
    return action


@router.delete("/{article_id}/{action_type}")
def remove_action(
    article_id: int,
    action_type: str,
    session: Session = Depends(get_session),
):
    action = session.exec(
        select(ArticleAction).where(
            ArticleAction.article_id == article_id,
            ArticleAction.action_type == action_type,
        )
    ).first()

    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    session.delete(action)
    session.commit()
    return {"message": f"Action '{action_type}' removed from article {article_id}"}


@router.get("/", response_model=ArticleActionListResponse)
def get_actions_by_type(
    type: str,
    skip: int = 0,
    limit: int = 21,
    session: Session = Depends(get_session),
):
    """Get all articles with a specific action type (paginated)."""
    if type not in ALLOWED_ACTIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type. Allowed: {', '.join(ALLOWED_ACTIONS)}",
        )

    # Count total
    count_stmt = select(func.count(ArticleAction.id)).where(
        ArticleAction.action_type == type
    )
    total = session.exec(count_stmt).one()

    # Fetch actions with article + source info
    stmt = (
        select(ArticleAction, NewsArticle, NewsSource)
        .join(NewsArticle, ArticleAction.article_id == NewsArticle.id)
        .join(NewsSource, NewsArticle.source_id == NewsSource.id)
        .where(ArticleAction.action_type == type)
        .order_by(col(ArticleAction.created_at).desc())
        .offset(skip)
        .limit(limit)
    )
    results = session.exec(stmt).all()

    actions_out = []
    for action, article, source in results:
        # Get keyword name if available
        keyword_name = None
        if article.query_keyword_id:
            kw = session.get(QueryKeyword, article.query_keyword_id)
            if kw:
                keyword_name = kw.keyword

        article_resp = NewsArticleResponse(
            id=article.id,
            title=article.title,
            description=article.description,
            url=article.url,
            url_to_image=article.url_to_image,
            published_at=article.published_at,
            content=article.content,
            source_name=source.name,
            keyword=keyword_name,
        )
        actions_out.append(
            ArticleActionWithArticle(
                id=action.id,
                article_id=action.article_id,
                action_type=action.action_type,
                description=action.description,
                created_at=action.created_at,
                article=article_resp,
            )
        )

    return ArticleActionListResponse(
        total=total,
        page=(skip // limit) + 1,
        limit=limit,
        actions=actions_out,
    )


@router.get("/article/{article_id}", response_model=ArticleActionsForArticle)
def get_actions_for_article(
    article_id: int,
    session: Session = Depends(get_session),
):
    """Get all actions for a specific article."""
    article = session.get(NewsArticle, article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    actions = session.exec(
        select(ArticleAction).where(ArticleAction.article_id == article_id)
    ).all()

    return ArticleActionsForArticle(
        article_id=article_id,
        actions=[ArticleActionResponse.model_validate(a) for a in actions],
    )
