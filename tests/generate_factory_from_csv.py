'''
    This script can be used to generate NamedTuple-based
    factories for CSV rows.

    Usage:

        generate_factory_from_csv.py <csvfile>

    This will output Python code that contains a
    NamedTuple subclass for the CSV, where the property
    names are taken from the first row of the CSV,
    and the default values are taken from the second row.
'''

import sys
import re
from pathlib import Path
from typing import TextIO, List, IO, Any
from io import StringIO
import csv


def create_fake_csv_file(lines: List[str]) -> TextIO:
    return StringIO('\n'.join(lines))


def munge_colname(colname: str) -> str:
    '''
    Munge the given column name so it can be an attribute
    in a NamedTuple, e.g.:

        >>> munge_colname('boop')
        'boop'
        >>> munge_colname('421a')
        'PY_421a'
    '''

    if not re.match(r'^[A-Za-z]', colname):
        colname = 'PY_' + colname
    return colname


def unmunge_colname(colname: str) -> str:
    '''
    Un-munge any munging done by munge_colname(), e.g.:

        >>> unmunge_colname('boop')
        'boop'
        >>> unmunge_colname('PY_421a')
        '421a'
    '''

    if colname.startswith('PY_'):
        return colname[3:]
    return colname


def generate_code(csvfile: IO[Any], classname: str) -> str:
    '''
    Generate Python code that represents a factory for the
    CSV file, assuming its first row contains headers that
    can be used as Python identifiers, and its second row
    contains data that can be used as default values for
    each column.

    For example, given the following fake CSV file:

        >>> csvfile = create_fake_csv_file([
        ...     'foo,3bar',
        ...     'boop,blop'
        ... ])

    We can generate factory code for it like so:

        >>> print(generate_code(csvfile, 'MyFactory'))
        from typing import NamedTuple
        <BLANKLINE>
        <BLANKLINE>
        class MyFactory(NamedTuple):
            foo: str = 'boop'
            PY_3bar: str = 'blop'

    Note that any columns beginning with a number are prefixed
    with 'PY_' to make it a valid Python identifier (we can't
    prefix it with an underscore because NamedTuples don't
    allow this, so 'PY_' it is).
    '''

    reader = csv.reader(csvfile)
    headings = next(reader)
    first_row = next(reader)
    codelines = [
        f'from typing import NamedTuple\n\n',
        f'class {classname}(NamedTuple):',
    ]
    for (colname, defaultval) in zip(headings, first_row):
        colname = munge_colname(colname)
        codelines.append(
            f'    {colname}: str = {repr(defaultval)}'
        )
    return '\n'.join(codelines)


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ['-h', '--help']:
        print(__doc__)
        sys.exit(1)
    csvpath = Path(sys.argv[1])
    with csvpath.open() as csvfile:
        print(generate_code(csvfile, csvpath.stem))


if __name__ == '__main__':
    main()
