from __future__ import annotations

import pytest

import resource_inventory_mcp_server as server
from resource_inventory_api import ResourceInventoryAPIError


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
    assert "filter" not in get_schema["properties"]
    assert set(get_schema["properties"]) == {
        "resource_id",
        "workshop_id",
        "resource_name",
        "resource_type",
        "location_id",
        "resource_status",
        "offset",
        "limit",
    }
    assert "fields" not in get_schema["properties"]
    status_schema = get_schema["properties"]["resource_status"]
    status_values = next(item["enum"] for item in status_schema["anyOf"] if "enum" in item)
    assert "available" in status_values
    assert "all" not in status_values
    create_schema = by_name["resource_create"].inputSchema
    assert create_schema["required"] == ["resource_data"]
    assert create_schema["$defs"]["ResourceFVO"]["required"] == ["name"]


@pytest.mark.asyncio
async def test_resource_get_delegates_to_owned_api(monkeypatch: pytest.MonkeyPatch) -> None:
    calls = []

    async def fake_get(resource_id, **kwargs):
        calls.append((resource_id, kwargs))
        return [{"name": "Accelerate Asia Edge Router"}]

    monkeypatch.setattr(server.api, "get_resource", fake_get)

    result = await server.resource_get(workshop_id="WS-RES-1001")

    assert result == [{"name": "Accelerate Asia Edge Router"}]
    assert calls == [
        (
            None,
            {
                "workshop_id": "WS-RES-1001",
                "resource_name": None,
                "resource_type": None,
                "location_id": None,
                "resource_status": None,
                "offset": None,
                "limit": None,
            },
        )
    ]


@pytest.mark.asyncio
async def test_resource_get_returns_structured_not_found(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_get(*args, **kwargs):
        raise ResourceInventoryAPIError("downstream returned HTTP 404", 404)

    monkeypatch.setattr(server.api, "get_resource", fake_get)

    result = await server.resource_get(resource_id="missing-api-id")

    assert result == {
        "error": {
            "status": 404,
            "detail": (
                "No resource was found for the supplied API-generated resource_id."
            ),
        }
    }


@pytest.mark.asyncio
async def test_generic_router_name_is_normalized_to_resource_type(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    calls = []

    async def fake_get(resource_id, **kwargs):
        calls.append((resource_id, kwargs))
        return [{"name": "Accelerate Asia Edge Router"}]

    monkeypatch.setattr(server.api, "get_resource", fake_get)

    await server.resource_get(resource_name="router resources")

    assert calls[0][1]["resource_name"] is None
    assert calls[0][1]["resource_type"] == "Router"


def test_resource_get_schema_contains_argument_guidance() -> None:
    async def schema():
        tool = next(tool for tool in await server.mcp.list_tools() if tool.name == "resource_get")
        return tool.inputSchema

    import asyncio

    input_schema = asyncio.run(schema())
    assert "Exact full resource name" in input_schema["properties"]["resource_name"]["description"]
    assert "Omit for a general" in input_schema["properties"]["location_id"]["description"]
    assert "multiple statuses" in input_schema["properties"]["resource_status"]["description"]
