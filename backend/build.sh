#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status.
set -o errexit

# Install Python dependencies from requirements.txt
pip install -r requirements.txt

# Collect static files (CSS/JS)
python manage.py collectstatic --no-input

# Apply database migrations
python manage.py migrate

if [ -n "$CREATE_SUPERUSER" ]; then
    echo "Creating superuser..."
    # The --noinput flag tells Django to use the DJANGO_SUPERUSER_... environment variables
    python manage.py createsuperuser --noinput
    echo "Superuser creation command executed."
fi