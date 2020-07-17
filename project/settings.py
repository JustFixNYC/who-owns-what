import os
from pathlib import Path
from typing import List
import dj_database_url
import dotenv

MY_DIR = Path(__file__).parent.resolve()

BASE_DIR = MY_DIR.parent

dotenv.load_dotenv()

# TODO FIX THIS
ROLLBAR = None

# TODO FIX THIS
SECRET_KEY = "TODO FIX THIS"

# TODO FIX THIS
DEBUG = True

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
    'wow': dj_database_url.parse(os.environ['DATABASE_URL']),
}
