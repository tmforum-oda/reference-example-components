# MCP Server implementation on top of TM Forum Product Catalog component.
# This script sets up a FastMCP server that interacts with the Product Catalog API to handle queries and responses.
#
# Transport can be configured via command-line arguments or environment variables:
# - --transport=stdio or MCP_TRANSPORT=stdio for standard input/output (default)
# - --transport=sse or MCP_TRANSPORT=sse for Server-Sent Events
#
# When using SSE transport, port can be specified:
# - --port=8000 or MCP_PORT=8000 (default port is 8000)

# logging and system imports
import logging
import os
import sys
import argparse
from pathlib import Path

# MCP Server imports
from typing import Any
from mcp.server.fastmcp import FastMCP
from fastapi import FastAPI
import uvicorn

# Import API functionality
from product_catalog_api import (
    get_catalog,
    create_catalog,
    update_catalog,
    delete_catalog,
)

# ---------------------------------------------------------------------------------------------
# Configure logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
    ],
)

logger = logging.getLogger("product-catalog-mcp")
logger.info("Product Catalog MCP Server")

# ---------------------------------------------------------------------------------------------
# MCP server code

# Initialize FastMCP server
mcp = FastMCP(name="product_catalog", version="1.0.0")


@mcp.tool()
async def catalog_get(
    catalog_id: str = None, fields: str = None, offset: int = None, limit: int = None
) -> dict:
    """Retrieve catalog information from the TM Forum Product Catalog Management API.

    Args:
        catalog_id: Optional ID of a specific catalog to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.

    Returns:
        A dictionary containing the catalog data or a list of catalogs.
        Returns null if an error occurs.
    """
    logger.info(
        f"MCP Tool - Getting catalog with ID: {catalog_id if catalog_id else 'ALL'}"
    )
    result = await get_catalog(
        catalog_id=catalog_id, fields=fields, offset=offset, limit=limit
    )
    if result == None:
        logger.warning("Failed to retrieve catalog data")
        return {"error": "Failed to retrieve catalog data"}
    return result


@mcp.tool()
async def catalog_create(catalog_data: dict) -> dict:
    """Create a new catalog in the TM Forum Product Catalog Management API.

    Args:
        catalog_data: Dictionary containing the catalog data according to the TMF620 specification.

    Returns:
        A dictionary containing the created catalog data.
        Returns null if an error occurs.
    """
    logger.info("MCP Tool - Creating a new catalog")
    result = await create_catalog(catalog_data)
    if result == None:
        logger.warning("Failed to create catalog")
        return {"error": "Failed to create catalog"}
    return result


@mcp.tool()
async def catalog_update(catalog_id: str, catalog_data: dict) -> dict:
    """Update an existing catalog in the TM Forum Product Catalog Management API.

    Args:
        catalog_id: ID of the catalog to update.
        catalog_data: Dictionary containing the catalog data to update.

    Returns:
        A dictionary containing the updated catalog data.
        Returns null if an error occurs.
    """
    logger.info(f"MCP Tool - Updating catalog with ID: {catalog_id}")
    result = await update_catalog(catalog_id, catalog_data)
    if result == None:
        logger.warning(f"Failed to update catalog with ID: {catalog_id}")
        return {"error": f"Failed to update catalog with ID: {catalog_id}"}
    return result


@mcp.tool()
async def catalog_delete(catalog_id: str) -> dict:
    """Delete a catalog from the TM Forum Product Catalog Management API.

    Args:
        catalog_id: ID of the catalog to delete.

    Returns:
        A dictionary with success status.
    """
    logger.info(f"MCP Tool - Deleting catalog with ID: {catalog_id}")
    result = await delete_catalog(catalog_id)
    if result == None:
        logger.warning(f"Failed to delete catalog with ID: {catalog_id}")
        return {
            "success": False,
            "error": f"Failed to delete catalog with ID: {catalog_id}",
        }
    return {"success": True, "message": f"Catalog {catalog_id} deleted successfully"}


if __name__ == "__main__":
    # Set up argument parser for command-line options
    parser = argparse.ArgumentParser(description="Product Catalog MCP Server")
    parser.add_argument(
        "--url",
        default=os.environ.get("COMPONENT_NAME", "r1-productcatalogmanagement"),
        help="URL endpoint for the MCP server (default: r1-productcatalogmanagement)",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=int(os.environ.get("MCP_PORT", 8000)),
        help="Port for SSE transport (default: 8000, used only with --transport=sse)",
    )
    args = parser.parse_args()

    # Get the transport from command-line argument or environment variable
    transport = "sse"
    port = args.port
    url = args.url

    logger.info(
        f"Starting Product Catalog MCP Server with {transport} transport on port {port} at endpoint {url}"
    )

    try:
        # Create a main FastAPI app
        main_app = FastAPI(title="Product Catalog MCP Server")

        # Create the SSE app using the MCP server's built-in method
        mcp_app = mcp.sse_app()

        # Mount the MCP server app at the url endpoint
        main_app.mount("/" + url, mcp_app)

        # Run the ASGI app with uvicorn
        uvicorn.run(main_app, host="0.0.0.0", port=port)
    except KeyboardInterrupt:
        logger.info("Server shutting down")
    except Exception as e:
        logger.exception("Server error")
        sys.exit(1)
