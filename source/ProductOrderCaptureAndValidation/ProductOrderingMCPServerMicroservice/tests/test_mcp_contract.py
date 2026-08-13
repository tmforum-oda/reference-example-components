from product_ordering_mcp_server import mcp


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
