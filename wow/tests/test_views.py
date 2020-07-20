import pytest


def test_hello_works(client):
    res = client.get('/api/hello')
    assert res.status_code == 200
    assert res.content == b"hello world"


def test_address_query(db, client):
    res = client.get('/api/address?block=01678&lot=0054&borough=3')
    assert res.status_code == 200
    json = res.json()
    assert len(json['addrs']) > 0
    assert json['geosearch'] == {
        'bbl': '3016780054',
        'geosupportReturnCode': '00',
    }
