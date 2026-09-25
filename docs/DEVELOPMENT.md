# Development

## Services

Start PostgreSQL and Qdrant from the repository root:

```bash
docker compose up -d postgres qdrant
```

Copy `backend/.env.example` to `backend/.env`, choose a strong `SECRET_KEY`, and set the local database password to match Compose. Provider credentials are optional during normal product development.

Password recovery does not require a paid provider. Organization administrators can create a one-time 30-minute link from **Users & Roles**. To deliver public recovery requests automatically, configure the optional `SMTP_*` values and set `FRONTEND_URL` to the public frontend origin; Gmail app passwords and other standard SMTP services work without code changes.

## Backend

From `backend/`:

```bash
python -m venv venv
./venv/Scripts/pip install -r requirements.txt
./venv/Scripts/alembic upgrade head
./venv/Scripts/uvicorn main:app --reload
./venv/Scripts/python -m pytest -q
```

## Frontend

Copy `frontend/.env.example` to `frontend/.env`, then from `frontend/`:

```bash
npm install
npm run dev
npm run lint
npm run type-check
npm run build
```

The web application runs at `http://localhost:3000`; the API and interactive schema run at `http://localhost:8000` and `http://localhost:8000/docs`.

Generated frontend build output is intentionally ignored. Do not commit `frontend/dist`.
