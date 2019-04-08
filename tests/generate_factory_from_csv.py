import sys
from pathlib import Path
from typing import TextIO, List
from io import StringIO
import csv


def create_fake_csv_file(lines: List[str]) -> TextIO:
    return StringIO('\n'.join(lines))


def generate_code(csvfile: TextIO, classname: str) -> str:
    '''
    Generate Python code that represents a factory for the
    CSV file, assuming its first row contains headers that
    can be used as Python identifiers, and its second row
    contains data that can be used as default values for
    each column.

    For example, given the following fake CSV file:

        >>> csvfile = create_fake_csv_file([
        ...     'foo,bar',
        ...     'boop,blop'
        ... ])

    We can generate factory code for it like so:

        >>> print(generate_code(csvfile, 'MyFactory'))
        from typing import NamedTuple
        <BLANKLINE>
        <BLANKLINE>
        class MyFactory(NamedTuple):
            foo: str = 'boop'
            bar: str = 'blop'
    '''

    reader = csv.reader(csvfile)
    headings = next(reader)
    first_row = next(reader)
    codelines = [
        f'from typing import NamedTuple\n\n',
        f'class {classname}(NamedTuple):',
    ]
    for (colname, defaultval) in zip(headings, first_row):
        codelines.append(
            f'    {colname}: str = {repr(defaultval)}'
        )
    return '\n'.join(codelines)


def main():
    if len(sys.argv) < 2:
        print(f"usage: {sys.argv[0]} <csvfile>")
        sys.exit(1)
    csvpath = Path(sys.argv[1])
    with csvpath.open() as csvfile:
        print(generate_code(csvfile, csvpath.stem))


if __name__ == '__main__':
    main()
