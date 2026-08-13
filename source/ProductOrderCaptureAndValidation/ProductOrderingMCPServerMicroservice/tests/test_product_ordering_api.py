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


async def test_downstream_error():
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(500, text="failure")
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with pytest.raises(ProductOrderingAPIError, match="HTTP 500"):
            await ProductOrderingAPI("http://test", client=client).get("productOrder")
    finally:
        await client.aclose()
