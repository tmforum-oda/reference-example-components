import httpx
import pytest

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


async def test_get_translates_semantic_inventory_filters():
    captured: httpx.Request | None = None

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured
        captured = request
        return httpx.Response(200, json=[{"id": "generated-id"}])

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ServiceInventoryAPI("https://inventory.test/v5", client=client)

    result = await api.get_service(customer_id="CUST-1001", state="active")

    assert result == [{"id": "generated-id"}]
    assert captured is not None
    assert captured.url.path == "/v5/service"
    assert dict(captured.url.params) == {
        "serviceCharacteristic.name": "customerId",
        "serviceCharacteristic.value": "CUST-1001",
        "state": "active",
    }
    await client.aclose()


async def test_get_translates_workshop_id_filter():
    captured: httpx.Request | None = None

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured
        captured = request
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ServiceInventoryAPI("https://inventory.test/v5", client=client)

    await api.get_service(workshop_id="WS-SVC-1001")

    assert captured is not None
    assert dict(captured.url.params) == {
        "serviceCharacteristic.name": "workshopId",
        "serviceCharacteristic.value": "WS-SVC-1001",
    }
    await client.aclose()


async def test_service_id_cannot_be_combined_with_list_filters():
    async def handler(_: httpx.Request) -> httpx.Response:
        raise AssertionError("No request should be made")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ServiceInventoryAPI("https://inventory.test/v5", client=client)

    with pytest.raises(ServiceInventoryAPIError, match="cannot be combined"):
        await api.get_service("api-id", state="active")
    await client.aclose()


async def test_workshop_and_customer_filters_cannot_be_combined():
    async def handler(_: httpx.Request) -> httpx.Response:
        raise AssertionError("No request should be made")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ServiceInventoryAPI("https://inventory.test/v5", client=client)

    with pytest.raises(ServiceInventoryAPIError, match="cannot be combined"):
            await api.get_service(
                workshop_id="WS-SVC-1001",
                customer_id="CUST-1001",
        )
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
            assert exc.status_code == 500
        else:
            raise AssertionError("expected ServiceInventoryAPIError")
    finally:
        await client.aclose()
