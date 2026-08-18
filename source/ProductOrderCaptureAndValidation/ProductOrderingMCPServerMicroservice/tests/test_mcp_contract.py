import pytest

import product_ordering_mcp_server as server
from product_ordering_api import ProductOrderingAPIError


mcp = server.mcp


async def test_exact_workshop_tools():
    assert [tool.name for tool in await mcp.list_tools()] == [
        "product_order_get", "product_order_create", "product_order_update",
        "product_order_delete", "cancel_product_order_get", "cancel_product_order_create",
    ]


async def test_create_required_fields():
    by_name = {tool.name: tool for tool in await mcp.list_tools()}
    order = by_name["product_order_create"].inputSchema["$defs"]["ProductOrderCreate"]
    cancel = by_name["cancel_product_order_create"].inputSchema["$defs"]["CancelProductOrderCreate"]
    assert order["required"] == ["productOrderItem"]
    assert cancel["required"] == ["productOrder"]


async def test_get_ids_are_optional():
    for tool in await mcp.list_tools():
        if tool.name.endswith("_get"):
            assert not tool.inputSchema.get("required")
            assert "fields" not in tool.inputSchema["properties"]
            assert "filter" not in tool.inputSchema["properties"]
            assert {"external_id", "state"}.issubset(tool.inputSchema["properties"])
            state_schema = tool.inputSchema["properties"]["state"]
            state_values = next(item["enum"] for item in state_schema["anyOf"] if "enum" in item)
            assert "all" not in state_values


async def test_product_order_get_delegates_semantic_filters(
    monkeypatch: pytest.MonkeyPatch,
):
    calls = []

    async def fake_get(resource, resource_id, **kwargs):
        calls.append((resource, resource_id, kwargs))
        return [{"externalId": "PO-1001"}]

    monkeypatch.setattr(server.api, "get", fake_get)
    result = await server.product_order_get(
        external_id="PO-1001", state="completed"
    )

    assert result == [{"externalId": "PO-1001"}]
    assert calls[0][2]["external_id"] == "PO-1001"
    assert calls[0][2]["state"] == "completed"


async def test_product_order_get_returns_structured_not_found(
    monkeypatch: pytest.MonkeyPatch,
):
    async def fake_get(*args, **kwargs):
        raise ProductOrderingAPIError("HTTP 404", 404)

    monkeypatch.setattr(server.api, "get", fake_get)
    result = await server.product_order_get(product_order_id="missing-id")
    assert result["error"]["status"] == 404
