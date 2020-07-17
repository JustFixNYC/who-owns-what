from typing import List

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
