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
    get_category,
    create_category,
    update_category,
    delete_category,
    get_product_specification,
    create_product_specification,
    update_product_specification,
    delete_product_specification,
    get_product_offering,
    create_product_offering,
    update_product_offering,
    delete_product_offering,
    get_product_offering_price,
    create_product_offering_price,
    update_product_offering_price,
    delete_product_offering_price,
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


@mcp.tool()
async def category_get(
    category_id: str = None, fields: str = None, offset: int = None, limit: int = None
) -> dict:
    """Retrieve category information from the TM Forum Product Catalog Management API.

    Args:
        category_id: Optional ID of a specific category to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.

    Returns:
        A dictionary containing the category data or a list of categories.
        Returns an error dictionary if an error occurs.
    """
    logger.info(
        f"MCP Tool - Getting category with ID: {category_id if category_id else 'ALL'}"
    )
    result = await get_category(
        category_id=category_id, fields=fields, offset=offset, limit=limit
    )
    if result == None:
        logger.warning("Failed to retrieve category data")
        return {"error": "Failed to retrieve category data"}
    return result


@mcp.tool()
async def category_create(category_data: dict) -> dict:
    """Create a new category in the TM Forum Product Catalog Management API.

    Args:
        category_data: Dictionary containing the category data according to the TMF620 specification.

    Returns:
        A dictionary containing the created category data.
        Returns an error dictionary if an error occurs.
    """
    logger.info("MCP Tool - Creating a new category")
    result = await create_category(category_data)
    if result == None:
        logger.warning("Failed to create category")
        return {"error": "Failed to create category"}
    return result


@mcp.tool()
async def category_update(category_id: str, category_data: dict) -> dict:
    """Update an existing category in the TM Forum Product Catalog Management API.

    Args:
        category_id: ID of the category to update.
        category_data: Dictionary containing the category data to update.

    Returns:
        A dictionary containing the updated category data.
        Returns an error dictionary if an error occurs.
    """
    logger.info(f"MCP Tool - Updating category with ID: {category_id}")
    result = await update_category(category_id, category_data)
    if result == None:
        logger.warning(f"Failed to update category with ID: {category_id}")
        return {"error": f"Failed to update category with ID: {category_id}"}
    return result


@mcp.tool()
async def category_delete(category_id: str) -> dict:
    """Delete a category from the TM Forum Product Catalog Management API.

    Args:
        category_id: ID of the category to delete.

    Returns:
        A dictionary with success status.
    """
    logger.info(f"MCP Tool - Deleting category with ID: {category_id}")
    result = await delete_category(category_id)
    if result == None:
        logger.warning(f"Failed to delete category with ID: {category_id}")
        return {
            "success": False,
            "error": f"Failed to delete category with ID: {category_id}",
        }
    return {"success": True, "message": f"Category {category_id} deleted successfully"}


@mcp.tool()
async def product_specification_get(
    product_specification_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
) -> dict:
    """Retrieve product specification information from the TM Forum Product Catalog Management API.

    Args:
        product_specification_id: Optional ID of a specific product specification to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.

    Returns:
        A dictionary containing the product specification data or a list of product specifications.
        Returns an error dictionary if an error occurs.
    """
    logger.info(
        f"MCP Tool - Getting product specification with ID: {product_specification_id if product_specification_id else 'ALL'}"
    )
    result = await get_product_specification(
        product_specification_id=product_specification_id,
        fields=fields,
        offset=offset,
        limit=limit,
    )
    if result == None:
        logger.warning("Failed to retrieve product specification data")
        return {"error": "Failed to retrieve product specification data"}
    return result


@mcp.tool()
async def product_specification_create(product_specification_data: dict) -> dict:
    """Create a new product specification in the TM Forum Product Catalog Management API.

    Args:
        product_specification_data: Dictionary containing the product specification data according to the TMF620 specification.

    Returns:
        A dictionary containing the created product specification data.
        Returns an error dictionary if an error occurs.
    """
    logger.info("MCP Tool - Creating a new product specification")
    result = await create_product_specification(product_specification_data)
    if result == None:
        logger.warning("Failed to create product specification")
        return {"error": "Failed to create product specification"}
    return result


