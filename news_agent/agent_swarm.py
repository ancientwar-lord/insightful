import os
import json
from typing import List, Optional, Annotated, TypedDict
from datetime import datetime
from zoneinfo import ZoneInfo
from pydantic import BaseModel, Field
from sqlmodel import Session, select

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.tools import tool
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode
from duckduckgo_search import DDGS
from newspaper import Article

from .db import engine
from .model import NewsArticle, UserInsight
from .news_fetcher import fetch_store_and_return_articles
from .config import settings

# ----------------------------------------------------
# 1. State Definition
# ----------------------------------------------------

class AgentState(TypedDict):
    messages: List[dict]  # Message format: {"role": "user"/"assistant", "content": "..."}
    goal_type: str
    topic: str
    recent_articles_summary: str
    # Draft outputs
    draft_trend: Optional[str]
    draft_summary: Optional[str]
    supporting_ids: List[int]
    # Scores
    relevance_score: int
    grounding_score: int
    actionability_score: int
    eval_explanation: Optional[str]
    # Approvals
    approved: bool
    rejected: bool

# ----------------------------------------------------
# 2. Advanced Tools
# ----------------------------------------------------

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
    """Search for topic parameters (controversy, layoff, decline, issue, criticism) using DuckDuckGo Search.
    Returns list of dicts with: title, body, href.
    """
    query = f"{topic} controversy OR layoff OR decline OR issue OR criticism"
    results = []
    try:
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=5):
                results.append({
                    "title": r.get("title", ""),
                    "body": r.get("body", ""),
                    "href": r.get("href", "")
                })
    except Exception as e:
        print(f"Error searching DuckDuckGo for opposite views: {e}")
    return results

@tool
def fetch_article_full_text(url: str) -> str:
    """Fetches and extracts full text content of a news article from the given URL.
    Use this to verify facts and gather detailed context for writing and judging insights.
    """
    try:
        article = Article(url)
        article.download()
        article.parse()
        return article.text if article.text else "Failed to parse text content from article."
    except Exception as e:
        return f"Error fetching article full text: {str(e)}"

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

# ----------------------------------------------------
# 3. LLM Structures & Prompts
# ----------------------------------------------------

class WriterOutput(BaseModel):
    trend: str = Field(description="The core trend identified by the analyst.")
    summary: str = Field(description="A comprehensive summary of the trend.")
    supporting_ids: List[int] = Field(description="List of database IDs of the supporting articles that back this trend.")

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

# ----------------------------------------------------
# 4. Agent Swarm Nodes
# ----------------------------------------------------

def researcher_node(state: AgentState):
    """Researcher Agent: Searches for related articles from NewsAPI,
    checks spam scores, and returns results.
    """
    goal = state.get("goal_type")
    topic = state.get("topic")
    recent_summary = state.get("recent_articles_summary")
    messages = state.get("messages", [])

    prompt = f"""You are a Researcher Agent. Your main task is to search and filter news articles related to the target topic "{topic}".
    Goal audience: {goal}
    Summary of news from the past 3 days:
    {recent_summary}

    How to perform the task:
    1. Use search tools (like `search_news`) to fetch additional recent and relevant articles.
    2. Check the title/description of each article and identify its spam score. Collect genuine, high-quality articles.
    3. Explain your final research results in a structured way in the message content. Cite the database IDs of the articles you found.
    """

    api_key = os.getenv("GROQ_API_KEY")
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        groq_api_key=api_key
    )

    # Let the researcher run with access to search tools
    tools = [search_news, score_article]
    llm_with_tools = llm.bind_tools(tools)

    # Simple execution loop to handle tools dynamically
    # Constructing a conversation template
    current_messages = [
        {"role": "system", "content": prompt}
    ]
    for msg in messages:
        current_messages.append({"role": msg["role"], "content": msg["content"]})
        
    # We call the model
    response = llm_with_tools.invoke([
        (msg["role"], msg["content"]) for msg in current_messages
    ])
    
    new_messages = list(messages)
    new_messages.append({"role": "assistant", "content": response.content})

    # If tool calls are present, execute them and feed back to the LLM
    if response.tool_calls:
        tool_node = ToolNode(tools)
        # Convert tool call to LangChain format for ToolNode
        tool_results = tool_node.invoke({"messages": [response]})
        for tool_msg in tool_results["messages"]:
            new_messages.append({"role": "tool", "content": str(tool_msg.content), "name": tool_msg.name})
            
        # Call model again with tool responses
        second_response = llm.invoke([
            (msg["role"], msg["content"]) for msg in new_messages
        ])
        new_messages.append({"role": "assistant", "content": second_response.content})

    return {"messages": new_messages}


