import os
from typing import List, Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.prebuilt import create_react_agent
from sqlmodel import Session, select
from .db import engine
from .model import NewsArticle, UserInsight
from .news_fetcher import fetch_store_and_return_articles
from pydantic import BaseModel, Field

SYSTEM_PROMPT = """
You are an Intelligent News Analyst Agent. Your task is to extract actionable insights based on the user's goal.

You have the following tools available:
1. `search_news(query, source_slug=None, exclude_domains=None)` – Fetches and stores articles from NewsAPI. If source_slug is provided, searches specific source. Returns list of articles with database IDs.
2. `score_article(title, description)` – Returns a spam/quality score (0-100).
3. `check_opposite_view(topic)` – Searches for contradictory news/issues (layoffs, controversy, etc.) using NewsAPI.
4. `get_article_details(article_id)` – Fetches the full content+metadata of an article from the database.
5. `save_insight(trend, summary, supporting_ids)` – Saves the final insight to the database.

You must follow these steps (ReAct pattern):
1. **Plan:** Understand the user goal (job_seeker/founder/researcher). Decide which queries to run.
2. **Act:** Call the tools and get the results.
3. **Observe:** Analyze the results. If data is incomplete, update the plan and call the tools again (max 3 iterations).
4. **Critique:** Check for contradictory evidence for each insight. Assign a confidence score (High/Medium/Low).
5. **Cite:** Provide a list of `supporting_article_ids` with each insight.
6. **Final Answer:** Return the insight in structured JSON.

Always think in a "chain of thought". Log your decisions.

Observability: Log every tool call and decision in the LangSmith trace.

**Constraints:**
- If any source has 5+ articles with a spam score > 80, add that source to the blacklist.
- If total_saved < 5 (out of 20 articles), update the advanced_query to exclude spam keywords (-spam_keywords).
- Never hallucinate. If no data is available, respond with "Insufficient data".

User's goal: {goal}
Focus topic: {topic}
Recent articles summary (past 3 days): {recent_articles_summary}
"""

@tool
def search_news(query: str, source_slug: Optional[str] = None, exclude_domains: Optional[str] = None) -> List[dict]:
    """Fetch and save articles from NewsAPI. Query is mandatory. Source_slug is optional.
    Returns list of dict with keys: id, title, description, url, source_name, published_at.
    """
    return fetch_store_and_return_articles(query, source_slug, exclude_domains)

@tool
def score_article(title: str, description: Optional[str] = None) -> int:
    """Give a score (0-100) to the article. Spam -> low score, genuine -> high score.
    """
    spam_words = ["bitcoin", "crypto", "pump", "dump", "make money", "click here", "guru", "presale", "airdrop"]
    score = 100
    title_lower = title.lower()
    desc_lower = description.lower() if description else ""
    for word in spam_words:
        if word in title_lower or word in desc_lower:
            score -= 20
    return max(0, score)

@tool
def check_opposite_view(topic: str) -> List[dict]:
    """Search for contradictory/opposing news related to the topic. Returns top opposing articles.
    """
    query = f"{topic} controversy OR layoff OR decline OR issue OR criticism"
    articles = fetch_store_and_return_articles(query)
    # Return top 5 articles
    return [{"id": a["id"], "title": a["title"], "description": a["description"]} for a in articles[:5]]

@tool
def get_article_details(article_id: int) -> dict:
    """Fetches the full data of an article from the DB by database ID.
    """
    with Session(engine) as session:
        article = session.get(NewsArticle, article_id)
        if article:
            return {
                "id": article.id,
                "title": article.title,
                "description": article.description,
                "content": article.content,
                "url": article.url,
                "published_at": article.published_at.isoformat() if article.published_at else None
            }
        return {"error": "Article not found"}

class SaveInsightInput(BaseModel):
    trend: str = Field(description="The core trend identified by the analyst.")
    summary: str = Field(description="A comprehensive summary of the trend.")
    supporting_ids: List[int] = Field(description="List of database IDs of the supporting articles.")

class JudgeEvaluation(BaseModel):
    relevance_score: int = Field(description="Relevance score from 1 to 10.")
    grounding_score: int = Field(description="Grounding/truthfulness score from 1 to 10.")
    actionability_score: int = Field(description="Actionability/usefulness score from 1 to 10.")
    explanation: str = Field(description="Brief explanation of the reasoning behind the scores.")