@mcp.tool()
async def product_specification_update(
    product_specification_id: str, product_specification_data: dict
) -> dict:
    """Update an existing product specification in the TM Forum Product Catalog Management API.

    Args:
        product_specification_id: ID of the product specification to update.
        product_specification_data: Dictionary containing the product specification data to update.

    Returns:
        A dictionary containing the updated product specification data.
        Returns an error dictionary if an error occurs.
    """
    logger.info(
        f"MCP Tool - Updating product specification with ID: {product_specification_id}"
    )
    result = await update_product_specification(
        product_specification_id, product_specification_data
    )
    if result == None:
        logger.warning(
            f"Failed to update product specification with ID: {product_specification_id}"
        )
        return {
            "error": f"Failed to update product specification with ID: {product_specification_id}"
        }
    return result


@mcp.tool()
async def product_specification_delete(product_specification_id: str) -> dict:
    """Delete a product specification from the TM Forum Product Catalog Management API.

    Args:
        product_specification_id: ID of the product specification to delete.

    Returns:
        A dictionary with success status.
    """
    logger.info(
        f"MCP Tool - Deleting product specification with ID: {product_specification_id}"
    )
    result = await delete_product_specification(product_specification_id)
    if result == None:
        logger.warning(
            f"Failed to delete product specification with ID: {product_specification_id}"
        )
        return {
            "success": False,
            "error": f"Failed to delete product specification with ID: {product_specification_id}",
        }
    return {
        "success": True,
        "message": f"Product specification {product_specification_id} deleted successfully",
    }


@mcp.tool()
async def product_offering_get(
    product_offering_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
) -> dict:
    """Retrieve product offering information from the TM Forum Product Catalog Management API.

    Args:
        product_offering_id: Optional ID of a specific product offering to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.

    Returns:
        A dictionary containing the product offering data or a list of product offerings.
        Returns an error dictionary if an error occurs.
    """
    logger.info(
        f"MCP Tool - Getting product offering with ID: {product_offering_id if product_offering_id else 'ALL'}"
    )
    result = await get_product_offering(
        product_offering_id=product_offering_id,
        fields=fields,
        offset=offset,
        limit=limit,
    )
    if result == None:
        logger.warning("Failed to retrieve product offering data")
        return {"error": "Failed to retrieve product offering data"}
    return result


@mcp.tool()
async def product_offering_create(product_offering_data: dict) -> dict:
    """Create a new product offering in the TM Forum Product Catalog Management API.

    Args:
        product_offering_data: Dictionary containing the product offering data according to the TMF620 specification.

    Returns:
        A dictionary containing the created product offering data.
        Returns an error dictionary if an error occurs.
    """
    logger.info("MCP Tool - Creating a new product offering")
    result = await create_product_offering(product_offering_data)
    if result == None:
        logger.warning("Failed to create product offering")
        return {"error": "Failed to create product offering"}
    return result


@mcp.tool()
async def product_offering_update(
    product_offering_id: str, product_offering_data: dict
) -> dict:
    """Update an existing product offering in the TM Forum Product Catalog Management API.

    Args:
        product_offering_id: ID of the product offering to update.
        product_offering_data: Dictionary containing the product offering data to update.

    Returns:
        A dictionary containing the updated product offering data.
        Returns an error dictionary if an error occurs.
    """
    logger.info(f"MCP Tool - Updating product offering with ID: {product_offering_id}")
    result = await update_product_offering(product_offering_id, product_offering_data)
    if result == None:
        logger.warning(
            f"Failed to update product offering with ID: {product_offering_id}"
        )
        return {
            "error": f"Failed to update product offering with ID: {product_offering_id}"
        }
    return result


