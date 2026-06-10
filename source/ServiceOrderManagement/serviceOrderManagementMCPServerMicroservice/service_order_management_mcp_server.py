# MCP Server implementation on top of TM Forum Service Order Management component.
# This script sets up a FastMCP server that interacts with the Service Ordering API (TMF641).
#
# The server uses Streamable HTTP transport as recommended by MCP specification 2025-06-18.
# Port can be specified via --port=8000 or MCP_PORT=8000 (default port is 8000)

import logging
import os
import sys

from typing import Any, Dict, List, Optional
from mcp.server.fastmcp import FastMCP
import uvicorn
from starlette.applications import Starlette
from starlette.routing import Mount
from starlette.middleware.cors import CORSMiddleware

from service_order_management_api import (
    get_service_order,
    create_service_order,
    update_service_order,
    delete_service_order,
    get_cancel_service_order,
    create_cancel_service_order,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger("service-order-management-mcp")
logger.info("Service Order Management MCP Server")

mcp = FastMCP(
    name="service_order_management",
    host=os.environ.get("MCP_HOST", "0.0.0.0"),
    port=int(os.environ.get("MCP_PORT", 8000)),
)

# ---------------------------------------------------------------------------
# ServiceOrder tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def service_order_get(
    service_order_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> dict:
    """Retrieve service order(s) from the TM Forum Service Ordering Management API (TMF641).

    Args:
        service_order_id: Optional ID of a specific service order to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional dictionary of filter criteria (e.g., {"state": "inProgress"}).

    Returns:
        A dictionary or list containing the service order data, or an error dictionary.
    """
    logger.info(f"MCP Tool - Getting service order: {service_order_id if service_order_id else 'ALL'}")
    result = await get_service_order(
        service_order_id=service_order_id, fields=fields, offset=offset, limit=limit, filter=filter
    )
    if result is None:
        logger.warning("Failed to retrieve service order data")
        return {"error": "Failed to retrieve service order data"}
    return result


@mcp.tool()
async def service_order_create(service_order_data: dict) -> dict:
    """Create a new service order in the TM Forum Service Ordering Management API (TMF641).

    Args:
        service_order_data: Dictionary containing the service order data per TMF641 spec.
                            Must include 'serviceOrderItem' array.

    Returns:
        A dictionary containing the created service order data, or an error dictionary.
    """
    logger.info("MCP Tool - Creating a new service order")
    result = await create_service_order(service_order_data)
    if result and "error" in result:
        logger.warning(f"Failed to create service order: {result['error']}")
        return result
    if result is None:
        return {"error": {"status": 500, "detail": "Failed to create service order"}}
    return result


@mcp.tool()
async def service_order_update(service_order_id: str, service_order_data: dict) -> dict:
    """Update an existing service order in the TM Forum Service Ordering Management API (TMF641).

    Args:
        service_order_id: ID of the service order to update.
        service_order_data: Dictionary containing the fields to update.

    Returns:
        A dictionary containing the updated service order data, or an error dictionary.
    """
    logger.info(f"MCP Tool - Updating service order: {service_order_id}")
    result = await update_service_order(service_order_id, service_order_data)
    if result is None:
        return {"error": f"Failed to update service order with ID: {service_order_id}"}
    return result


@mcp.tool()
async def service_order_delete(service_order_id: str) -> dict:
    """Delete a service order from the TM Forum Service Ordering Management API (TMF641).

    Args:
        service_order_id: ID of the service order to delete.

    Returns:
        A dictionary with success status.
    """
    logger.info(f"MCP Tool - Deleting service order: {service_order_id}")
    result = await delete_service_order(service_order_id)
    if result is None:
        return {"success": False, "error": f"Failed to delete service order with ID: {service_order_id}"}
    return {"success": True, "message": f"Service order {service_order_id} deleted successfully"}


# ---------------------------------------------------------------------------
# CancelServiceOrder tools
# ---------------------------------------------------------------------------

@mcp.tool()
async def cancel_service_order_get(
    cancel_order_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> dict:
    """Retrieve cancel service order(s) from the TM Forum Service Ordering Management API (TMF641).

    Args:
        cancel_order_id: Optional ID of a specific cancel service order to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional dictionary of filter criteria (e.g., {"state": "inProgress"}).

    Returns:
        A dictionary or list containing the cancel service order data, or an error dictionary.
    """
    logger.info(f"MCP Tool - Getting cancel service order: {cancel_order_id if cancel_order_id else 'ALL'}")
    result = await get_cancel_service_order(
        cancel_order_id=cancel_order_id, fields=fields, offset=offset, limit=limit, filter=filter
    )
    if result is None:
        return {"error": "Failed to retrieve cancel service order data"}
    return result


@mcp.tool()
async def cancel_service_order_create(cancel_order_data: dict) -> dict:
    """Create a cancel service order request in the TM Forum Service Ordering Management API (TMF641).

    Args:
        cancel_order_data: Dictionary containing the cancellation request per TMF641 spec.
                           Must include 'serviceOrder' reference.

    Returns:
        A dictionary containing the created cancel service order data, or an error dictionary.
    """
    logger.info("MCP Tool - Creating a cancel service order")
    result = await create_cancel_service_order(cancel_order_data)
    if result and "error" in result:
        return result
    if result is None:
        return {"error": {"status": 500, "detail": "Failed to create cancel service order"}}
    return result


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    port = int(os.environ.get("MCP_PORT", 8000))
    logger.info(f"Starting Service Order Management MCP Server on port {port}")
    mcp.run(transport="streamable-http")