def critic_node(state: AgentState):
    """Critic Agent: Uses DuckDuckGo Search to check for controversies, opposite viewpoints,
    and risks.
    """
    topic = state.get("topic")
    messages = state.get("messages", [])

    prompt = f"""You are a Critic Agent. Your task in the context of the user topic "{topic}" is to:
    1. Search for negative points, criticisms, failures, or opposing viewpoints.
    2. Use the DuckDuckGo search (`check_opposite_view`) tool to fetch controversies and alternative views from the general web.
    3. If detailed checks on articles are needed, you can use `fetch_article_full_text`.
    4. Evaluate research findings with a balanced viewpoint and compile the criticism text.
    """

    api_key = os.getenv("GROQ_API_KEY")
    llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.2,
        groq_api_key=api_key
    )

    tools = [check_opposite_view, fetch_article_full_text]
    llm_with_tools = llm.bind_tools(tools)

    current_messages = [
        {"role": "system", "content": prompt}
    ]
    for msg in messages:
        current_messages.append({"role": msg["role"], "content": msg["content"]})

    response = llm_with_tools.invoke([
        (msg["role"], msg["content"]) for msg in current_messages
    ])

    new_messages = list(messages)
    new_messages.append({"role": "assistant", "content": response.content})

    if response.tool_calls:
        tool_node = ToolNode(tools)
        tool_results = tool_node.invoke({"messages": [response]})
        for tool_msg in tool_results["messages"]:
            new_messages.append({"role": "tool", "content": str(tool_msg.content), "name": tool_msg.name})

        second_response = llm.invoke([
            (msg["role"], msg["content"]) for msg in new_messages
        ])
        new_messages.append({"role": "assistant", "content": second_response.content})

    return {"messages": new_messages}


