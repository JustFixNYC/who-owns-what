import logging
from django.core.management.base import BaseCommand

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Raise a test error to make sure manage.py error reporting works."

    def add_arguments(self, parser):
        parser.add_argument("id")

    def handle(self, *args, **options):
        id = options["id"]
        logger.error(
            f"This is an example management command log message with id '{id}'. "
            f"If you can read this, it means errors from the logging system "
            f"are being reported properly from management commands."
        )
        raise Exception(
            f"This is an example management command exception with id '{id}'. "
            f"If you can read this, it means unexpected management command "
            f"errors are being reported properly."
        )
