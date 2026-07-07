from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse


from datetime import datetime, timezone
from contextlib import asynccontextmanager
from .db import engine
from sqlmodel import SQLModel
from .schemas import  ErrorResponse
from .routers import news, keywords, sources, actions, notes, agent
from .model import *

import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables
    SQLModel.metadata.create_all(engine)
    yield
    # Shutdown

app = FastAPI(lifespan=lifespan)

class VercelAgentPrefixMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] in ("http", "websocket"):
            path = scope.get("path", "")
            if path.startswith("/agent"):
                scope["path"] = path[len("/agent"):]
                if "raw_path" in scope:
                    raw_path = scope["raw_path"]
                    if isinstance(raw_path, bytes):
                        raw_path_str = raw_path.decode("ascii", errors="ignore")
                        if raw_path_str.startswith("/agent"):
                            scope["raw_path"] = raw_path_str[len("/agent"):].encode("ascii")
        await self.app(scope, receive, send)

if os.getenv("VERCEL") == "1" or os.getenv("STRIP_AGENT_PREFIX") == "true":
    app.add_middleware(VercelAgentPrefixMiddleware)


@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            detail=exc.detail, 
            status_code=exc.status_code, 
            timestamp=datetime.now(timezone.utc)
        ).model_dump()
    )

@app.get("/")
def read_root():
    return {"message": "Welcome to the Ai news api!"}

app.include_router(news.router)
app.include_router(keywords.router)
app.include_router(sources.router)
app.include_router(actions.router)
app.include_router(notes.router)
app.include_router(agent.router)