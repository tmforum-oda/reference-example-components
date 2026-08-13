from __future__ import annotations

import pytest

import product_inventory_mcp_server as server


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

    result = await server.product_get(filter={"externalId": "WS-PROD-1001"})

    assert result == [{"externalId": "WS-PROD-1001"}]
    assert calls == [
        (
            None,
            {
                "fields": None,
                "offset": None,
                "limit": None,
                "filter": {"externalId": "WS-PROD-1001"},
            },
        )
    ]