def writer_node(state: AgentState):
    """Writer Agent: Analyzes the gathered data and criticisms to draft the final insight,
    and runs LLM-as-Judge for preview.
    """
    goal = state.get("goal_type")
    topic = state.get("topic")
    messages = state.get("messages", [])

    prompt = f"""You are a Lead Writer Agent. Your task is to collate reports from both the Researcher and the Critic to compile a high-quality actionable insight.
    Goal Audience: {goal}
    Target Topic: {topic}

    You need to:
    1. Formulate a concise, single-sentence "trend".
    2. Write a comprehensive "summary" that balances both research and critic viewpoints.
    3. Select the numeric database IDs of supporting news articles that exist in the database.
    
    Strictly use the requested structure in your response to prepare the draft.
    """

    api_key = os.getenv("GROQ_API_KEY")
    writer_llm = ChatGroq(
        model="llama-3.3-70b-versatile",
        temperature=0.3,
        groq_api_key=api_key
    ).with_structured_output(WriterOutput)

    # Invoke structured writer
    input_history = [
        ("system", prompt)
    ]
    for msg in messages:
        if msg["role"] in ("user", "assistant"):
            input_history.append((msg["role"], msg["content"]))

    writer_draft = writer_llm.invoke(input_history)

    # Now, run LLM-as-Judge on the draft for preview
    supporting_articles_context = ""
    with Session(engine) as session:
        if writer_draft.supporting_ids:
            stmt = select(NewsArticle).where(NewsArticle.id.in_(writer_draft.supporting_ids))
            db_articles = session.exec(stmt).all()
            context_parts = []
            for art in db_articles:
                context_parts.append(
                    f"Article [{art.id}]:\nTitle: {art.title}\nDescription: {art.description or 'No description'}\nContent: {art.content or 'No content'}\n"
                )
            supporting_articles_context = "\n".join(context_parts)

    relevance = 0
    grounding = 0
    actionability = 0
    explanation = ""

    try:
        judge_llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            temperature=0.0,
            groq_api_key=api_key
        ).with_structured_output(JudgeEvaluation)

        formatted_judge = JUDGE_PROMPT.format(
            trend=writer_draft.trend,
            summary=writer_draft.summary,
            supporting_articles_context=supporting_articles_context or "No supporting articles found."
        )

        eval_result = judge_llm.invoke(formatted_judge)
        relevance = eval_result.relevance_score
        grounding = eval_result.grounding_score
        actionability = eval_result.actionability_score
        explanation = eval_result.explanation
    except Exception as e:
        explanation = f"Judge API temporarily unavailable: {str(e)}"
        print(f"LLM-as-Judge preview error: {e}")

    # Add assistant log for UI stream
    new_messages = list(messages)
    log_content = f"Drafted Trend: {writer_draft.trend}\n\nDrafted Summary: {writer_draft.summary}\n\nJudge Evaluation Preview:\n- Relevance: {relevance}/10\n- Grounding: {grounding}/10\n- Actionability: {actionability}/10\n- Reasoning: {explanation}"
    new_messages.append({"role": "assistant", "content": log_content})

    return {
        "messages": new_messages,
        "draft_trend": writer_draft.trend,
        "draft_summary": writer_draft.summary,
        "supporting_ids": writer_draft.supporting_ids,
        "relevance_score": relevance,
        "grounding_score": grounding,
        "actionability_score": actionability,
        "eval_explanation": explanation
    }


def save_insight_node(state: AgentState):
    """Save Node: If state.approved is True, the draft will be saved to the DB.
    Otherwise, the state will be discarded.
    """
    approved = state.get("approved", False)
    rejected = state.get("rejected", False)
    trend = state.get("draft_trend")
    summary = state.get("draft_summary")
    supporting_ids = state.get("supporting_ids", [])
    relevance = state.get("relevance_score", 0)
    grounding = state.get("grounding_score", 0)
    actionability = state.get("actionability_score", 0)
    explanation = state.get("eval_explanation", "")

    if approved and trend and summary:
        is_alert = (relevance < 7 or grounding < 7 or actionability < 7) and not ("temporarily unavailable" in explanation)
        alert_msg = ""
        if is_alert:
            alert_msg = f"[CRITICAL ALERT] LLM-as-Judge low score: Relevance {relevance}, Grounding {grounding}, Actionability {actionability}"
            print(alert_msg)

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
            print(f"Insight successfully saved with ID: {insight.id}")

        new_msg = f"Insight successfully saved to database! ID: {insight.id}"
    elif rejected:
        new_msg = "Insight generation rejected by the user. Workflow terminated without saving."
    else:
        new_msg = "Workflow ended with no feedback or pending values."

    return {
        "messages": state.get("messages", []) + [{"role": "assistant", "content": new_msg}]
    }

# ----------------------------------------------------
# 5. Graph Assembly & Compilation
# ----------------------------------------------------

def get_swarm_graph(checkpointer):
    builder = StateGraph(AgentState)

    # Add nodes
    builder.add_node("researcher", researcher_node)
    builder.add_node("critic", critic_node)
    builder.add_node("writer", writer_node)
    builder.add_node("save_insight_node", save_insight_node)

    # Define edges
    builder.add_edge(START, "researcher")
    builder.add_edge("researcher", "critic")
    builder.add_edge("critic", "writer")
    builder.add_edge("writer", "save_insight_node")
    builder.add_edge("save_insight_node", END)

    # Interrupt before saving so the user can approve/reject the drafted insight
    return builder.compile(
        checkpointer=checkpointer,
        interrupt_before=["save_insight_node"]
    )
