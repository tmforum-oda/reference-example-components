import httpx
import pytest

from service_qualification_api import ServiceQualificationAPI, ServiceQualificationAPIError


async def test_get_omits_unset_arguments():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/checkServiceQualification"
        assert not request.url.query
        return httpx.Response(200, json=[])
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        assert await ServiceQualificationAPI("http://test", client=client).get("checkServiceQualification") == []
    finally:
        await client.aclose()


async def test_query_resource_path():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/queryServiceQualification"
        assert not request.url.query
        return httpx.Response(200, json=[{"id": "1"}])
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        await ServiceQualificationAPI("http://test", client=client).get("queryServiceQualification")
    finally:
        await client.aclose()


async def test_semantic_filters_are_translated():
    captured: httpx.Request | None = None

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal captured
        captured = request
        return httpx.Response(200, json=[])

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ServiceQualificationAPI("http://test", client=client)
    try:
        await api.get(
            "queryServiceQualification",
            external_id="WS-QUAL-1001",
            state="done",
        )
        assert captured is not None
        assert dict(captured.url.params) == {
            "externalIdentifier.id": "WS-QUAL-1001",
            "state": "done",
        }
    finally:
        await client.aclose()


async def test_id_cannot_be_combined_with_filters():
    async def handler(_: httpx.Request) -> httpx.Response:
        raise AssertionError("No request should be made")

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    api = ServiceQualificationAPI("http://test", client=client)
    try:
        with pytest.raises(ServiceQualificationAPIError, match="cannot be combined"):
            await api.get("queryServiceQualification", "api-id", state="done")
    finally:
        await client.aclose()


async def test_downstream_errors_are_raised():
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(422, text="invalid")
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with pytest.raises(ServiceQualificationAPIError, match="HTTP 422") as error:
            await ServiceQualificationAPI("http://test", client=client).create("checkServiceQualification", {})
        assert error.value.status_code == 422
    finally:
        await client.aclose()
