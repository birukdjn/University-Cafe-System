#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status.
set -o errexit

# Install Python dependencies from requirements.txt
python -m pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# Collect static files (CSS/JS)
python manage.py collectstatic --no-input

# Apply database migrations
python manage.py migrate
