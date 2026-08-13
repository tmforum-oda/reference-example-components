"""Streamable HTTP MCP server for TMF645 Service Qualification."""

import argparse
import logging
import os
from contextlib import asynccontextmanager
from typing import Any

import uvicorn
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route

from service_qualification_api import ServiceQualificationAPI

logging.basicConfig(level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO), format="%(asctime)s %(levelname)s %(name)s %(message)s")
LOGGER = logging.getLogger("service-qualification-mcp")
api = ServiceQualificationAPI()
mcp = FastMCP(name="service_qualification", host=os.getenv("MCP_HOST", "0.0.0.0"), port=int(os.getenv("MCP_PORT", "8080")))


class CheckServiceQualificationFVO(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field(alias="@type")
    service_qualification_item: list[dict[str, Any]] = Field(alias="serviceQualificationItem")


class QueryServiceQualificationFVO(BaseModel):
    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field(alias="@type")
    search_criteria: dict[str, Any] = Field(alias="searchCriteria")


async def _get(resource: str, resource_id: str | None, fields: str | None, offset: int | None, limit: int | None, filter: dict[str, Any] | None) -> Any:
    return await api.get(resource, resource_id, fields=fields, offset=offset, limit=limit, filter=filter)


@mcp.tool()
async def check_service_qualification_get(qualification_id: str | None = None, fields: str | None = None, offset: int | None = None, limit: int | None = None, filter: dict[str, Any] | None = None) -> Any:
    """List check qualifications or retrieve one by ID."""
    return await _get("checkServiceQualification", qualification_id, fields, offset, limit, filter)


@mcp.tool()
async def check_service_qualification_create(qualification_data: CheckServiceQualificationFVO) -> Any:
    """Create a persisted check qualification request. This requires confirmation and does not perform live network feasibility analysis."""
    return await api.create("checkServiceQualification", qualification_data.model_dump(by_alias=True, exclude_none=True))


@mcp.tool()
async def check_service_qualification_update(qualification_id: str, qualification_data: dict[str, Any]) -> Any:
    """Patch a check qualification. This mutating operation requires confirmation."""
    return await api.update("checkServiceQualification", qualification_id, qualification_data)


@mcp.tool()
async def check_service_qualification_delete(qualification_id: str) -> Any:
    """Delete a check qualification. This mutating operation requires confirmation."""
    return await api.delete("checkServiceQualification", qualification_id)


@mcp.tool()
async def query_service_qualification_get(qualification_id: str | None = None, fields: str | None = None, offset: int | None = None, limit: int | None = None, filter: dict[str, Any] | None = None) -> Any:
    """List query qualifications or retrieve one by ID."""
    return await _get("queryServiceQualification", qualification_id, fields, offset, limit, filter)


@mcp.tool()
async def query_service_qualification_create(qualification_data: QueryServiceQualificationFVO) -> Any:
    """Create a persisted query qualification request. This requires confirmation and does not perform live network feasibility analysis."""
    return await api.create("queryServiceQualification", qualification_data.model_dump(by_alias=True, exclude_none=True))


@mcp.tool()
async def query_service_qualification_update(qualification_id: str, qualification_data: dict[str, Any]) -> Any:
    """Patch a query qualification. This mutating operation requires confirmation."""
    return await api.update("queryServiceQualification", qualification_id, qualification_data)


@mcp.tool()
async def query_service_qualification_delete(qualification_id: str) -> Any:
    """Delete a query qualification. This mutating operation requires confirmation."""
    return await api.delete("queryServiceQualification", qualification_id)


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "servicequalificationmcp"})


def create_app(component_name: str | None = None) -> Starlette:
    mcp_app = mcp.streamable_http_app()
    prefix = component_name or os.getenv("COMPONENT_NAME", "").strip("/")

    @asynccontextmanager
    async def lifespan(_: Starlette):
        async with mcp_app.router.lifespan_context(mcp_app):
            yield
        await api.close()

    app = Starlette(routes=[Route("/health", health), Mount(f"/{prefix}" if prefix else "/", app=mcp_app)], lifespan=lifespan)
    app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["GET", "POST", "DELETE", "OPTIONS"], allow_headers=["*"], expose_headers=["Mcp-Session-Id"])
    return app


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default=os.getenv("MCP_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MCP_PORT", "8080")))
    args = parser.parse_args()
    LOGGER.info("Starting servicequalificationmcp on %s:%s", args.host, args.port)
    uvicorn.run(create_app(), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