JUDGE_PROMPT = """
You are an expert AI Analyst Judge. Your task is to evaluate the quality of a synthesized news insight generated by an analyst agent.

Evaluate the insight based on three metrics (each on a scale of 1 to 10):
1. Relevance: Is the trend highly relevant to the focus topic?
2. Grounding: Is the trend and summary fully supported by the facts and content of the supporting articles? Avoid hallucination.
3. Actionability: Does the insight provide clear, actionable value for the target audience?

Synthesized Trend: {trend}
Summary: {summary}

Supporting Articles (Ground Truth Context):
{supporting_articles_context}

Return your rating strictly matching the requested JSON structure.
"""

@tool(args_schema=SaveInsightInput)
def save_insight(trend: str, summary: str, supporting_ids: List[int]) -> dict:
    """Save the final insight to the DB. Returns the saved object.
    """
    # 1. Fetch supporting articles from the database for Grounding check
    supporting_articles_context = ""
    with Session(engine) as session:
        if supporting_ids:
            stmt = select(NewsArticle).where(NewsArticle.id.in_(supporting_ids))
            db_articles = session.exec(stmt).all()
            context_parts = []
            for art in db_articles:
                context_parts.append(
                    f"Article [{art.id}]:\nTitle: {art.title}\nDescription: {art.description or 'No description'}\nContent: {art.content or 'No content'}\n"
                )
            supporting_articles_context = "\n".join(context_parts)

    # 2. Run LLM-as-Judge
    relevance = 0
    grounding = 0
    actionability = 0
    explanation = ""
    api_key = os.getenv("GROQ_API_KEY")

    try:
        judge_llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            groq_api_key=api_key
        ).with_structured_output(JudgeEvaluation)
        
        formatted_prompt = JUDGE_PROMPT.format(
            trend=trend,
            summary=summary,
            supporting_articles_context=supporting_articles_context or "No supporting articles found."
        )
        
        eval_result = judge_llm.invoke(formatted_prompt)
        relevance = eval_result.relevance_score
        grounding = eval_result.grounding_score
        actionability = eval_result.actionability_score
        explanation = eval_result.explanation
    except Exception as e:
        explanation = f"Judge API temporarily unavailable: {str(e)}"
        print(f"LLM-as-Judge error: {e}")

    is_alert = (relevance < 7 or grounding < 7 or actionability < 7) and not ("temporarily unavailable" in explanation)
    alert_msg = ""
    if is_alert:
        alert_msg = f"[CRITICAL ALERT] LLM-as-Judge detected low quality score (< 7)! Relevance: {relevance}/10, Grounding: {grounding}/10, Actionability: {actionability}/10. Explanation: {explanation}"

    with Session(engine) as session:
        insight = UserInsight(
            trend=trend,
            summary=summary,
            supporting_ids=supporting_ids,
            relevance_score=relevance,
            grounding_score=grounding,
            actionability_score=actionability,
            eval_explanation=explanation
        )
        session.add(insight)
        session.commit()
        session.refresh(insight)
        
        return {
            "status": "success",
            "id": insight.id,
            "trend": insight.trend,
            "summary": insight.summary,
            "supporting_ids": insight.supporting_ids,
            "relevance_score": relevance,
            "grounding_score": grounding,
            "actionability_score": actionability,
            "eval_explanation": explanation,
            "alert": alert_msg or None,
            "created_at": insight.created_at.isoformat()
        }

# To prevent Vercel import/build time crash if GROQ_API_KEY is not set
if not os.getenv("GROQ_API_KEY"):
    os.environ["GROQ_API_KEY"] = "dummy_key"

tools = [search_news, score_article, check_opposite_view, get_article_details, save_insight]

def get_agent_graph(goal: str, topic: str, recent_articles_summary: str):
    formatted_prompt = SYSTEM_PROMPT.format(
        goal=goal,
        topic=topic,
        recent_articles_summary=recent_articles_summary
    )
    
    # Initialize Groq LLM lazily on execution
    api_key = os.getenv("GROQ_API_KEY")
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        groq_api_key=api_key
    )
    llm_with_tools = llm.bind_tools(tools)
    
    return create_react_agent(
        model=llm_with_tools,
        tools=tools,
        state_modifier=formatted_prompt
    )
