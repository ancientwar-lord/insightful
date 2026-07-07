from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlmodel import Session, select
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
import json
import asyncio
import uuid
from typing import List, Optional

from ..db import get_session, engine
from ..model import NewsArticle, UserInsight
from ..agent_swarm import get_swarm_graph
from langgraph.checkpoint.postgres import PostgresSaver
from ..config import settings

router = APIRouter(prefix="/agent", tags=["Agentic Insights"])

class InsightRequest(BaseModel):
    user_id: str
    goal_type: str
    topic: str
    thread_id: Optional[str] = None

class ApproveRequest(BaseModel):
    thread_id: str
    action: str  # "approve" or "reject"

@router.post("/stream-insights")
async def stream_insights(req: InsightRequest):
    # 1. Fetch recent articles from the last 3 days to feed to the agent
    with Session(engine) as session:
        three_days_ago = datetime.now(ZoneInfo("Asia/Kolkata")) - timedelta(days=3)
        stmt = (
            select(NewsArticle)
            .where(NewsArticle.published_at >= three_days_ago)
            .order_by(NewsArticle.published_at.desc())
            .limit(20)
        )
        articles = session.exec(stmt).all()
        summary_parts = []
        for idx, art in enumerate(articles):
            source_name = art.source.name if art.source else "Unknown"
            summary_parts.append(
                f"{idx+1}. {art.title} (Source: {source_name}) - {art.description or ''}"
            )
        recent_articles_summary = (
            "\n".join(summary_parts)
            if summary_parts
            else "No recent articles found in the database. Please search/fetch news first."
        )

    # Generate thread_id if not present
    thread_id = req.thread_id or str(uuid.uuid4())
    config = {"configurable": {"thread_id": thread_id}}

    async def event_generator():
        # First send init message with thread_id
        yield f"data: {json.dumps({'type': 'init', 'thread_id': thread_id})}\n\n"
        await asyncio.sleep(0.01)

        initial_messages = {
            "messages": [
                {
                    "role": "user",
                    "content": f"Generate daily insights for a {req.goal_type} focused on {req.topic}. Use tools and cite sources."
                }
            ],
            "goal_type": req.goal_type,
            "topic": req.topic,
            "recent_articles_summary": recent_articles_summary,
            "approved": False,
            "rejected": False
        }

        try:
            # Use Postgres checkpointer context manager
            with PostgresSaver.from_conn_string(settings.DATABASE_URL) as checkpointer:
                # Ensure checkpoint tables are created
                checkpointer.setup()
                agent_graph = get_swarm_graph(checkpointer)

                # Stream updates from LangGraph nodes
                async for event in agent_graph.astream(initial_messages, config=config, stream_mode="updates"):
                    for node_name, node_update in event.items():
                        if "messages" in node_update:
                            messages = node_update["messages"]
                            if messages:
                                latest_msg = messages[-1]
                                content = latest_msg.get("content", "")
                                role = latest_msg.get("role", "assistant")

                                if role == "tool":
                                    # Truncate long tool content
                                    content_str = str(content)
                                    if len(content_str) > 1000:
                                        content_str = content_str[:1000] + "... [truncated]"
                                    yield f"data: {json.dumps({'type': 'tool', 'name': latest_msg.get('name', 'tool'), 'content': content_str})}\n\n"
                                else:
                                    yield f"data: {json.dumps({'type': 'agent', 'node': node_name, 'content': content})}\n\n"
                        await asyncio.sleep(0.01)

                # Check if graph is currently suspended/interrupted
                state = agent_graph.get_state(config)
                if state.next and "save_insight_node" in state.next:
                    values = state.values
                    yield f"data: {json.dumps({
                        'type': 'pending_approval',
                        'thread_id': thread_id,
                        'trend': values.get('draft_trend'),
                        'summary': values.get('draft_summary'),
                        'supporting_ids': values.get('supporting_ids', []),
                        'relevance_score': values.get('relevance_score', 0),
                        'grounding_score': values.get('grounding_score', 0),
                        'actionability_score': values.get('actionability_score', 0),
                        'eval_explanation': values.get('eval_explanation', '')
                    })}\n\n"
                    await asyncio.sleep(0.01)

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'detail': str(e)})}\n\n"
            await asyncio.sleep(0.01)
        
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/approve")
async def approve_insight(req: ApproveRequest):
    try:
        with PostgresSaver.from_conn_string(settings.DATABASE_URL) as checkpointer:
            checkpointer.setup()
            agent_graph = get_swarm_graph(checkpointer)
            config = {"configurable": {"thread_id": req.thread_id}}

            # Update the state based on user's action
            if req.action == "approve":
                agent_graph.update_state(config, {"approved": True, "rejected": False}, as_node="writer")
            else:
                agent_graph.update_state(config, {"approved": False, "rejected": True}, as_node="writer")

            # Resume execution
            async for event in agent_graph.astream(None, config=config, stream_mode="updates"):
                # Run to completion
                pass

            # Fetch final state message
            state = agent_graph.get_state(config)
            messages = state.values.get("messages", [])
            latest_msg = messages[-1]["content"] if messages else "Workflow finalized."

            return {
                "status": "success",
                "message": latest_msg
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resume workflow: {str(e)}")

@router.get("/insights")
def get_insights(session: Session = Depends(get_session)):
    stmt = select(UserInsight).order_by(UserInsight.created_at.desc())
    insights = session.exec(stmt).all()
    
    response_data = []
    for insight in insights:
        insight_dict = insight.model_dump()
        supporting_articles = []
        if insight.supporting_ids:
            # Batch fetch articles
            stmt_art = select(NewsArticle).where(NewsArticle.id.in_(insight.supporting_ids))
            articles = session.exec(stmt_art).all()
            supporting_articles = [
                {
                    "id": art.id,
                    "title": art.title,
                    "url": art.url,
                    "source_name": art.source.name if art.source else "Unknown"
                }
                for art in articles
            ]
        insight_dict["supporting_articles"] = supporting_articles
        response_data.append(insight_dict)
    return response_data

@router.delete("/insights/{insight_id}")
def delete_insight(insight_id: int, session: Session = Depends(get_session)):
    insight = session.get(UserInsight, insight_id)
    if not insight:
        raise HTTPException(status_code=404, detail="Insight not found")
    session.delete(insight)
    session.commit()
    return {"message": f"Insight {insight_id} deleted successfully"}
