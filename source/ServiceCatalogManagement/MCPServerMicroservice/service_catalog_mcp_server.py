# MCP Server implementation on top of TM Forum Service Catalog Management component.
# This script sets up a FastMCP server that interacts with the Service Catalog API.
#
# The server uses Streamable HTTP transport as recommended by MCP specification 2025-06-18.
# Port can be specified via --port=8000 or MCP_PORT=8000 (default port is 8000).

import logging
import os
import sys
import argparse
from pathlib import Path
from typing import Any, Dict, List, Optional
from mcp.server.fastmcp import FastMCP
import uvicorn
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.middleware.cors import CORSMiddleware

from service_catalog_api import (
    get_service_catalog,
    create_service_catalog,
    update_service_catalog,
    delete_service_catalog,
    get_service_category,
    create_service_category,
    update_service_category,
    delete_service_category,
    get_service_candidate,
    create_service_candidate,
    update_service_candidate,
    delete_service_candidate,
    get_service_specification,
    create_service_specification,
    update_service_specification,
    delete_service_specification,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("service-catalog-mcp")
logger.info("Service Catalog Management MCP Server")

mcp = FastMCP(
    name="service_catalog",
    host=os.environ.get("MCP_HOST", "0.0.0.0"),
    port=int(os.environ.get("MCP_PORT", 8000)),
)

# ---- ServiceCatalog tools ----

@mcp.tool()
async def service_catalog_get(
    catalog_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> dict:
    """Retrieve ServiceCatalog resources from the TMF633 Service Catalog Management API.

    Args:
        catalog_id: Optional ID of a specific service catalog to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional dictionary of filter criteria (e.g., {"name": "Mobile"}).
    Returns:
        Dictionary or list of service catalog data.
    """
    result = await get_service_catalog(catalog_id=catalog_id, fields=fields, offset=offset, limit=limit, filter=filter)
    if result is None:
        return {"error": "Failed to retrieve service catalog data"}
    return result


@mcp.tool()
async def service_catalog_create(catalog_data: dict) -> dict:
    """Create a new ServiceCatalog in the TMF633 Service Catalog Management API.

    Args:
        catalog_data: Dictionary containing the service catalog data per TMF633 specification.
    Returns:
        The created service catalog resource.
    """
    result = await create_service_catalog(catalog_data)
    if result is None:
        return {"error": "Failed to create service catalog"}
    return result


@mcp.tool()
async def service_catalog_update(catalog_id: str, catalog_data: dict) -> dict:
    """Update an existing ServiceCatalog (PATCH) in the TMF633 API.

    Args:
        catalog_id: ID of the service catalog to update.
        catalog_data: Dictionary of fields to update.
    Returns:
        The updated service catalog resource.
    """
    result = await update_service_catalog(catalog_id, catalog_data)
    if result is None:
        return {"error": "Failed to update service catalog"}
    return result


@mcp.tool()
async def service_catalog_delete(catalog_id: str) -> dict:
    """Delete a ServiceCatalog from the TMF633 API.

    Args:
        catalog_id: ID of the service catalog to delete.
    Returns:
        Status confirmation.
    """
    result = await delete_service_catalog(catalog_id)
    if result is None:
        return {"error": "Failed to delete service catalog"}
    return result


# ---- ServiceCategory tools ----

@mcp.tool()
async def service_category_get(
    category_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> dict:
    """Retrieve ServiceCategory resources from the TMF633 Service Catalog Management API.

    Args:
        category_id: Optional ID of a specific service category.
        fields: Optional comma-separated list of field names.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional filter dictionary.
    Returns:
        Dictionary or list of service category data.
    """
    result = await get_service_category(category_id=category_id, fields=fields, offset=offset, limit=limit, filter=filter)
    if result is None:
        return {"error": "Failed to retrieve service category data"}
    return result


@mcp.tool()
async def service_category_create(category_data: dict) -> dict:
    """Create a new ServiceCategory in the TMF633 API.

    Args:
        category_data: Dictionary with service category data.
    Returns:
        The created service category resource.
    """
    result = await create_service_category(category_data)
    if result is None:
        return {"error": "Failed to create service category"}
    return result


@mcp.tool()
async def service_category_update(category_id: str, category_data: dict) -> dict:
    """Update a ServiceCategory (PATCH) in the TMF633 API.

    Args:
        category_id: ID of the service category to update.
        category_data: Fields to update.
    Returns:
        The updated service category resource.
    """
    result = await update_service_category(category_id, category_data)
    if result is None:
        return {"error": "Failed to update service category"}
    return result


@mcp.tool()
async def service_category_delete(category_id: str) -> dict:
    """Delete a ServiceCategory from the TMF633 API.

    Args:
        category_id: ID of the service category to delete.
    Returns:
        Status confirmation.
    """
    result = await delete_service_category(category_id)
    if result is None:
        return {"error": "Failed to delete service category"}
    return result


# ---- ServiceCandidate tools ----

@mcp.tool()
async def service_candidate_get(
    candidate_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> dict:
    """Retrieve ServiceCandidate resources from the TMF633 Service Catalog Management API.

    Args:
        candidate_id: Optional ID of a specific service candidate.
        fields: Optional comma-separated list of field names.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional filter dictionary.
    Returns:
        Dictionary or list of service candidate data.
    """
    result = await get_service_candidate(candidate_id=candidate_id, fields=fields, offset=offset, limit=limit, filter=filter)
    if result is None:
        return {"error": "Failed to retrieve service candidate data"}
    return result


@mcp.tool()
async def service_candidate_create(candidate_data: dict) -> dict:
    """Create a new ServiceCandidate in the TMF633 API.

    Args:
        candidate_data: Dictionary with service candidate data.
    Returns:
        The created service candidate resource.
    """
    result = await create_service_candidate(candidate_data)
    if result is None:
        return {"error": "Failed to create service candidate"}
    return result


@mcp.tool()
async def service_candidate_update(candidate_id: str, candidate_data: dict) -> dict:
    """Update a ServiceCandidate (PATCH) in the TMF633 API.

    Args:
        candidate_id: ID of the service candidate to update.
        candidate_data: Fields to update.
    Returns:
        The updated service candidate resource.
    """
    result = await update_service_candidate(candidate_id, candidate_data)
    if result is None:
        return {"error": "Failed to update service candidate"}
    return result


@mcp.tool()
async def service_candidate_delete(candidate_id: str) -> dict:
    """Delete a ServiceCandidate from the TMF633 API.

    Args:
        candidate_id: ID of the service candidate to delete.
    Returns:
        Status confirmation.
    """
    result = await delete_service_candidate(candidate_id)
    if result is None:
        return {"error": "Failed to delete service candidate"}
    return result


# ---- ServiceSpecification tools ----

@mcp.tool()
async def service_specification_get(
    spec_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> dict:
    """Retrieve ServiceSpecification resources from the TMF633 Service Catalog Management API.

    Args:
        spec_id: Optional ID of a specific service specification.
        fields: Optional comma-separated list of field names.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional filter dictionary.
    Returns:
        Dictionary or list of service specification data.
    """
    result = await get_service_specification(spec_id=spec_id, fields=fields, offset=offset, limit=limit, filter=filter)
    if result is None:
        return {"error": "Failed to retrieve service specification data"}
    return result


@mcp.tool()
async def service_specification_create(spec_data: dict) -> dict:
    """Create a new ServiceSpecification in the TMF633 API.

    Args:
        spec_data: Dictionary with service specification data.
    Returns:
        The created service specification resource.
    """
    result = await create_service_specification(spec_data)
    if result is None:
        return {"error": "Failed to create service specification"}
    return result


@mcp.tool()
async def service_specification_update(spec_id: str, spec_data: dict) -> dict:
    """Update a ServiceSpecification (PATCH) in the TMF633 API.

    Args:
        spec_id: ID of the service specification to update.
        spec_data: Fields to update.
    Returns:
        The updated service specification resource.
    """
    result = await update_service_specification(spec_id, spec_data)
    if result is None:
        return {"error": "Failed to update service specification"}
    return result


@mcp.tool()
async def service_specification_delete(spec_id: str) -> dict:
    """Delete a ServiceSpecification from the TMF633 API.

    Args:
        spec_id: ID of the service specification to delete.
    Returns:
        Status confirmation.
    """
    result = await delete_service_specification(spec_id)
    if result is None:
        return {"error": "Failed to delete service specification"}
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Service Catalog Management MCP Server")
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("MCP_PORT", 8000)),
        help="Port for the Streamable HTTP transport (default: 8000)",
    )
    parser.add_argument(
        "--host",
        default=os.environ.get("MCP_HOST", "0.0.0.0"),
        help="Host address to bind to (default: 0.0.0.0)",
    )
    args = parser.parse_args()

    component_name = os.environ.get("COMPONENT_NAME", "")
    mcp_path = f"/{component_name}/mcp" if component_name else "/mcp"

    logger.info(
        f"Starting Service Catalog MCP Server with Streamable HTTP on {args.host}:{args.port}"
    )
    logger.info(f"MCP endpoint: http://{args.host}:{args.port}{mcp_path}")

    try:
        mcp_sub_app = mcp.streamable_http_app()

        if component_name:
            from contextlib import asynccontextmanager

            @asynccontextmanager
            async def lifespan(app):
                async with mcp_sub_app.router.lifespan_context(app):
                    yield

            app = Starlette(
                routes=[Mount(f"/{component_name}", app=mcp_sub_app)],
                lifespan=lifespan,
            )
        else:
            app = mcp_sub_app

        app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=False,
            allow_methods=["*"],
            allow_headers=["*"],
            expose_headers=["*"],
        )

        uvicorn.run(app, host=args.host, port=args.port)
    except Exception as e:
        logger.error(f"Failed to start MCP server: {e}")
        sys.exit(1)
