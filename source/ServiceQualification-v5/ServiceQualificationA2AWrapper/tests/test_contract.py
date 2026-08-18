import json

import pytest

import a2a_server as server


def test_qualification_selection_is_bounded():
    available = {"check_service_qualification_get", "query_service_qualification_get", "query_service_qualification_create"}
    assert server.select_tool("qualification", "show WS-QUAL-1001", available) == ("query_service_qualification_get", {"external_id": "WS-QUAL-1001"})


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


def test_structured_mcp_error_is_not_treated_as_success():
    with pytest.raises(server.DependencyResultError) as error:
        server._raise_for_structured_error(
            {"error": {"status": 404, "detail": "Qualification not found"}}
        )
    assert error.value.status == 404


@pytest.mark.asyncio
async def test_dependency_not_found_becomes_a2a_not_found_task(monkeypatch):
    async def fake_invoke(_query):
        raise server.DependencyResultError("Qualification not found", 404)

    monkeypatch.setattr(server, "invoke", fake_invoke)
    response = await server.a2a(
        {
            "jsonrpc": "2.0",
            "id": "request-1",
            "method": "message/send",
            "params": {
                "message": {"parts": [{"kind": "text", "text": "show missing"}]}
            },
        }
    )
    body = json.loads(response.body)
    assert response.status_code == 200
    assert body["result"]["status"]["state"] == "not-found"
