"""Streamable HTTP MCP server for TMF638 Service Inventory."""

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

from service_inventory_api import ServiceInventoryAPI

logging.basicConfig(level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO), format="%(asctime)s %(levelname)s %(name)s %(message)s")
LOGGER = logging.getLogger("service-inventory-mcp")
api = ServiceInventoryAPI()
mcp = FastMCP(name="service_inventory", host=os.getenv("MCP_HOST", "0.0.0.0"), port=int(os.getenv("MCP_PORT", "8080")))


class ServiceFVO(BaseModel):
    """Bounded workshop schema for a TMF638 Service_FVO payload."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")
    type_: str = Field(alias="@type", description="TMF polymorphic type")
    state: str
    service_specification: dict[str, Any] = Field(alias="serviceSpecification")


@mcp.tool()
async def service_get(service_id: str | None = None, fields: str | None = None, offset: int | None = None, limit: int | None = None, filter: dict[str, Any] | None = None) -> Any:
    """List services or retrieve one service. Omit service_id to list all matching services."""
    return await api.get_service(service_id, fields=fields, offset=offset, limit=limit, filter=filter)


@mcp.tool()
async def service_create(service_data: ServiceFVO) -> Any:
    """Create a service. This mutating operation requires orchestrator confirmation."""
    return await api.create_service(service_data.model_dump(by_alias=True, exclude_none=True))


@mcp.tool()
async def service_update(service_id: str, service_data: dict[str, Any]) -> Any:
    """Patch a service. This mutating operation requires orchestrator confirmation."""
    return await api.update_service(service_id, service_data)


@mcp.tool()
async def service_delete(service_id: str) -> Any:
    """Delete a service. This mutating operation requires orchestrator confirmation."""
    return await api.delete_service(service_id)


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "serviceinventorymcp"})


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
    parser = argparse.ArgumentParser(description="TMF638 Service Inventory MCP server")
    parser.add_argument("--host", default=os.getenv("MCP_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.getenv("MCP_PORT", "8080")))
    args = parser.parse_args()
    LOGGER.info("Starting serviceinventorymcp on %s:%s", args.host, args.port)
    uvicorn.run(create_app(), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
