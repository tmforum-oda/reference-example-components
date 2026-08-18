import httpx
import pytest
from product_ordering_api import ProductOrderingAPI, ProductOrderingAPIError


async def test_get_omits_optional_args():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/productOrder"
        assert not request.url.query
        return httpx.Response(200, json=[])
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        assert await ProductOrderingAPI("http://test", client=client).get("productOrder") == []
    finally:
        await client.aclose()


async def test_cancel_path():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/cancelProductOrder/1"
        return httpx.Response(200, json={"id": "1"})
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        await ProductOrderingAPI("http://test", client=client).get("cancelProductOrder", "1")
    finally:
        await client.aclose()


async def test_semantic_order_filters_are_translated():
    captured: httpx.Request | None = None

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured
        captured = request
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ProductOrderingAPI("http://test", client=client)
    try:
        await api.get("productOrder", external_id="PO-1001", state="completed")
        assert captured is not None
        assert dict(captured.url.params) == {
            "externalId": "PO-1001",
            "state": "completed",
        }
    finally:
        await client.aclose()


async def test_id_cannot_be_combined_with_filters():
    async def handler(_: httpx.Request) -> httpx.Response:
        raise AssertionError("No request should be made")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ProductOrderingAPI("http://test", client=client)
    try:
        with pytest.raises(ProductOrderingAPIError, match="cannot be combined"):
            await api.get("productOrder", "api-id", state="completed")
    finally:
        await client.aclose()


async def test_downstream_error():
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="failure")
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with pytest.raises(ProductOrderingAPIError, match="HTTP 500") as error:
            await ProductOrderingAPI("http://test", client=client).get("productOrder")
        assert error.value.status_code == 500
    finally:
        await client.aclose()
