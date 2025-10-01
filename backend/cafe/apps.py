from django.apps import AppConfig


class CafeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cafe'
    
    def ready(self):
        # Import signals to ensure handlers (e.g., create UserProfile on User creation) are registered
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass
    
    def ready(self):
        # Import signals to ensure UserProfile is created for new users
        try:
            from . import signals  # noqa: F401
        except Exception:
            pass
