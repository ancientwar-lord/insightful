# Makefile for insightful (Next.js + FastAPI + uv)

# -------------------- HELP (Default) --------------------
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make install        - Install backend (uv) and frontend (npm) dependencies"
	@echo "  make dev            - Run both backend and frontend together (in background)"
	@echo "  make start-backend  - Run FastAPI backend only (with auto-reload)"
	@echo "  make start-frontend - Run Next.js frontend only"

# ---------------------- Installation --------------------
.PHONY: install
install:
	@echo "Installing backend dependencies..."
	uv sync
	@echo "Installing frontend dependencies..."
	npm install

# ---------------------- Backend --------------------
.PHONY: start-backend
start-backend:
	uv run uvicorn news_agent.main:app --host 0.0.0.0 --port 8000 --reload

# ---------------------- Frontend --------------------
.PHONY: start-frontend
start-frontend:
	npm run dev

# ---------------------- Frontend+Backend ----------
.PHONY: dev
dev:
	@echo "Starting Backend & Frontend together..."
	uv run uvicorn news_agent.main:app --host 0.0.0.0 --port 8000 --reload & \
	npm run dev




# ==================== ALEMBIC MIGRATIONS ====================

.PHONY: migrate
migrate:  ## Generate + Apply (usage: make migrate m="add column")
	@if [ -z "$(m)" ]; then \
		echo "❌ Error: Usage: make migrate m=\"message\""; \
		exit 1; \
	fi
	@echo "...Generating migration: $(m)"
	uv run alembic revision --autogenerate -m "$(m)"
	@echo "Applying migration..."
	uv run alembic upgrade head
	@echo "Migration done!"

.PHONY: migrate-create
migrate-create:  ## Generate only (usage: make migrate-create m="add column")
	@if [ -z "$(m)" ]; then \
		echo "❌ Error: Usage: make migrate-create m=\"message\""; \
		exit 1; \
	fi
	uv run alembic revision --autogenerate -m "$(m)"
	@echo "Migration file created."

.PHONY: migrate-up
migrate-up:  ## Apply pending migrations
	uv run alembic upgrade head
	@echo "Database upgraded."

.PHONY: migrate-status
migrate-status:  ## Check current version
	uv run alembic current

.PHONY: migrate-rollback
migrate-rollback:  ## Rollback last migration
	uv run alembic downgrade -1
	@echo "Rolled back 1 step."
