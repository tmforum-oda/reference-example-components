from service_qualification_mcp_server import mcp


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
