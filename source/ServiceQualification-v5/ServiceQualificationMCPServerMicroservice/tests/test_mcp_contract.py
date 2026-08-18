import pytest

import service_qualification_mcp_server as server
from service_qualification_api import ServiceQualificationAPIError


mcp = server.mcp


async def test_exact_workshop_tool_catalogue():
    assert [tool.name for tool in await mcp.list_tools()] == [
        "check_service_qualification_get", "check_service_qualification_create",
        "check_service_qualification_update", "check_service_qualification_delete",
        "query_service_qualification_get", "query_service_qualification_create",
        "query_service_qualification_update", "query_service_qualification_delete",
    ]


async def test_create_schemas_expose_required_fields():
    by_name = {tool.name: tool for tool in await mcp.list_tools()}
    check = by_name["check_service_qualification_create"].inputSchema["$defs"]["CheckServiceQualificationFVO"]
    query = by_name["query_service_qualification_create"].inputSchema["$defs"]["QueryServiceQualificationFVO"]
    assert set(check["required"]) == {"@type", "serviceQualificationItem"}
    assert set(query["required"]) == {"@type", "searchCriteria"}


async def test_get_ids_are_optional():
    for tool in await mcp.list_tools():
        if tool.name.endswith("_get"):
            assert "qualification_id" not in tool.inputSchema.get("required", [])
            assert "fields" not in tool.inputSchema["properties"]
            assert "filter" not in tool.inputSchema["properties"]
            assert {"external_id", "state"}.issubset(tool.inputSchema["properties"])
            state_schema = tool.inputSchema["properties"]["state"]
            state_values = next(item["enum"] for item in state_schema["anyOf"] if "enum" in item)
            assert "done" in state_values
            assert "all" not in state_values


async def test_get_delegates_semantic_filters(monkeypatch: pytest.MonkeyPatch):
    calls = []

    async def fake_get(resource, resource_id, **kwargs):
        calls.append((resource, resource_id, kwargs))
        return [{"externalId": "WS-QUAL-1001"}]

    monkeypatch.setattr(server.api, "get", fake_get)
    result = await server.query_service_qualification_get(
        external_id="WS-QUAL-1001", state="done"
    )

    assert result == [{"externalId": "WS-QUAL-1001"}]
    assert calls[0][2]["external_id"] == "WS-QUAL-1001"
    assert calls[0][2]["state"] == "done"


async def test_get_returns_structured_not_found(monkeypatch: pytest.MonkeyPatch):
    async def fake_get(*args, **kwargs):
        raise ServiceQualificationAPIError("HTTP 404", 404)

    monkeypatch.setattr(server.api, "get", fake_get)
    result = await server.query_service_qualification_get(
        qualification_id="missing-id"
    )
    assert result["error"]["status"] == 404
