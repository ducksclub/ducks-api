# DUCK'S Backend

Production-ready FastAPI backend for the DUCK'S game club website and Telegram bot.

## Stack

- Python 3.11+
- FastAPI
- SQLite + SQLAlchemy ORM
- Pydantic
- JWT auth
- Uvicorn
- HTTP API suitable for a Telegram bot built with `python-telegram-bot`

## Project Structure

```text
backend/
  app/
    database/      # SQLite engine, sessions, table initialization
    models/        # SQLAlchemy ORM models
    routers/       # FastAPI endpoints
    schemas/       # Pydantic request/response schemas
    services/      # Business logic
    config.py      # Environment settings
    dependencies.py
    main.py
  scripts/
    seed.py        # Admin user and demo events
  requirements.txt
  Dockerfile
```

## Quick Start

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python -m scripts.seed
uvicorn app.main:app --reload
```

Open:

- API docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

Seed admin:

- Email: `admin@ducksclub.com`
- Password: `Admin12345!`

Change these values in `.env` before real deployment.

## Main Endpoints

Auth:

- `POST /auth/register`
- `POST /register` - simple alias for Telegram clients
- `POST /auth/login`
- `GET /auth/me`

Events:

- `GET /events`
- `GET /events?game_type=poker`
- `POST /events` - admin only
- `POST /events/{event_id}/register`
- `DELETE /events/{event_id}/register`

Rating:

- `GET /rating`
- `GET /rating/poker`
- `GET /rating/darts`
- `GET /rating/billiard`

Content and feedback:

- `GET /rules`
- `GET /faq`
- `POST /feedback`
- `POST /feedback/me`
- `GET /feedback` - admin only

## Telegram Bot Integration

Keep the bot as a separate service. It should call this backend through HTTP:

- `/events` to show upcoming events
- `/register` to create a user
- `/rating/poker`, `/rating/darts`, `/rating/billiard` to show leaderboards
- `/rules` to show club rules
- `/feedback` to send user messages

The backend does not import bot handlers into business logic. This keeps the API reusable for both web and Telegram clients.

## Docker

```bash
docker build -t ducks-backend .
docker run --env-file .env -p 8000:8000 ducks-backend
```
