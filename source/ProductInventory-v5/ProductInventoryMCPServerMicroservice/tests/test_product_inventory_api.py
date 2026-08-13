from __future__ import annotations

import httpx
import pytest

from product_inventory_api import ProductInventoryAPI, ProductInventoryAPIError


@pytest.mark.asyncio
async def test_get_omits_unset_optional_arguments_and_applies_filter() -> None:
    captured: httpx.Request | None = None

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured
        captured = request
        return httpx.Response(200, json=[{"id": "generated-id"}])

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ProductInventoryAPI("https://inventory.test/v5", client=client)

    result = await api.get_product(filter={"externalId": "WS-PROD-1001"})

    assert result == [{"id": "generated-id"}]
    assert captured is not None
    assert captured.url.path == "/v5/product"
    assert dict(captured.url.params) == {"externalId": "WS-PROD-1001"}
    await client.aclose()


@pytest.mark.asyncio
async def test_retrieve_uses_product_id_path() -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/v5/product/api-id"
        return httpx.Response(200, json={"id": "api-id"})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ProductInventoryAPI("https://inventory.test/v5", client=client)

    assert await api.get_product("api-id") == {"id": "api-id"}
    await client.aclose()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("method", "operation", "expected_path"),
    [
        ("POST", "create", "/v5/product"),
        ("PATCH", "update", "/v5/product/api-id"),
        ("DELETE", "delete", "/v5/product/api-id"),
    ],
)
async def test_mutating_operations_use_expected_http_method(
    method: str, operation: str, expected_path: str
) -> None:
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == method
        assert request.url.path == expected_path
        if method == "DELETE":
            return httpx.Response(204)
        return httpx.Response(200, json={"id": "api-id"})

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ProductInventoryAPI("https://inventory.test/v5", client=client)

    if operation == "create":
        result = await api.create_product({"@type": "Product"})
    elif operation == "update":
        result = await api.update_product("api-id", {"status": "active"})
    else:
        result = await api.delete_product("api-id")

    assert result == ({"success": True} if method == "DELETE" else {"id": "api-id"})
    await client.aclose()


@pytest.mark.asyncio
async def test_downstream_error_is_raised_for_mcp_is_error_semantics() -> None:
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(422, text="schema validation failed")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ProductInventoryAPI("https://inventory.test/v5", client=client)

    with pytest.raises(ProductInventoryAPIError, match="HTTP 422"):
        await api.create_product({})
    await client.aclose()
