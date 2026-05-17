# CRM Backend

Django 5 REST API for the CRM application: leads, tasks, notes, dashboard stats, admin user management, Clerk session exchange, email/password JWT auth, and optional Google/Facebook OAuth.

## Requirements

- **Python** 3.10 or newer (3.12 recommended)
- **MySQL** 5.7+ or 8.x with a database the app can use
- **MySQL client libraries** on the system (for PyMySQL / OpenSSL as needed by `cryptography`)

The project uses **PyMySQL** as the MySQL driver (`core/__init__.py` calls `pymysql.install_as_MySQLdb()`).

## Quick start

From the `backend` directory:

### 1. Create a virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
```

**What you should see (this is normal):**

- `python3 -m venv .venv` often prints **nothing** when it succeeds. No message does **not** mean it failed.
- `source .venv/bin/activate` is also usually **silent**. Check that your prompt now starts with **`(.venv)`** — that means the environment is active.
- Creating or activating the venv **does not start** Django or open a port. The API only runs after you finish the steps below and run **`python manage.py runserver`**.

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment

Copy the example env file and edit values (especially MySQL and production secrets):

```bash
cp .env.example .env
```

See [Environment variables](#environment-variables) below.

### 4. Create the MySQL database

Create an empty database (name and user should match your `.env` or the defaults you intend to use), for example:

```sql
CREATE DATABASE my_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Grant the Django database user full privileges on that database.

### 5. Apply migrations

```bash
python manage.py migrate
```

### 6. Create an admin user (optional)

For Django admin (`/admin/`):

```bash
python manage.py createsuperuser
```

### 7. Run the development server

```bash
python manage.py runserver
```

Unlike the venv commands, this step **does** print to the terminal. You should see something like `Starting development server at http://127.0.0.1:8000/` and log lines when you hit the API. Leave this process running while you develop; stop it with `Ctrl+C`.

By default the API is at **http://127.0.0.1:8000/**. Root API routes live under **`/api/`**.

Examples:

- Health: `GET http://127.0.0.1:8000/api/health/`
- Django admin: `http://127.0.0.1:8000/admin/`

To listen on all interfaces (e.g. for another device on your LAN):

```bash
python manage.py runserver 0.0.0.0:8000
```

## Environment variables

Variables are loaded from **`backend/.env`** (see `core/settings.py`). Commonly used:

| Variable | Purpose |
|----------|---------|
| `DJANGO_SECRET_KEY` | Secret key for Django and signing. **Required in production.** |
| `DJANGO_DEBUG` | `true` / `false` (default in code: debug-friendly for local dev). Set `false` in production. |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames (default: `localhost,127.0.0.1`). |
| `MYSQL_DATABASE` | MySQL database name. |
| `MYSQL_USER` | MySQL user. |
| `MYSQL_PASSWORD` | MySQL password. |
| `MYSQL_HOST` | MySQL host (default `127.0.0.1`). |
| `MYSQL_PORT` | MySQL port (default `3306`). |
| `CLERK_JWKS_URL` | Clerk JWKS URL for verifying session JWTs. **Required** for `POST /api/auth/clerk-token/`. |
| `CLERK_ISSUER` | Expected JWT issuer(s); comma-separated if you have multiple (e.g. dev vs prod). |
| `CLERK_AUDIENCE` | Optional; set if your Clerk JWTs include an `aud` claim you must match. |
| `BOOTSTRAP_ADMIN_EMAILS` | Comma-separated emails that receive **ADMIN** on first email registration. |
| `BOOTSTRAP_ADMIN_CLERK_IDS` | Comma-separated Clerk user IDs (`sub`) that receive **ADMIN** on first Clerk profile sync. |
| `OAUTH_FRONTEND_CALLBACK_URL` | Where OAuth completes in the frontend (default `http://localhost:5173/oauth/callback`). |
| `GOOGLE_OAUTH_CLIENT_ID` / `GOOGLE_OAUTH_CLIENT_SECRET` / `GOOGLE_OAUTH_REDIRECT_URI` | Google OAuth (optional). |
| `FACEBOOK_APP_ID` / `FACEBOOK_APP_SECRET` / `FACEBOOK_OAUTH_REDIRECT_URI` | Facebook OAuth (optional). |

Additional commented examples live in **`.env.example`**. Note: any `CRM_JWT_*` lines there are not read by `core/settings.py` today; API tokens after login are **Simple JWT** (`djangorestframework-simplejwt`) as configured in settings.

## Authentication

- **Email/password:** `POST /api/auth/register/`, then `POST /api/auth/token/` and `POST /api/auth/token/refresh/` (Simple JWT). Send `Authorization: Bearer <access_token>` to protected routes.
- **Clerk:** Configure `CLERK_JWKS_URL` (and usually `CLERK_ISSUER`). The frontend sends the Clerk session JWT to **`POST /api/auth/clerk-token/`** with `Authorization: Bearer <clerk_session_jwt>`; the API returns Simple JWT access and refresh tokens for the same CRM user model.

If Clerk is not configured, `clerk-token` responds with **503** and a clear message.

## CORS

The API allows credentialed requests from the Vite dev origins **`http://localhost:5173`** and **`http://127.0.0.1:5173`**. For another frontend origin, update `CORS_ALLOWED_ORIGINS` in `core/settings.py` (or extend settings to read it from the environment).

## API layout (high level)

Mounted at **`/api/`** (see `api/urls.py`):

| Area | Examples |
|------|----------|
| Health | `GET /api/health/` |
| Auth | `/api/auth/register/`, `/api/auth/token/`, `/api/auth/token/refresh/`, `/api/auth/clerk-token/` |
| OAuth | `/api/auth/oauth/providers/`, Google/Facebook start and callback routes |
| User | `GET /api/me/` |
| CRM | `/api/leads/`, `/api/tasks/`, `/api/notes/` (DRF viewsets) |
| Dashboard | `GET /api/dashboard/stats/` |
| Admin (role-gated in app logic) | `/api/admin/users/`, `/api/admin/logs/`, `/api/admin/export/leads/` |

Pagination defaults: page size **25**, max **100** (`page` and `page_size` query params).

## Project layout

```
backend/
├── core/           # Django project (settings, root URLs, WSGI/ASGI)
├── api/            # CRM app: models, serializers, views, auth, OAuth, migrations
├── manage.py
├── requirements.txt
├── .env.example
└── README.md
```

## Useful commands

```bash
# Migrations
python manage.py makemigrations
python manage.py migrate

# Shell and checks
python manage.py shell
python manage.py check

# Tests (if you add tests under api/tests)
python manage.py test





pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

## Production notes

- Set **`DJANGO_DEBUG=false`**, a strong **`DJANGO_SECRET_KEY`**, and **`DJANGO_ALLOWED_HOSTS`** correctly.
- Use a proper WSGI/ASGI server (e.g. Gunicorn + reverse proxy), HTTPS, and secure database credentials.
- Ensure **Clerk** and **OAuth** redirect URIs match your deployed frontend URLs.
- Never commit **`.env`** or real database passwords to version control.
