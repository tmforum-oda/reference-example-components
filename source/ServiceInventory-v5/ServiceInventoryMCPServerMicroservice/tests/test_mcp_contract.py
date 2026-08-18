import pytest

import service_inventory_mcp_server as server
from service_inventory_api import ServiceInventoryAPIError


mcp = server.mcp


async def test_exact_workshop_tool_catalogue():
    tools = await mcp.list_tools()
    assert [tool.name for tool in tools] == [
        "service_get",
        "service_create",
        "service_update",
        "service_delete",
    ]


async def test_optional_get_arguments_are_nullable():
    tool = next(tool for tool in await mcp.list_tools() if tool.name == "service_get")
    assert tool.inputSchema.get("required", []) == []
    assert set(tool.inputSchema["properties"]) == {
        "service_id",
        "workshop_id",
        "customer_id",
        "state",
        "offset",
        "limit",
    }
    assert "fields" not in tool.inputSchema["properties"]
    state_schema = tool.inputSchema["properties"]["state"]
    state_values = next(item["enum"] for item in state_schema["anyOf"] if "enum" in item)
    assert "active" in state_values
    assert "all" not in state_values


async def test_create_schema_exposes_required_tmf_fields():
    tool = next(tool for tool in await mcp.list_tools() if tool.name == "service_create")
    schema = tool.inputSchema["$defs"]["ServiceFVO"]
    assert set(schema["required"]) == {"@type", "state", "serviceSpecification"}


async def test_service_get_delegates_semantic_filters(
    monkeypatch: pytest.MonkeyPatch,
):
    captured = {}

    async def fake_get_service(service_id=None, **kwargs):
        captured["service_id"] = service_id
        captured.update(kwargs)
        return [{"id": "generated-id"}]

    monkeypatch.setattr(server.api, "get_service", fake_get_service)

    result = await server.service_get(
        workshop_id="WS-SVC-1001",
        state="active",
        limit=10,
    )

    assert result == [{"id": "generated-id"}]
    assert captured == {
        "service_id": None,
        "workshop_id": "WS-SVC-1001",
        "customer_id": None,
        "state": "active",
        "offset": None,
        "limit": 10,
    }


async def test_service_get_returns_structured_not_found(
    monkeypatch: pytest.MonkeyPatch,
):
    async def fake_get_service(*args, **kwargs):
        raise ServiceInventoryAPIError("downstream returned HTTP 404", 404)

    monkeypatch.setattr(server.api, "get_service", fake_get_service)

    result = await server.service_get(service_id="missing-api-id")

    assert result == {
        "error": {
            "status": 404,
            "detail": (
                "No service instance was found for the supplied "
                "API-generated service_id."
            ),
        }
    }


async def test_service_get_preserves_non_404_errors(
    monkeypatch: pytest.MonkeyPatch,
):
    async def fake_get_service(*args, **kwargs):
        raise ServiceInventoryAPIError("downstream returned HTTP 500", 500)

    monkeypatch.setattr(server.api, "get_service", fake_get_service)

    with pytest.raises(ServiceInventoryAPIError, match="HTTP 500"):
        await server.service_get(service_id="api-id")