@mcp.tool()
async def product_offering_delete(product_offering_id: str) -> dict:
    """Delete a product offering from the TM Forum Product Catalog Management API.

    Args:
        product_offering_id: ID of the product offering to delete.

    Returns:
        A dictionary with success status.
    """
    logger.info(f"MCP Tool - Deleting product offering with ID: {product_offering_id}")
    result = await delete_product_offering(product_offering_id)
    if result == None:
        logger.warning(
            f"Failed to delete product offering with ID: {product_offering_id}"
        )
        return {
            "success": False,
            "error": f"Failed to delete product offering with ID: {product_offering_id}",
        }
    return {
        "success": True,
        "message": f"Product offering {product_offering_id} deleted successfully",
    }


@mcp.tool()
async def product_offering_price_get(
    product_offering_price_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
) -> dict:
    """Retrieve product offering price information from the TM Forum Product Catalog Management API.

    Args:
        product_offering_price_id: Optional ID of a specific product offering price to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.

    Returns:
        A dictionary containing the product offering price data or a list of product offering prices.
        Returns an error dictionary if an error occurs.
    """
    logger.info(
        f"MCP Tool - Getting product offering price with ID: {product_offering_price_id if product_offering_price_id else 'ALL'}"
    )
    result = await get_product_offering_price(
        product_offering_price_id=product_offering_price_id,
        fields=fields,
        offset=offset,
        limit=limit,
    )
    if result == None:
        logger.warning("Failed to retrieve product offering price data")
        return {"error": "Failed to retrieve product offering price data"}
    return result


@mcp.tool()
async def product_offering_price_create(product_offering_price_data: dict) -> dict:
    """Create a new product offering price in the TM Forum Product Catalog Management API.

    Args:
        product_offering_price_data: Dictionary containing the product offering price data according to the TMF620 specification.

    Returns:
        A dictionary containing the created product offering price data.
        Returns an error dictionary if an error occurs.
    """
    logger.info("MCP Tool - Creating a new product offering price")
    result = await create_product_offering_price(product_offering_price_data)
    if result == None:
        logger.warning("Failed to create product offering price")
        return {"error": "Failed to create product offering price"}
    return result


@mcp.tool()
async def product_offering_price_update(
    product_offering_price_id: str, product_offering_price_data: dict
) -> dict:
    """Update an existing product offering price in the TM Forum Product Catalog Management API.

    Args:
        product_offering_price_id: ID of the product offering price to update.
        product_offering_price_data: Dictionary containing the product offering price data to update.

    Returns:
        A dictionary containing the updated product offering price data.
        Returns an error dictionary if an error occurs.
    """
    logger.info(
        f"MCP Tool - Updating product offering price with ID: {product_offering_price_id}"
    )
    result = await update_product_offering_price(
        product_offering_price_id, product_offering_price_data
    )
    if result == None:
        logger.warning(
            f"Failed to update product offering price with ID: {product_offering_price_id}"
        )
        return {
            "error": f"Failed to update product offering price with ID: {product_offering_price_id}"
        }
    return result


@mcp.tool()
async def product_offering_price_delete(product_offering_price_id: str) -> dict:
    """Delete a product offering price from the TM Forum Product Catalog Management API.

    Args:
        product_offering_price_id: ID of the product offering price to delete.

    Returns:
        A dictionary with success status.
    """
    logger.info(
        f"MCP Tool - Deleting product offering price with ID: {product_offering_price_id}"
    )
    result = await delete_product_offering_price(product_offering_price_id)
    if result == None:
        logger.warning(
            f"Failed to delete product offering price with ID: {product_offering_price_id}"
        )
        return {
            "success": False,
            "error": f"Failed to delete product offering price with ID: {product_offering_price_id}",
        }
    return {
        "success": True,
        "message": f"Product offering price {product_offering_price_id} deleted successfully",
    }


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
