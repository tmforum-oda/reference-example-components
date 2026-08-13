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


async def test_query_resource_path_and_filter():
    async def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.path == "/queryServiceQualification"
        assert dict(request.url.params) == {"externalId": "WS-QUAL-1001"}
        return httpx.Response(200, json=[{"id": "1"}])
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        await ServiceQualificationAPI("http://test", client=client).get("queryServiceQualification", filter={"externalId": "WS-QUAL-1001"})
    finally:
        await client.aclose()


async def test_downstream_errors_are_raised():
    async def handler(_: httpx.Request) -> httpx.Response:
        return httpx.Response(422, text="invalid")
    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    try:
        with pytest.raises(ServiceQualificationAPIError, match="HTTP 422"):
            await ServiceQualificationAPI("http://test", client=client).create("checkServiceQualification", {})
    finally:
        await client.aclose()
