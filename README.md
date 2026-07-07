# Insightful: Agentic AI-Powered News Analyst & Research Assistant

**Insightful** is a state-of-the-art, production-ready research platform that leverages a multi-agent orchestration framework to fetch, filter, analyze, and synthesize target news topics into structured, high-value insights. The system combines a stateful LangGraph agentic loop with an automated **LLM-as-a-Judge** evaluation gate, uses Postgres-backed checkpointing for user-in-the-loop approval, and streams the entire reasoning trace in real time to a modern Next.js dashboard.

---

## 🚀 Key Highlights

- **Stateful Multi-Agent Swarm (LangGraph):** Implements a multi-agent workflow using LangGraph to coordinate different analysis phases:
  - **Researcher Agent:** Fetches news using `search_news` (NewsAPI) and scores articles via `score_article` to filter out spam.
  - **Critic Agent:** Searches for counterarguments, controversies, or negative views via DuckDuckGo Search (`check_opposite_view`) and parses full article texts (`fetch_article_full_text` using the `newspaper` library) to neutralize LLM bias.
  - **Writer Agent:** Drafts trend summaries and executes the LLM-as-a-Judge evaluation before sending the draft for user review.
  - **Save Insight Node:** Persists approved insights to the database, flagging low-quality results.
- **Postgres Checkpointing & User-in-the-Loop:** Uses `PostgresSaver` checkpointer in LangGraph to freeze graph execution before saving insights. Users can approve or reject the draft trend and summary directly from the dashboard, which resumes the agent workflow.
- **LLM-as-a-Judge Evaluation Gate:** Evaluates generated insights on three key metrics (scaled 1-10): **Relevance**, **Grounding** (truthfulness based on supporting articles), and **Actionability**. Insights scoring below 7/10 trigger critical quality alerts.
- **Real-Time Stream Processing (FastAPI SSE):** Streams internal agent logs, thoughts, and tool executions to the frontend in real time using Server-Sent Events (SSE).
- **Curated Collections & Custom Sources:** Users can perform actions on articles (categorize them as `Favourite`, `Spam`, `To Read`, or `Learnings`) and manage custom keyword queries/source tracking.
- **Secure Authentication & Guest Login:** Integrated with **Better Auth** supporting standard email/password authentication as well as a quick **Anonymous/Guest Login** plugin.

---

## 🛠️ Tech Stack

