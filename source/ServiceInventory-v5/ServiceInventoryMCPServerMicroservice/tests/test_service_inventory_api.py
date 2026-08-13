import httpx

from service_inventory_api import ServiceInventoryAPI, ServiceInventoryAPIError


async def test_get_omits_unset_optional_parameters():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/service"
        assert not request.url.query
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://test")
    api = ServiceInventoryAPI("http://test", client=client)
    try:
        assert await api.get_service() == []
    finally:
        await client.aclose()


async def test_downstream_errors_raise_safe_exception():
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="downstream failure")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler), base_url="http://test")
    api = ServiceInventoryAPI("http://test", client=client)
    try:
        try:
            await api.get_service()
        except ServiceInventoryAPIError as exc:
            assert "HTTP 500" in str(exc)
        else:
            raise AssertionError("expected ServiceInventoryAPIError")
    finally:
        await client.aclose()
