# Cafe System (Backend)

This is the Django REST Framework backend for the University Cafe System.

Quick setup (local):

1. Create a virtual environment and activate it

   python -m venv venv; .\venv\Scripts\Activate.ps1

2. Install dependencies

   pip install -r requirements.txt

3. Configure environment variables (recommended)

   - SECRET_KEY
   - DATABASE_URL (Postgres URL, optional; defaults to sqlite db.sqlite3)
   - ALLOWED_HOSTS (comma separated)

4. Run migrations and collect static

   python manage.py migrate
   python manage.py collectstatic --no-input

5. Run the server

   python manage.py runserver

Deployment notes (Render):

- Use the provided `build.sh` as the build command.
- Add a `Procfile` with: `web: gunicorn backend.wsgi:application --bind 0.0.0.0:$PORT`
- Ensure environment variables are set in Render (SECRET_KEY, DATABASE_URL, ALLOWED_HOSTS).

API docs available at `/api/schema/`, `/api/docs/swagger/`, `/api/docs/redoc/` when running.
