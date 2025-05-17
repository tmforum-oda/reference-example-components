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
from typing import Any, Dict, List, Optional
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


@mcp.resource("resource://tmf620/catalog/{catalog_id}")
async def catalog_resource(catalog_id: str = None) -> dict:
    """Retrieve catalog information as a resource from the TM Forum Product Catalog Management API.

    This resource represents a collection of Product Offerings, intended for a specific DistributionChannel,
    enhanced with additional information such as SLA parameters, invoicing and shipping details.

    Args:
        catalog_id: Optional ID of a specific catalog to retrieve. If not provided, returns all catalogs.

    Returns:
        A structured representation of the catalog(s) following the TMF620 specification.
    """
    logger.info(
        f"MCP Resource - Getting catalog with ID: {catalog_id if catalog_id else 'ALL'}"
    )
    result = await get_catalog(catalog_id=catalog_id)
    if result is None:
        logger.warning("Failed to retrieve catalog data")
        return {"error": "Failed to retrieve catalog data"}
    return result


@mcp.resource("schema://tmf620/catalog")
async def catalog_schema() -> dict:
    """Define the TMF620 Catalog resource schema and operations.

    This resource definition follows the TM Forum TMF620 specification for Product Catalog Management.
    """
    logger.info(f"MCP Resource - Getting catalog schema")
    return {
        "name": "TMF620 Catalog",
        "description": "TM Forum Product Catalog Management API - Catalog Resource",
        "resource": {
            "uri": "resource://tmf620/catalog",
            "schema": {
                "type": "object",
                "description": "A collection of Product Offerings, intended for a specific DistributionChannel, enhanced with additional information such as SLA parameters, invoicing and shipping details",
                "properties": {
                    "@baseType": {
                        "type": "string",
                        "description": "When sub-classing, this defines the super-class",
                    },
                    "@schemaLocation": {
                        "type": "string",
                        "format": "uri",
                        "description": "A URI to a JSON-Schema file that defines additional attributes and relationships",
                    },
                    "@type": {
                        "type": "string",
                        "description": "When sub-classing, this defines the sub-class entity name",
                    },
                    "catalogType": {
                        "type": "string",
                        "description": "Indicates if the catalog is a product, service or resource catalog",
                    },
                    "category": {
                        "type": "array",
                        "description": "List of root categories contained in this catalog",
                        "items": {"$ref": "#/definitions/CategoryRef"},
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of this catalog",
                    },
                    "href": {
                        "type": "string",
                        "description": "Unique reference of the catalog",
                    },
                    "id": {
                        "type": "string",
                        "description": "Unique identifier of the Catalog",
                    },
                    "lastUpdate": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Date and time of the last update",
                    },
                    "lifecycleStatus": {
                        "type": "string",
                        "description": "Used to indicate the current lifecycle status",
                    },
                    "name": {"type": "string", "description": "Name of the catalog"},
                    "relatedParty": {
                        "type": "array",
                        "description": "List of parties involved in this catalog",
                        "items": {"$ref": "#/definitions/RelatedParty"},
                    },
                    "validFor": {
                        "$ref": "#/definitions/TimePeriod",
                        "description": "The period for which the catalog is valid",
                    },
                    "version": {"type": "string", "description": "Catalog version"},
                },
            },
            "operations": [
                {
                    "name": "get",
                    "description": "Retrieve catalog information",
                    "tool": "catalog_get",
                },
                {
                    "name": "create",
                    "description": "Create a new catalog",
                    "tool": "catalog_create",
                },
                {
                    "name": "update",
                    "description": "Update an existing catalog",
                    "tool": "catalog_update",
                },
                {
                    "name": "delete",
                    "description": "Delete a catalog",
                    "tool": "catalog_delete",
                },
            ],
            "examples": [
                {
                    "name": "Enterprise Service Catalog",
                    "description": "A catalog containing enterprise telecom service offerings",
                    "catalogType": "Product",
                    "version": "1.0",
                    "lifecycleStatus": "Active",
                    "validFor": {
                        "startDateTime": "2025-01-01T00:00:00Z",
                        "endDateTime": "2026-01-01T00:00:00Z",
                    },
                },
                {
                    "name": "Consumer Mobile Offerings",
                    "description": "Consumer mobile products and services",
                    "catalogType": "Product",
                    "version": "2.3",
                    "lifecycleStatus": "Active",
                    "validFor": {
                        "startDateTime": "2025-03-15T00:00:00Z",
                        "endDateTime": "2025-12-31T23:59:59Z",
                    },
                },
            ],
        },
    }


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
        If an error occurs, returns an error object with status code and detailed message.
    """
    logger.info("MCP Tool - Creating a new catalog")
    result = await create_catalog(catalog_data)

    # Check if the result contains an error object
    if result and "error" in result:
        logger.warning(f"Failed to create catalog: {result['error']['detail']}")
        # Return the error with HTTP status code to the MCP client
        return result
    elif result is None:
        logger.warning("Failed to create catalog - no response received")
        return {
            "error": {
                "status": 500,
                "detail": "Failed to create catalog - no response received",
            }
        }

    # Success case
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
        If an error occurs, returns an error object with status code and detailed message.
    """
    logger.info("MCP Tool - Creating a new category")
    result = await create_category(category_data)

    # Check if the result contains an error object
    if result and "error" in result:
        logger.warning(f"Failed to create category: {result['error']['detail']}")
        # Return the error with HTTP status code to the MCP client
        return result
    elif result is None:
        logger.warning("Failed to create category - no response received")
        return {
            "error": {
                "status": 500,
                "detail": "Failed to create category - no response received",
            }
        }

    # Success case
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


