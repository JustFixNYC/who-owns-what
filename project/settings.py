import os
from pathlib import Path
from typing import List, Optional, Dict, Any
from django.core.exceptions import ImproperlyConfigured
from corsheaders.defaults import default_headers
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


DEBUG = os.environ.get("DEBUG") == "true"

SECRET_KEY = get_required_env("SECRET_KEY")

ALERTS_API_TOKEN = get_required_env("ALERTS_API_TOKEN")

SIGNATURE_API_TOKEN = get_required_env("SIGNATURE_API_TOKEN")

# TODO: Figure out if this can securely stay at '*'.
ALLOWED_HOSTS: List[str] = ["*"]

ROOT_URLCONF = "project.urls"

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "project.apps.DefaultConfig",
    "wow.apps.WowConfig",
    "corsheaders",
]

MIDDLEWARE: List[str] = [
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.gzip.GZipMiddleware",
]

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

DATABASES = {
    "default": {
        # Django really wants us to define a default connection; we don't
        # need one right now so we'll just use a sqlite DB but not actually
        # use it for anything.
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": str(BASE_DIR / "db.sqlite3"),
    },
    "wow": dj_database_url.parse(get_required_env("DATABASE_URL")),
}
CORS_ALLOW_HEADERS = default_headers + ("Access-Control-Allow-Origin", "Set-Cookie")
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "https://demo-wowserver.justfix.org",
    "https://wow-django-dev.herokuapp.com",
    "https://wowserver.justfix.org",
    "https://wow-django.herokuapp.com",
    "https://whoownswhat.justfix.org",
    "https://demo-whoownswhat.justfix.org",
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"https://\w+\.deploy-preview-(?:\d{1,4})--wow-django-dev\.netlify\.app",
    r"https://deploy-preview-(?:\d{1,4})--wow-django-dev\.netlify\.app",
]

# This is based off the default Django logging configuration:
# https://github.com/django/django/blob/master/django/utils/log.py
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "rollbar": {
            # This will be replaced by a real handler if Rollbar is enabled.
            "level": "ERROR",
            "class": "logging.NullHandler",
        },
        "console": {
            "class": "logging.StreamHandler",
            "formatter": None,
        },
        "django.server": {
            "level": "INFO",
            "class": "logging.StreamHandler",
            "formatter": "django.server",
        },
    },
    "formatters": {
        "debug": {
            "format": "{levelname}:{name} {message}",
            "style": "{",
        },
        "django.server": {
            "()": "django.utils.log.ServerFormatter",
            "format": "[{server_time}] {message}",
            "style": "{",
        },
    },
    "loggers": {
        "": {
            "handlers": ["console", "rollbar"],
            "level": "INFO",
        },
        "django": {
            "handlers": ["console"],
            "level": "INFO",
            "propagate": False,
        },
        "django.server": {
            "handlers": ["django.server"],
            "level": "INFO",
            "propagate": False,
        },
    },
}

ROLLBAR: Optional[Dict[str, Any]] = None

ROLLBAR_ACCESS_TOKEN = os.environ.get("ROLLBAR_ACCESS_TOKEN")

if ROLLBAR_ACCESS_TOKEN:
    ROLLBAR = {
        "access_token": ROLLBAR_ACCESS_TOKEN,
        "environment": "development" if DEBUG else "production",
        "root": str(BASE_DIR),
    }
    if "HEROKU_SLUG_COMMIT" in os.environ:
        # https://devcenter.heroku.com/articles/dyno-metadata
        ROLLBAR["code_version"] = os.environ["HEROKU_SLUG_COMMIT"]
    LOGGING["handlers"]["rollbar"].update(  # type: ignore
        {"class": "rollbar.logger.RollbarHandler"}
    )
    MIDDLEWARE.append(
        "rollbar.contrib.django.middleware.RollbarNotifierMiddlewareExcluding404"
    )

AUTHENTICATION_BACKENDS = ("django.contrib.auth.backends.ModelBackend",)
