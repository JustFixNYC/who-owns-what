def test_hello_works(client):
    res = client.get('/api/hello')
    assert res.status_code == 200
    assert res.content == b"hello world"