# ---------------------------------------------------------------------------------------------
# MCP prompt examples
# These prompts provide templates for common operations

import datetime
import json


@mcp.prompt()
def create_catalog_prompt(
    name: str,
    description: str,
    catalog_type: str = "Product",
    version: str = "1.0",
    lifecycle_status: str = "Active",
) -> str:
    """Create a prompt template for guiding a user through creating a new catalog.

    Args:
        name: Name of the catalog (required by TMF620)
        description: Description of this catalog
        catalog_type: Indicates if the catalog is a product, service or resource catalog
        version: Catalog version
        lifecycle_status: Used to indicate the current lifecycle status

    Returns:
        A prompt template string for guiding a user to create a catalog
    """
    # Set default dates for the validity period (1 year from now)
    validity_start = datetime.datetime.now().isoformat()
    validity_end = (datetime.datetime.now() + datetime.timedelta(days=365)).isoformat()
    validity_start = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%S.000+00:00"
    )
    validity_end = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
    ).strftime("%Y-%m-%dT%H:%M:%S.000+00:00")

    # Default categories if none provided
    categories = []

    # Default related parties if none provided
    related_parties = []

    # Create the catalog JSON structure based on TMF620 schema
    catalog_data = {
        "name": name,
        "description": description,
        "catalogType": catalog_type,
        "version": version,
        "lifecycleStatus": lifecycle_status,
        "validFor": {"startDateTime": validity_start, "endDateTime": validity_end},
        "category": categories,
        "relatedParty": related_parties,
    }  # Format the catalog data as a readable JSON string
    formatted_json = json.dumps(catalog_data, indent=2)

    # Example category structure for documentation
    category_example = {
        "id": "category-id",
        "href": "https://api-url/category/category-id",
        "name": "Example Category",
        "@referredType": "Category",
    }

    # Example related party structure for documentation
    related_party_example = {
        "id": "party-id",
        "href": "https://api-url/party/party-id",
        "name": "Example Organization",
        "role": "Owner",
        "@referredType": "Organization",
    }

    # Create the prompt template with all TM Forum TMF620 catalog attributes
    return f"""
I want to create a new catalog in the Product Catalog Management system with the following details:

- Name: {name}
- Description: {description}
- Type: {catalog_type}
- Version: {version}
- Status: {lifecycle_status}
- Valid from: {validity_start} to {validity_end}

The catalog follows the TMF620 schema with these attributes:
* name - Name of the catalog (required)
* description - Description of this catalog
* catalogType - Indicates if the catalog is a product, service or resource catalog
* version - Catalog version
* lifecycleStatus - Used to indicate the current lifecycle status (e.g., Active, Deprecated)
* validFor - The period for which the catalog is valid (startDateTime and endDateTime)
* category - List of root categories contained in this catalog (can be empty)
* relatedParty - List of parties involved in this catalog (can be empty)

To add categories, you can use structures like:
```json
{json.dumps(category_example, indent=2)}
```

To add related parties, you can use structures like:
```json
{json.dumps(related_party_example, indent=2)}
```

Here's my complete catalog definition:
```json
{formatted_json}
```

Please help me create this catalog in the system.
"""


