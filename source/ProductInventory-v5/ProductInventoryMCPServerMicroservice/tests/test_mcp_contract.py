from __future__ import annotations

import pytest

import product_inventory_mcp_server as server
from product_inventory_api import ProductInventoryAPIError


@pytest.mark.asyncio
async def test_phase_zero_tool_contract() -> None:
    tools = await server.mcp.list_tools()
    by_name = {tool.name: tool for tool in tools}
    assert set(by_name) == {
        "product_get",
        "product_create",
        "product_update",
        "product_delete",
    }
    get_schema = by_name["product_get"].inputSchema
    assert "product_id" not in get_schema.get("required", [])
    assert "filter" not in get_schema.get("required", [])
    assert "fields" not in get_schema["properties"]
    assert {
        "product_serial_number",
        "customer_id",
        "status",
    }.issubset(get_schema["properties"])
    create_schema = by_name["product_create"].inputSchema
    assert create_schema["required"] == ["product_data"]
    assert create_schema["$defs"]["ProductFVO"]["required"] == ["@type"]


@pytest.mark.asyncio
async def test_product_get_delegates_to_owned_api(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = []

    async def fake_get(product_id, **kwargs):
        calls.append((product_id, kwargs))
        return [{"externalId": "WS-PROD-1001"}]

    monkeypatch.setattr(server.api, "get_product", fake_get)

    result = await server.product_get(
        product_serial_number="WS-PROD-1001",
        customer_id="CUST-1001",
        status="active",
    )

    assert result == [{"externalId": "WS-PROD-1001"}]
    assert calls == [
        (
            None,
            {
                "product_serial_number": "WS-PROD-1001",
                "customer_id": "CUST-1001",
                "status": "active",
                "offset": None,
                "limit": None,
                "filter": None,
            },
        )
    ]


@pytest.mark.asyncio
async def test_product_get_returns_structured_not_found(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_get(product_id, **kwargs):
        raise ProductInventoryAPIError("downstream returned HTTP 404", 404)

    monkeypatch.setattr(server.api, "get_product", fake_get)

    result = await server.product_get(product_id="missing-api-id")

    assert result == {
        "error": {
            "status": 404,
            "detail": (
                "No installed product was found for the supplied "
                "API-generated product_id."
            ),
        }
    }


@pytest.mark.asyncio
async def test_product_get_preserves_non_404_dependency_errors(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_get(product_id, **kwargs):
        raise ProductInventoryAPIError("downstream returned HTTP 500", 500)

    monkeypatch.setattr(server.api, "get_product", fake_get)

    with pytest.raises(ProductInventoryAPIError, match="HTTP 500"):
        await server.product_get(product_id="api-id")
