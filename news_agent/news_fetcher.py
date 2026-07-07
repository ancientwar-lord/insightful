from datetime import datetime, timezone
from sqlmodel import Session, select
from .db import engine
from .model import NewsArticle, NewsSource, QueryKeyword, FetchHistory
import requests
from fastapi import HTTPException, status
from .config import settings

def fetch_news(query: str = None, source_slug: str = None, exclude_domains: str = None):

    api_key = settings.NEWS_API_KEY
    if not api_key:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="NEWS_API_KEY is missing from the .env file")

    try:
        url = "https://newsapi.org/v2/everything"
        params = {}
        if source_slug:
            if "." in source_slug:
                params["domains"] = source_slug
            else:
                params["sources"] = source_slug
            if query:
                params["q"] = query
        else:
            params["q"] = query or "ai"

        if exclude_domains:
            params["excludeDomains"] = exclude_domains

        params["pageSize"] = 100
        params["language"] = "en"
        params["sortBy"] = "publishedAt"
        headers = {"X-Api-Key": api_key}
        response = requests.get(url, params=params, headers=headers, timeout=10)

        if response.status_code == 401:
            raise HTTPException(status_code = status.HTTP_401_UNAUTHORIZED, detail="The provided NEWS_API_KEY is incorrect or expired.")


        if response.status_code == 429:
            raise HTTPException(status_code = status.HTTP_429_TOO_MANY_REQUESTS, detail="Rate limit exceeded. Please try again after some time.")


        return response.json()

    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code = status.HTTP_503_SERVICE_UNAVAILABLE, detail = "Network connection filed. Please check your internet connection")

    except requests.exceptions.Timeout:
        raise HTTPException(status_code = status.HTTP_504_GATEWAY_TIMEOUT, detail = "The request to the NewsAPI timed out. Server took too long to respond.")    

    except requests.exceptions.RequestException as e:
        raise HTTPException(status_code = status.HTTP_500_INTERNAL_SERVER_ERROR, detail = f"An underlying error occurred: {str(e)}")    



def fetch_and_store_news(query: str = "ai", source_slug: str = None):
    # Determine the query and exclude domains by looking up DB first
    effective_query = query
    exclude_domains = "pypi.org, gizmodo.com"

    with Session(engine) as session:
        query_keyword = None
        requested_source = None

        if source_slug:
            stmt_req = select(NewsSource).where(NewsSource.source_slug == source_slug)
            requested_source = session.exec(stmt_req).first()
            if requested_source and requested_source.advanced_query:
                effective_query = requested_source.advanced_query
            else:
                effective_query = None  # Don't use default query for sources unless specified
        else:
            stmt = select(QueryKeyword).where(QueryKeyword.keyword == query)
            query_keyword = session.exec(stmt).first()
            if query_keyword:
                if query_keyword.exclude_domains:
                    exclude_domains = f"{exclude_domains}, {query_keyword.exclude_domains}"
                if query_keyword.advanced_query:
                    effective_query = f"{query} {query_keyword.advanced_query}"
            else:
                query_keyword = QueryKeyword(keyword=query, discription=None)
                session.add(query_keyword)
                session.flush()

        # 1. Fetch raw data
        try:
            raw_data = fetch_news(effective_query, source_slug, exclude_domains)
        except Exception as e:
            print(f"Error fetching news in background task: {e}")
            return

        articles_json = raw_data.get("articles", [])

        # 2. Setup counters and stats
        total_found = raw_data.get("totalResults", len(articles_json))
        total_fetched = len(articles_json)
        total_saved = 0
        total_duplicates = 0
        source_stats = {} # Track source updates {source_id: {"fetched": 0, "duplicates": 0, "saved": 0}}

        # Create FetchHistory first to get its ID
        fetch_history = FetchHistory(
            query_keyword_id=query_keyword.id if query_keyword else None,
            total_found=total_found,
            total_fetched=total_fetched,
            total_duplicates=0,
            total_saved=0
        )
        session.add(fetch_history)
        session.flush() # assign id to fetch_history

        from .model import SourceFetchHistory  # Avoid circular imports just in case

        # Batch check existing URLs
        all_urls = [item.get("url") for item in articles_json if item.get("url")]
        existing_urls = set()
        if all_urls:
            # Query all existing URLs in one go to prevent N+1 queries and autoflush issues
            stmt = select(NewsArticle.url).where(NewsArticle.url.in_(all_urls))
            existing_urls = set(session.exec(stmt).all())

        for item in articles_json:
            source_data = item.get("source", {})
            item_source_slug = source_data.get("id")        # e.g., "the-verge"
            item_source_name = source_data.get("name")      # e.g., "The Verge"
            
            # If source id is null, use the source name as its id
            if not item_source_slug and item_source_name:
                item_source_slug = item_source_name

            if requested_source:
                source = requested_source
                article_author = item.get("author")
                if item_source_name:
                    if article_author:
                        article_author = f"{item_source_name} | {article_author}"
                    else:
                        article_author = item_source_name
            else:
                article_author = item.get("author")
                # 2a. Find or create source
                stmt = select(NewsSource).where(NewsSource.source_slug == item_source_slug)
                source = session.exec(stmt).first()
                if not source and item_source_name:
                    stmt = select(NewsSource).where(NewsSource.name == item_source_name)
                    source = session.exec(stmt).first()
                if not source:
                    source = NewsSource(source_slug=item_source_slug, name=item_source_name)
                    session.add(source)
                    session.flush()

            if source.id not in source_stats:
                source_stats[source.id] = {"fetched": 0, "duplicates": 0, "saved": 0}
            source_stats[source.id]["fetched"] += 1

            # 2b. Check article (duplicate URL)
            article_url = item.get("url")
            title = item.get("title")
            description = item.get("description")
            
            # If title is missing, use the first 10 words of the description
            if not title and description:
                words = description.split()
                title = " ".join(words[:10]) + ("..." if len(words) > 10 else "")
            
            # Skip invalid or removed articles
            if not article_url or not title or title == "[Removed]":
                continue

            if article_url in existing_urls:
                total_duplicates += 1
                source_stats[source.id]["duplicates"] += 1
                continue

            existing_urls.add(article_url)

            # 2c. Parse published_at (ISO format)
            from zoneinfo import ZoneInfo
            pub_str = item.get("publishedAt")
            published_at = datetime.fromisoformat(pub_str.replace("Z", "+00:00")) if pub_str else datetime.now(ZoneInfo("Asia/Kolkata"))

            article = NewsArticle(
                source_id=source.id,
                query_keyword_id=query_keyword.id if query_keyword else None,
                fetch_history_id=fetch_history.id,
                author=article_author,
                title=title,
                description=item.get("description"),
                url=article_url,
                url_to_image=item.get("urlToImage"),
                published_at=published_at,
                content=item.get("content"),
            )
            session.add(article)
            total_saved += 1
            source_stats[source.id]["saved"] += 1

        fetch_history.total_saved = total_saved
        fetch_history.total_duplicates = total_duplicates
        session.add(fetch_history)
        
        # Track history per source
        for src_id, stats in source_stats.items():
            src_history = SourceFetchHistory(
                source_id=src_id,
                fetch_history_id=fetch_history.id,
                total_fetched=stats["fetched"],
                total_duplicates=stats["duplicates"],
                total_saved=stats["saved"]
            )
            session.add(src_history)

        session.commit()
    return {"status": "stored", "total_found": total_found, "total_saved": total_saved}


