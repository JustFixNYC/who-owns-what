#!/usr/bin/env python
import os
import sys

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project.settings")
    try:
        os.environ.setdefault("DDM_CONTAINER_NAME", "app")
        from docker_django_management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc

    from django.conf import settings

    # We often run management commands in production and want their
    # errors reported via Rollbar.
    if settings.ROLLBAR:
        import rollbar

        rollbar.init(**settings.ROLLBAR)
        try:
            execute_from_command_line(sys.argv)
            rollbar.wait()
        except Exception:
            sys.stderr.write("An exception occurred, reporting it to Rollbar...\n")
            rollbar.report_exc_info()
            rollbar.wait()
            raise
    else:
        execute_from_command_line(sys.argv)
