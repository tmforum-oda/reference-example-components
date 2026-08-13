from service_inventory_mcp_server import mcp


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


async def test_create_schema_exposes_required_tmf_fields():
    tool = next(tool for tool in await mcp.list_tools() if tool.name == "service_create")
    schema = tool.inputSchema["$defs"]["ServiceFVO"]
    assert set(schema["required"]) == {"@type", "state", "serviceSpecification"}