def fetch_store_and_return_articles(query: str, source_slug: str = None, exclude_domains: str = None) -> list[dict]:
    effective_query = query
    default_exclude = "pypi.org, gizmodo.com"
    if exclude_domains:
        effective_exclude = f"{default_exclude}, {exclude_domains}"
    else:
        effective_exclude = default_exclude

    try:
        raw_data = fetch_news(effective_query, source_slug, effective_exclude)
    except Exception as e:
        print(f"Error in fetch_news: {e}")
        raw_data = {"articles": []}

    articles_json = raw_data.get("articles", [])
    result_list = []

    with Session(engine) as session:
        # Find or create keyword
        if query:
            stmt = select(QueryKeyword).where(QueryKeyword.keyword == query)
            query_keyword = session.exec(stmt).first()
            if not query_keyword:
                query_keyword = QueryKeyword(keyword=query)
                session.add(query_keyword)
                session.flush()
        else:
            query_keyword = None

        # Batch check existing URLs
        all_urls = [item.get("url") for item in articles_json if item.get("url")]
        existing_articles = {}
        if all_urls:
            stmt = select(NewsArticle).where(NewsArticle.url.in_(all_urls))
            existing_articles = {art.url: art for art in session.exec(stmt).all()}

        for item in articles_json:
            article_url = item.get("url")
            title = item.get("title")
            description = item.get("description")

            if not title and description:
                words = description.split()
                title = " ".join(words[:10]) + ("..." if len(words) > 10 else "")

            if not article_url or not title or title == "[Removed]":
                continue

            # Find or create source
            source_data = item.get("source", {})
            item_source_slug = source_data.get("id") or source_data.get("name") or "Unknown"
            item_source_name = source_data.get("name") or "Unknown"

            stmt = select(NewsSource).where(NewsSource.source_slug == item_source_slug)
            source = session.exec(stmt).first()
            if not source:
                source = NewsSource(source_slug=item_source_slug, name=item_source_name)
                session.add(source)
                session.flush()

            article_id = None
            if article_url in existing_articles:
                article_id = existing_articles[article_url].id
            else:
                pub_str = item.get("publishedAt")
                from zoneinfo import ZoneInfo
                published_at = datetime.fromisoformat(pub_str.replace("Z", "+00:00")) if pub_str else datetime.now(ZoneInfo("Asia/Kolkata"))

                article = NewsArticle(
                    source_id=source.id,
                    query_keyword_id=query_keyword.id if query_keyword else None,
                    author=item.get("author"),
                    title=title,
                    description=description,
                    url=article_url,
                    url_to_image=item.get("urlToImage"),
                    published_at=published_at,
                    content=item.get("content"),
                )
                session.add(article)
                session.flush()
                article_id = article.id

            result_list.append({
                "id": article_id,
                "title": title,
                "description": description,
                "url": article_url,
                "source_name": source.name,
                "published_at": item.get("publishedAt")
            })
        session.commit()
    return result_list