@mcp.prompt()
def create_category_prompt(
    name: str,
    description: str,
    is_root: bool = False,
    lifecycle_status: str = "Active",
    version: str = "1.0",
    parent_id: str = None,
) -> str:
    """Create a prompt template for guiding a user through creating a new category.

    Args:
        name: Name of the category (required by TMF620)
        description: Description of this category
        is_root: If true, this Boolean indicates that the category is a root of categories
        lifecycle_status: Used to indicate the current lifecycle status
        version: Category version
        parent_id: Unique identifier of the parent category (optional)

    Returns:
        A prompt template string for guiding a user to create a category
    """
    # Set default dates for the validity period (1 year from now)
    validity_start = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%S.000+00:00"
    )
    validity_end = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
    ).strftime("%Y-%m-%dT%H:%M:%S.000+00:00")

    # Default product offerings if none provided
    product_offerings = []

    # Default subcategories if none provided
    sub_categories = []

    # Create the category JSON structure based on TMF620 schema
    category_data = {
        "name": name,
        "description": description,
        "isRoot": is_root,
        "lifecycleStatus": lifecycle_status,
        "version": version,
        "validFor": {"startDateTime": validity_start, "endDateTime": validity_end},
        "productOffering": product_offerings,
        "subCategory": sub_categories,
    }

    # Add parent ID if provided
    if parent_id:
        category_data["parentId"] = parent_id

    # Format the category data as a readable JSON string
    formatted_json = json.dumps(category_data, indent=2)

    # Example product offering structure for documentation
    product_offering_example = {
        "id": "offering-id",
        "href": "https://api-url/productOffering/offering-id",
        "name": "Example Product Offering",
        "@referredType": "ProductOffering",
    }

    # Example subcategory structure for documentation
    subcategory_example = {
        "id": "subcategory-id",
        "href": "https://api-url/category/subcategory-id",
        "name": "Example Subcategory",
        "@referredType": "Category",
    }

    # Create the prompt template with all TM Forum TMF620 category attributes
    return f"""
I want to create a new category in the Product Catalog Management system with the following details:

- Name: {name}
- Description: {description}
- Is Root Category: {"Yes" if is_root else "No"}
- Lifecycle Status: {lifecycle_status}
- Version: {version}
{"- Parent Category ID: " + parent_id if parent_id else "- No parent category (top-level category)"}
- Valid from: {validity_start} to {validity_end}

The category follows the TMF620 schema with these attributes:
* name - Name of the category (required)
* description - Description of this category
* isRoot - If true, this indicates that the category is a root of categories
* lifecycleStatus - Used to indicate the current lifecycle status (e.g., Active, Deprecated)
* version - Category version
* validFor - The period for which the category is valid (startDateTime and endDateTime)
* parentId - Unique identifier of the parent category (optional, only for non-root categories)
* productOffering - A list of product offerings contained in this category (can be empty)
* subCategory - A list of subcategories contained in this category (can be empty)

To add product offerings to this category, you can use structures like:
```json
{json.dumps(product_offering_example, indent=2)}
```

To add subcategories, you can use structures like:
```json
{json.dumps(subcategory_example, indent=2)}
```

Here's my complete category definition:
```json
{formatted_json}
```

Please help me create this category in the system.
"""


@mcp.prompt()
def list_catalogs_prompt() -> str:
    """Create a prompt template for listing all available catalogs."""
    return """
Show me all the catalogs currently available in the Product Catalog Management system.

I'd like to see the following information for each catalog:
- ID and name
- Description
- Type (Product, Service, or Resource)
- Current lifecycle status
- Validity period

Please organize the information in a clear, readable format.
"""


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
