'''
    This script can be used to bulk generate NamedTuple-based
    factories for CSV rows, by taking all CSV files in `/tests/data`
    and placing factories for them in `/tests/factories`.

    Usage:

        python generate_all_factories.py

    See `generate_factory_from_csv.py` for more details on
    how the factories are created from the CSV files.
'''

from pathlib import Path
import re

from generate_factory_from_csv import (
    generate_code_for_file,
    hyphens_to_underscores,
)


MY_DIR = Path(__file__).parent.resolve()

DATA_DIR = MY_DIR / 'data'

FACTORIES_DIR = MY_DIR / 'factories'


def main():
    for csvfile in DATA_DIR.glob('*.csv'):
        code = generate_code_for_file(csvfile)
        filename = hyphens_to_underscores(csvfile.stem) + ".py"
        abs_filename = FACTORIES_DIR / filename
        print(f"Writing {abs_filename}.")
        abs_filename.write_text(code + "\n")


if __name__ == "__main__":
    main()
