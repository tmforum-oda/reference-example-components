import a2a_server as server


def test_qualification_selection_is_bounded():
    available = {"check_service_qualification_get", "query_service_qualification_get", "query_service_qualification_create"}
    assert server.select_tool("qualification", "show WS-QUAL-1001", available) == ("query_service_qualification_get", {"filter": {"externalId": "WS-QUAL-1001"}})


def test_order_never_selects_mutation():
    tool, _ = server.select_tool("order", "show status for PO-1001", {"product_order_get", "product_order_create"})
    assert tool == "product_order_get"
    tool, _ = server.select_tool("order", "show cancel order status PO-1001", {"cancel_product_order_get"})
    assert tool == "cancel_product_order_get"


def test_qualification_create_requires_json():
    try:
        server.select_tool("qualification", "create a qualification", {"query_service_qualification_create"})
    except ValueError as exc:
        assert "JSON payload" in str(exc)
    else:
        raise AssertionError("expected ValueError")