### AI & Agent Orchestration
*   **Orchestrator:** [LangGraph](https://github.com/langchain-ai/langgraph) (Stateful Agent Graphs with `PostgresSaver` checkpointing)
*   **LLM Integration:** LangChain Core & [LangChain Groq](https://github.com/langchain-ai/langchain-extract)
*   **Models:** `llama-3.3-70b-versatile` (fast inference engine via Groq)
*   **Search & Crawling:** DuckDuckGo Search (`duckduckgo-search`) & Newspaper (`newspaper3k`)
*   **Observability:** LangSmith (Agent tracing & debugging)

### Backend Services
*   **Framework:** FastAPI (Python 3.13)
*   **ORM / DB Access:** SQLModel (combines SQLAlchemy & Pydantic)
*   **Migration Tool:** Alembic
*   **Database:** PostgreSQL (compatible with standard SQL engines)
*   **Package Manager:** `uv` (Ultra-fast Python package compiler)

### Frontend Dashboard
*   **Framework:** Next.js 16 (App Router, Server Actions, TypeScript)
*   **Styling:** Tailwind CSS v4 (Modern CSS framework)
*   **Icons:** Lucide React
*   **Authentication:** Better Auth (with Anonymous/Guest sign-in plugin)

---

## 📐 System Architecture & Workflow

```mermaid
graph TD
    A[Next.js Frontend] -->|POST /agent/stream-insights| B[FastAPI Backend]
    B -->|Initialize with checkpointer| D[LangGraph Agent Graph]
    
    subgraph LangGraph Agent Swarm Workflow
        D -->|Node 1: researcher| E[Search & Score Articles]
        E -->|Tool: search_news| E1[NewsAPI Fetcher]
        E -->|Tool: score_article| E2[Spam Filter]
        
        E -->|Node 2: critic| F[Search Opposing Viewpoints]
        F -->|Tool: check_opposite_view| F1[DuckDuckGo Search]
        F -->|Tool: fetch_article_full_text| F2[Newspaper Parser]
        
        F -->|Node 3: writer| G[Draft Trend & Summary + Evaluate]
        G -->|LLM-as-a-Judge Rating| G1[Llama 3.3 70B]
    end
    
    G -->|Interrupt before save| H{User Review}
    H -->|POST /agent/approve action=approve| I[approved=True]
    H -->|POST /agent/approve action=reject| J[rejected=True]
    
    I & J -->|Resume graph execution| K[Node 4: save_insight_node]
    K -->|If approved| L[Save to PostgreSQL DB]
    K -->|If low score < 7| L1[Trigger Low Quality Alert]
    K -->|If rejected| M[Discard Draft]
    
    L & L1 & M -->|Stream final status SSE| B
    B -->|Live stream thoughts / states| A
```

---

## 📂 Project Structure

```text
├── app/                       # Next.js 16 Frontend App Router
│   ├── api/                   # Local frontend proxy routes & Auth API routing
│   ├── collections/           # My Collections tab (To Read, Learnings, Spam, Favourites)
│   ├── components/            # UI components (PinButton, RefreshBanners, Sidebar, NewsFilters)
│   │   └── auth/              # Better Auth login/signup & guest forms
│   ├── insights/              # AI Insights Stream Terminal page
│   ├── keywords/              # Keyword manager and history page
│   ├── login/                 # LoginPage mounting AuthForm
│   ├── news/                  # News article feed with advanced search & bulk deletion
│   ├── note/                  # Research Notes CRUD manager
│   ├── sources/               # Custom sources and article feeds
│   ├── lib/                   # Next.js core actions, api, schemas, and auth-client configs
│   ├── layout.tsx             # Global layout structure
│   ├── page.tsx               # Main Dashboard landing page (Pinned keywords/sources)
│   └── globals.css            # Tailwind CSS variables and global rules
│
├── news_agent/                # FastAPI Backend
│   ├── routers/               # APIRoutes (agent, news, keywords, sources, actions, notes)
│   ├── agent_swarm.py         # LangGraph ReAct agent, state schema, and tools implementation
│   ├── agent_utils.py         # Legacy ReAct agent graph fallback
│   ├── model.py               # SQLModel schemas & relationships (Postgres)
│   ├── schemas.py             # Pydantic schemas for request validation & serializing response
│   ├── db.py                  # Database connection pool setup
│   ├── news_fetcher.py        # NewsAPI consumer, local DB parser & de-duplicator
│   ├── config.py              # Configuration settings using Pydantic Settings
│   └── main.py                # FastAPI app initialization, CORS middleware, and routers
│
├── pyproject.toml             # Python project dependencies
├── uv.lock                    # Locked python dependency graph
├── package.json               # Frontend dependencies & configurations
└── Makefile                   # Utility commands for local setup
```

---

## 💾 Database Models & Schema

The PostgreSQL backend is structured using the following **SQLModel** database classes:

- **`NewsArticle`**: Stores fetched news articles, associated authors, content, URLs, and relationships.
- **`NewsSource`**: Represents news domains (e.g. `the-verge`) with custom pinning and advanced query overrides.
- **`QueryKeyword`**: Tracks target keywords (e.g. `generative ai`) along with custom excluded domains and search logic.
- **`ArticleAction`**: Tracks user actions on articles, including `favourite`, `spam`, `to_read`, and `learnings`.
- **`Note`**: Stores user-created research notes and formatting updates.
- **`UserInsight`**: Persists the generated agentic output, judge scores, and critique reasoning.
- **`FetchHistory` / `SourceFetchHistory`**: Maintains audit stats (total found, saved, duplicates) for refresh events.

---

## 🔧 Installation & Setup

### Prerequisites
- Python 3.13+ installed (Recommended: `uv` package manager)
- Node.js 18+ (Recommended: Node 20+)
- PostgreSQL Database
- NewsAPI API Key
- Groq API Key

### Backend Setup
1. Clone the repository and navigate to the root directory:
   ```bash
   git clone <your-repo-url>
   cd insightful
   ```
2. Setup environment variables by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your database details, keys, and secrets:
   ```env
   GROQ_API_KEY="your-groq-key"
   NEWS_API_KEY="your-newsapi-key"
   DATABASE_URL="postgresql://user:password@localhost:5432/insightful"
   BETTER_AUTH_SECRET="your-better-auth-secret"
   ```

3. Install backend dependencies and spin up virtual environment:
   ```bash
   uv sync
   ```

4. Run database migrations:
   ```bash
   alembic upgrade head
   ```

5. Run the FastAPI dev server:
   ```bash
   fastapi dev news_agent/main.py --port 8000
   ```

### Frontend Setup
1. Install frontend node modules:
   ```bash
   npm install
   ```
2. Spin up Next.js dev server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` to interact with the dashboard, register or log in as guest, and run agentic analysis.
