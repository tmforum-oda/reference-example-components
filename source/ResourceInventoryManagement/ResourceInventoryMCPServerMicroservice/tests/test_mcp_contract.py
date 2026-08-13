from __future__ import annotations

import pytest

import resource_inventory_mcp_server as server


@pytest.mark.asyncio
async def test_phase_zero_tool_contract() -> None:
    tools = await server.mcp.list_tools()
    by_name = {tool.name: tool for tool in tools}
    assert set(by_name) == {
        "resource_get",
        "resource_create",
        "resource_update",
        "resource_delete",
    }
    get_schema = by_name["resource_get"].inputSchema
    assert "resource_id" not in get_schema.get("required", [])
    assert "filter" not in get_schema.get("required", [])
    create_schema = by_name["resource_create"].inputSchema
    assert create_schema["required"] == ["resource_data"]
    assert create_schema["$defs"]["ResourceFVO"]["required"] == ["name"]


@pytest.mark.asyncio
async def test_resource_get_delegates_to_owned_api(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = []

    async def fake_get(resource_id, **kwargs):
        calls.append((resource_id, kwargs))
        return [{"externalId": "WS-PROD-1001"}]

    monkeypatch.setattr(server.api, "get_resource", fake_get)

    result = await server.resource_get(filter={"externalId": "WS-PROD-1001"})

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
