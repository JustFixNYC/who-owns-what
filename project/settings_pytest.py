import os
import copy
import dj_database_url

os.environ['DEBUG'] = ''
os.environ['SECRET_KEY'] = "for testing only!"

from .settings import *

DATABASES = copy.deepcopy(DATABASES)

if 'TEST_DATABASE_URL' in os.environ:
    DATABASES['wow'] = dj_database_url.parse(os.environ['TEST_DATABASE_URL'])

# We want the test database Django uses to be separate from the one used
# by our non-Django tests, because (at the time of this writing) we want to
# be able to load fixture data into it that's scoped to the whole testing
# session.
DATABASES['wow']['TEST'] = {'NAME': DATABASES['wow']['NAME'] + '_djangotest'}
