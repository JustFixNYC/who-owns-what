import os
from pathlib import Path
from typing import List
from django.core.exceptions import ImproperlyConfigured
import dj_database_url

try:
    import dotenv
    dotenv.load_dotenv()
except ImportError:
    # We don't have development dependencies installed.
    pass

MY_DIR = Path(__file__).parent.resolve()

BASE_DIR = MY_DIR.parent

def get_required_env(key: str) -> str:
    value = os.environ.get(key)
    if not value:
        raise ImproperlyConfigured(
            f"The environment variable '{key}' "
            f"must be set to a non-empty value! Please see "
            f".env.sample for more documentation."
        )
    return value


DEBUG = os.environ.get('DEBUG') == "true"

SECRET_KEY =  get_required_env('SECRET_KEY')

# TODO: Add Rollbar support!
ROLLBAR = None

# TODO: Figure out if this can securely stay at '*'.
ALLOWED_HOSTS: List[str] = ['*']

ROOT_URLCONF = 'project.urls'

INSTALLED_APPS = [
    'wow.apps.WowConfig',
]

DATABASES = {
    'default': {
        # Django really wants us to define a default connection; we don't
        # need one right now so we'll just use a sqlite DB but not actually
        # use it for anything.
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': str(BASE_DIR / 'db.sqlite3'),
    },
    'wow': dj_database_url.parse(get_required_env('DATABASE_URL')),
}
