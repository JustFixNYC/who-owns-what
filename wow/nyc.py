from typing import NamedTuple, Optional
import re

BORO_DIGITS = 1

BLOCK_DIGITS = 5

LOT_DIGITS = 4

PAD_BBL_DIGITS = BORO_DIGITS + BLOCK_DIGITS + LOT_DIGITS

PAD_BIN_DIGITS = 7

PAD_BIN_RE = re.compile(r'^[1-5]\d\d\d\d\d\d$')


class BBL(NamedTuple):
    '''
    Encapsulates the Boro, Block, and Lot number for a unit of real estate in NYC:

        https://en.wikipedia.org/wiki/Borough,_Block_and_Lot

    BBLs can be parsed from their padded string representations:

        >>> BBL.parse('2022150116')
        BBL(boro=2, block=2215, lot=116)
    '''

    boro: int
    block: int
    lot: int

    @staticmethod
    def parse(pad_bbl: str) -> 'BBL':
        if len(pad_bbl) != PAD_BBL_DIGITS:
            raise ValueError(f"string should be {PAD_BBL_DIGITS} digits")
        boro = int(pad_bbl[0:BORO_DIGITS])
        block = int(pad_bbl[BORO_DIGITS:BORO_DIGITS + BLOCK_DIGITS])
        lot = int(pad_bbl[BORO_DIGITS + BLOCK_DIGITS:])
        return BBL(boro, block, lot)

    @staticmethod
    def safe_parse(pad_bbl: str) -> Optional['BBL']:
        try:
            return BBL.parse(pad_bbl)
        except ValueError:
            return None


def to_pad_bbl(boro: int, block: int, lot: int) -> str:
    '''
    Convert a boro-block-lot to its zero-padded representation:

        >>> to_pad_bbl(2, 2215, 116)
        '2022150116'
    '''

    return (
        f'{boro}'
        f'{str(block).zfill(BLOCK_DIGITS)}'
        f'{str(lot).zfill(LOT_DIGITS)}'
    )
