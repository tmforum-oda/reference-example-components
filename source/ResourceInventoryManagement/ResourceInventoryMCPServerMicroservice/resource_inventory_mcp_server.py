"""Streamable HTTP MCP server for TMF639 Resource Inventory."""

import argparse
import logging
import os
from contextlib import asynccontextmanager
from typing import Annotated, Any, Literal

import uvicorn
from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, ConfigDict, Field
from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.routing import Mount, Route

from resource_inventory_api import ResourceInventoryAPI, ResourceInventoryAPIError


logging.basicConfig(
    level=getattr(logging, os.getenv("LOG_LEVEL", "INFO").upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
LOGGER = logging.getLogger("resource-inventory-mcp")

api = ResourceInventoryAPI()
mcp = FastMCP(
    name="resource_inventory",
    host=os.getenv("MCP_HOST", "0.0.0.0"),
    port=int(os.getenv("MCP_PORT", "8080")),
)


class ResourceFVO(BaseModel):
    """Bounded workshop schema for a TMF639 Resource_Create create payload."""

    model_config = ConfigDict(populate_by_name=True, extra="allow")

    name: str


def _resource_category(value: str | None) -> str | None:
    """Normalize common user-facing resource types to seeded TMF639 categories."""
    if not value:
        return None
    normalized = " ".join(value.lower().replace("_", " ").split())
    if "router" in normalized:
        return "Router"
    if "optical" in normalized or "fiber access" in normalized:
        return "Optical Access Node"
    return value


def _generic_resource_name_as_category(value: str | None) -> str | None:
    if not value:
        return None
    normalized = " ".join(value.lower().replace("_", " ").split())
    aliases = {
        "router",
        "routers",
        "router resource",
        "router resources",
        "optical access node",
        "optical access nodes",
        "fiber access node",
        "fiber access nodes",
    }
    return _resource_category(value) if normalized in aliases else None


@mcp.tool()
async def resource_get(
    resource_id: Annotated[
        str | None,
        Field(description="Exact API-generated resource ID."),
    ] = None,
    workshop_id: Annotated[
        str | None,
        Field(description="Exact stable workshop ID, such as WS-RES-1001."),
    ] = None,
    resource_name: Annotated[
        str | None,
        Field(
            description=(
                "Exact full resource name only. Do not use a type, category, "
                "location, partial name, or requested output field."
            )
        ),
    ] = None,
    resource_type: Annotated[
        str | None,
        Field(
            description=(
                "Resource type or category, such as Router or Optical Access Node."
            )
        ),
    ] = None,
    location_id: Annotated[
        str | None,
        Field(
            description=(
                "Exact location ID, such as WS-LOC-MUM-001. Omit for a general "
                "event name, region, or location group."
            )
        ),
    ] = None,
    resource_status: Annotated[
        Literal[
            "standby", "alarm", "available", "reserved", "unknown", "suspended"
        ]
        | None,
        Field(
            description=(
                "One exact TMF639 status. Omit for all statuses, exclusions, or "
                "requests involving multiple statuses."
            )
        ),
    ] = None,
    offset: int | None = None,
    limit: int | None = None,
) -> Any:
    """Find network resources and explain their TMF639 inventory state.

    Complete resource records are returned so grounded responses can include the
    resource type, status, place, characteristics, and specification details. Use
    this tool for questions about routers, optical access resources, workshop
    locations, availability, reservations, alarms, and resource identifiers.

    Args:
        resource_id: Optional API-generated resource ID. When supplied, omit list
            filters and pagination arguments.
        workshop_id: Optional stable workshop identifier stored as a TMF639
            resourceCharacteristic, such as WS-RES-1001.
        resource_name: Optional exact full resource name. Do not use a type such as
            Router, a partial name, or a requested output field as this argument.
        resource_type: Optional resource type or category, such as Router or Optical
            Access Node. The server translates this into the TMF639 category filter.
        location_id: Optional exact workshop location ID, such as WS-LOC-MUM-001.
            Omit it when the request names a general event or location group rather
            than one exact location ID.
        resource_status: Optional TMF639 resource status. Omit it to retrieve
            every status; never use values such as all or any.
        offset: Optional pagination offset.
        limit: Optional maximum number of resources to return.
    """
    inferred_category = _generic_resource_name_as_category(resource_name)
    if inferred_category and resource_type is None:
        resource_type = inferred_category
        resource_name = None
    resource_type = _resource_category(resource_type)

    try:
        return await api.get_resource(
            resource_id,
            workshop_id=workshop_id,
            resource_name=resource_name,
            resource_type=resource_type,
            location_id=location_id,
            resource_status=resource_status,
            offset=offset,
            limit=limit,
        )
    except ResourceInventoryAPIError as error:
        if error.status_code == 404:
            return {
                "error": {
                    "status": 404,
                    "detail": (
                        "No resource was found for the supplied API-generated "
                        "resource_id."
                    ),
                }
            }
        raise


@mcp.tool()
async def resource_create(resource_data: ResourceFVO) -> Any:
    """Create a TMF639 resource using a Resource_Create payload.

    The payload must contain ``name`` and conform to the deployed TMF639 schema.
    This is a mutating operation and requires orchestrator confirmation.
    """
    return await api.create_resource(
        resource_data.model_dump(by_alias=True, exclude_none=True)
    )


@mcp.tool()
async def resource_update(resource_id: str, resource_data: dict[str, Any]) -> Any:
    """Patch an existing TMF639 resource by API-generated ID.

    This is a mutating operation and requires orchestrator confirmation.
    """
    return await api.update_resource(resource_id, resource_data)


@mcp.tool()
async def resource_delete(resource_id: str) -> Any:
    """Delete an existing TMF639 resource by API-generated ID.

    This is a mutating operation and requires orchestrator confirmation.
    """
    return await api.delete_resource(resource_id)


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"status": "ok", "service": "resourceinventorymcp"})


def create_app(component_name: str | None = None) -> Starlette:
    """Create the HTTP application with health and MCP routes."""
    mcp_app = mcp.streamable_http_app()
    prefix = component_name or os.getenv("COMPONENT_NAME", "").strip("/")

    @asynccontextmanager
    async def lifespan(_: Starlette):
        async with mcp_app.router.lifespan_context(mcp_app):
            yield
        await api.close()

    routes = [Route("/health", health)]
    routes.append(Mount(f"/{prefix}" if prefix else "/", app=mcp_app))
    app = Starlette(routes=routes, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["Mcp-Session-Id"],
    )
    return app


def main() -> None:
    parser = argparse.ArgumentParser(description="TMF639 Resource Inventory MCP server")
    parser.add_argument("--host", default=os.getenv("MCP_HOST", "0.0.0.0"))
    parser.add_argument(
        "--port", type=int, default=int(os.getenv("MCP_PORT", "8080"))
    )
    args = parser.parse_args()
    LOGGER.info("Starting resourceinventorymcp on %s:%s", args.host, args.port)
    uvicorn.run(create_app(), host=args.host, port=args.port)


if __name__ == "__main__":
    main()
