from pathlib import Path
from typing import List


class GoodCauseConfig:
    def __init__(
        self,
        sql_dir: Path,
        sql_files: List[str],
    ):
        self.sql_files = [sql_dir / f for f in sql_files]
        self.sql_dir = sql_dir


def populate_tables(wow_cur, config: GoodCauseConfig):
    print(f"Creating Good Cause Eviction tables")
    for f in config.sql_files:
        sql = f.read_text()
        wow_cur.execute(sql)
