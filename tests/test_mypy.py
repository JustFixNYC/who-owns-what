from pathlib import Path
import subprocess


ROOT_DIR = Path(__file__).parent.parent.resolve()


def test_mypy():
    subprocess.check_call([
        'mypy',
        str(ROOT_DIR / 'dbtool.py'),
        str(ROOT_DIR / 'tests')
    ])
