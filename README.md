# Crypto AI Market Analyst

Crypto AI Market Analyst is a full-stack React + FastAPI application for realtime crypto market analysis, investor profiling, AI-assisted suggestions, and monthly/yearly scenario mapping.

The app includes authentication, per-user saved profile data, Postgres persistence, dark/light theme support, live CoinGecko market data, OpenAI-backed suggestions when an API key is available, and a rule-based fallback when it is not.

## Features

- Login and signup before accessing the dashboard.
- Per-user profile storage in Postgres.
- Dark/light mode saved per user.
- Realtime market data through the FastAPI backend.
- Major coins, altcoins, DeFi/L2/AI assets, gaming assets, and meme coins.
- Includes requested assets: `GALA`, `SHIB`, `PUMP`, `MOG`, and `PEPE`.
- Initial asset list is intentionally compact, with a load-more control.
- High/low range, momentum chart, sparkline cards, and risk heat metrics.
- AI suggestion engine using OpenAI Responses API when `OPENAI_API_KEY` is set.
- Rule-based analysis fallback when OpenAI is not configured.
- Analysis records saved to Postgres per user.

## Tech Stack

- Frontend: React, Vite, Lucide React, Nginx
- Backend: FastAPI, SQLAlchemy, Pydantic, HTTPX
- Database: Postgres
- Market Data: CoinGecko public API
- AI: OpenAI Responses API
- Runtime: Docker Compose

## Quick Start

```bash
docker compose up --build -d
```

Open:

```text
http://127.0.0.1:3000
```

Services:

- Frontend: `http://127.0.0.1:3000`
- Backend: `http://127.0.0.1:8000`
- Postgres: `127.0.0.1:5433`

Stop:

```bash
docker compose down
```

## Environment

Copy the example file if you want local overrides:

```bash
cp .env.example .env
```

Optional OpenAI suggestions:

```bash
OPENAI_API_KEY="your_key_here" docker compose up --build -d
```

If `OPENAI_API_KEY` is not set, the backend uses rule-based analysis and still saves all user/profile/analysis data to Postgres.

## Docker Ports

The frontend defaults to host port `3000`.

```bash
FRONTEND_PORT=5176 docker compose up --build -d
```

Postgres defaults to host port `5433` to avoid clashing with a local Postgres on `5432`.

```bash
POSTGRES_PORT=5434 docker compose up --build -d
```

## API

Public:

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/market?currency=usd`

Authenticated:

- `GET /api/auth/me`
- `PUT /api/profile`
- `PUT /api/theme`
- `POST /api/analyze`

Authenticated endpoints require:

```http
Authorization: Bearer <token>
```

## Local Development

Backend:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://127.0.0.1:5173
```

The Vite dev server proxies `/api/*` to the local FastAPI backend.

## Database

Tables are created automatically on backend startup:

- `users`
- `user_profiles`
- `analysis_records`

Check counts:

```bash
docker exec crypto-ai-postgres psql -U crypto_ai -d crypto_ai -c "select count(*) from users;"
```

Reset local Docker data:

```bash
docker compose down -v
```

## Notes

This application is educational software. Crypto markets are volatile, and generated analysis is not financial advice.
