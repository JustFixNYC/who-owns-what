import pandas as pd
import multiprocessing
import functools
import sys
import usaddress



def parse_address(addr):
    """parses full address string and returns dict of address components needed for geocoding

    Args:
        addr (str): full street address

    Returns:
        dict: dict of strings for house_number, street_name, borough_code, and place_name
    """
    try:
        tags, _ = usaddress.tag(addr)
        house_number = ' '.join([v for k, v in tags.items() if k.startswith('AddressNumber')])
        street_name = ' '.join([v for k, v in tags.items() if k.startswith('StreetName')])
        # unit_type = ' '.join([v for k, v in tags.items() if k.startswith('OccupancyType')])
        # unit_no = ' '.join([v for k, v in tags.items() if k.startswith('OccupancyIdentifier')])
        place_name = tags.get('PlaceName', '')
    except usaddress.RepeatedLabelError as e :
        tags = e.parsed_string
        house_number = ' '.join([x[0] for x in tags if x[1].startswith('AddressNumber')])
        street_name = ' '.join([x[0] for x in tags if x[1].startswith('StreetName')])
        # unit_type = ' '.join([x[0] for x in tags if x[1].startswith('OccupancyType')])
        # unit_no = ' '.join([x[0] for x in tags if x[1].startswith('OccupancyIdentifier')])
        place_name = ' '.join([x[0] for x in tags if x[1] == 'PlaceName'])
    return dict(
        house_number = house_number,
        street_name = street_name,
        place_name = place_name,
        # unit_type = unit_type,
        # unit_no = unit_no
    )

def clean_addresses(input, addr_col):
        addr_args = parse_address(input[addr_col])
        ret = input
        ret.update(addr_args)
        return ret

df = pd.read_csv(
    'Registration_Contacts.csv', 
    dtype = str,
    index_col = False, 
    keep_default_na=False
)

df_addr = df.assign(
    address = lambda df : df.BusinessHouseNumber + ' ' + df.BusinessStreetName + ', ' + df.BusinessCity + ', ' + df.BusinessZip + ' ' + df.BusinessState
)

records = df_addr.to_dict('records')

print(records[10])

# with multiprocessing.Pool(processes=multiprocessing.cpu_count()) as pool:
#     it = pool.map(functools.partial(clean_addresses, addr_col='address'), records, 10000)
    
# pd.DataFrame(it).to_csv('hpd_contacts_clean2.csv', index=False)