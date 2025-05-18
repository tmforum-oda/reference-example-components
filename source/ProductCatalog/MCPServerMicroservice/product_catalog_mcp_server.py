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


# ---------------------------------------------------------------------------------------------
# MCP tools
# This section defines the tools for the MCP server to interact with the TM Forum Product Catalog Management API.


@mcp.tool()
async def catalog_get(
    catalog_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> dict:
    """Retrieve catalog information from the TM Forum Product Catalog Management API.

    Args:
        catalog_id: Optional ID of a specific catalog to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional dictionary of filter criteria to narrow down the results.
               Examples:
               - {"name": "Wholesale"} - Find catalogs with name containing "Wholesale"
               - {"lifecycleStatus": "Active"} - Find active catalogs
               - {"name": "Retail", "lifecycleStatus": "Active"} - Find active catalogs with name containing "Retail"

    Returns:
        A dictionary containing the catalog data or a list of catalogs.
        Returns null if an error occurs.
    """
    if filter:
        logger.info(f"MCP Tool - Getting catalogs with filter: {filter}")
    else:
        logger.info(
            f"MCP Tool - Getting catalog with ID: {catalog_id if catalog_id else 'ALL'}"
        )
    result = await get_catalog(
        catalog_id=catalog_id, fields=fields, offset=offset, limit=limit, filter=filter
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
    category_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> dict:
    """Retrieve category information from the TM Forum Product Catalog Management API.

    Args:
        category_id: Optional ID of a specific category to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional dictionary of filter criteria to narrow down the results.
               Examples:
               - {"name": "Wholesale"} - Find categories with name containing "Wholesale"
               - {"lifecycleStatus": "Active"} - Find active categories
               - {"name": "Fiber", "lifecycleStatus": "Active"} - Find active categories with name containing "Fiber"

    Returns:
        A dictionary containing the category data or a list of categories.
        Returns an error dictionary if an error occurs.
    """
    if filter:
        logger.info(f"MCP Tool - Getting categories with filter: {filter}")
    else:
        logger.info(
            f"MCP Tool - Getting category with ID: {category_id if category_id else 'ALL'}"
        )
    result = await get_category(
        category_id=category_id,
        fields=fields,
        offset=offset,
        limit=limit,
        filter=filter,
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
    filter: dict = None,
) -> dict:
    """Retrieve product specification information from the TM Forum Product Catalog Management API.

    Args:
        product_specification_id: Optional ID of a specific product specification to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional dictionary of filter criteria to narrow down the results.
               Examples:
               - {"name": "Fiber"} - Find product specifications with name containing "Fiber"
               - {"lifecycleStatus": "Active"} - Find active product specifications
               - {"name": "Internet", "lifecycleStatus": "Active"} - Find active product specifications with name containing "Internet"

    Returns:
        A dictionary containing the product specification data or a list of product specifications.
        Returns an error dictionary if an error occurs.
    """
    if filter:
        logger.info(f"MCP Tool - Getting product specifications with filter: {filter}")
    else:
        logger.info(
            f"MCP Tool - Getting product specification with ID: {product_specification_id if product_specification_id else 'ALL'}"
        )
    result = await get_product_specification(
        product_specification_id=product_specification_id,
        fields=fields,
        offset=offset,
        limit=limit,
        filter=filter,
    )
    if result == None:
        logger.warning("Failed to retrieve product specification data")
        return {"error": "Failed to retrieve product specification data"}
    return result


@mcp.tool()
async def product_specification_create(product_specification_data: dict) -> dict:
    """Create a new product specification in the TM Forum Product Catalog Management API.

    Args:
        product_specification_data: Dictionary containing the product specification data according to the TMF620 specification - see properties below.
        properties:
        '@baseType':
            description: When sub-classing, this defines the super-class
            type: string
        '@schemaLocation':
            description: A URI to a JSON-Schema file that defines additional attributes
            and relationships
            format: uri
            type: string
        '@type':
            description: When sub-classing, this defines the sub-class entity name
            type: string
        attachment:
            description: Complements the description of an element (for instance a product)
            through video, pictures...
            items:
            $ref: '#/definitions/AttachmentRefOrValue'
            type: array
        brand:
            description: The manufacturer or trademark of the specification
            type: string
        bundledProductSpecification:
            description: A type of ProductSpecification that belongs to a grouping of
            ProductSpecifications made available to the market. It inherits of all attributes
            of ProductSpecification.
            items:
            $ref: '#/definitions/BundledProductSpecification'
            type: array
        description:
            description: A narrative that explains in detail what the product specification
            is
            type: string
        href:
            description: Reference of the product specification
            type: string
        id:
            description: Unique identifier of the product specification
            type: string
        isBundle:
            description: isBundle determines whether a productSpecification represents
            a single productSpecification (false), or a bundle of productSpecification
            (true).
            type: boolean
        lastUpdate:
            description: Date and time of the last update
            format: date-time
            type: string
        lifecycleStatus:
            description: Used to indicate the current lifecycle status
            type: string
        name:
            description: Name of the product specification
            type: string
        productNumber:
            description: An identification number assigned to uniquely identity the specification
            type: string
        productSpecCharacteristic:
            description: A characteristic quality or distinctive feature of a ProductSpecification.  The
            characteristic can be take on a discrete value, such as color, can take
            on a range of values, (for example, sensitivity of 100-240 mV), or can be
            derived from a formula (for example, usage time (hrs) = 30 - talk time *3).
            Certain characteristics, such as color, may be configured during the ordering
            or some other process.
            items:
            $ref: '#/definitions/ProductSpecificationCharacteristic'
            type: array
        productSpecificationRelationship:
            description: A migration, substitution, dependency or exclusivity relationship
            between/among product specifications.
            items:
            $ref: '#/definitions/ProductSpecificationRelationship'
            type: array
        relatedParty:
            description: A related party defines party or party role linked to a specific
            entity.
            items:
            $ref: '#/definitions/RelatedParty'
            type: array
        resourceSpecification:
            description: The ResourceSpecification is required to realize a ProductSpecification.
            items:
            $ref: '#/definitions/ResourceSpecificationRef'
            type: array
        serviceSpecification:
            description: ServiceSpecification(s) required to realize a ProductSpecification.
            items:
            $ref: '#/definitions/ServiceSpecificationRef'
            type: array
        targetProductSchema:
            $ref: '#/definitions/TargetProductSchema'
            description: A target product schema reference. The reference object to the
            schema and type of target product which is described by product specification.
            type: object
            properties:
                id:
                    type: string
                href:
                    type: string
                name:
                    type: string
        validFor:
            description: The period for which the product specification is valid
            type: object
            properties:
                endDateTime:
                    description: End of the time period, using IETC-RFC-3339 format
                    format: date-time
                    type: string
                startDateTime:
                    description: Start of the time period, using IETC-RFC-3339 format. If you
                    define a start, you must also define an end
                    format: date-time
                    type: string
        version:
            description: Product specification version
            type: string

    Returns:
        A dictionary containing the created product specification data.
        If an error occurs, returns an error object with status code and detailed message.
    """
    logger.info("MCP Tool - Creating a new product specification")
    result = await create_product_specification(product_specification_data)

    # Check if the result contains an error object
    if result and "error" in result:
        logger.warning(
            f"Failed to create product specification: {result['error']['detail']}"
        )
        # Return the error with HTTP status code to the MCP client
        return result
    elif result is None:
        logger.warning("Failed to create product specification - no response received")
        return {
            "error": {
                "status": 500,
                "detail": "Failed to create product specification - no response received",
            }
        }

    # Success case
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
    filter: dict = None,
) -> dict:
    """Retrieve product offering information from the TM Forum Product Catalog Management API.

    Args:
        product_offering_id: Optional ID of a specific product offering to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional dictionary of filter criteria to narrow down the results.
               Examples:
               - {"name": "Basic Internet"} - Find product offerings with name containing "Basic Internet"
               - {"lifecycleStatus": "Active"} - Find active product offerings
               - {"name": "Fiber", "lifecycleStatus": "Active"} - Find active product offerings with name containing "Fiber"

    Returns:
        A dictionary containing the product offering data or a list of product offerings.
        Returns an error dictionary if an error occurs.
    """
    if filter:
        logger.info(f"MCP Tool - Getting product offerings with filter: {filter}")
    else:
        logger.info(
            f"MCP Tool - Getting product offering with ID: {product_offering_id if product_offering_id else 'ALL'}"
        )
    result = await get_product_offering(
        product_offering_id=product_offering_id,
        fields=fields,
        offset=offset,
        limit=limit,
        filter=filter,
    )
    if result == None:
        logger.warning("Failed to retrieve product offering data")
        return {"error": "Failed to retrieve product offering data"}
    return result


@mcp.tool()
async def product_offering_create(product_offering_data: dict) -> dict:
    """Create a new product offering in the TM Forum Product Catalog Management API.

    Args:
        product_offering_data: Dictionary containing the product offering data according to the TMF620 specification - see properties below.
        properties:
            '@baseType':
                description: When sub-classing, this defines the super-class
                type: string
            '@schemaLocation':
                description: A URI to a JSON-Schema file that defines additional attributes
                and relationships
                format: uri
                type: string
            '@type':
                description: When sub-classing, this defines the sub-class entity name
                type: string
            agreement:
                description: An agreement represents a contract or arrangement, either written
                or verbal and sometimes enforceable by law, such as a service level agreement
                or a customer price agreement. An agreement involves a number of other business
                entities, such as products, services, and resources and/or their specifications.
                items:
                $ref: '#/definitions/AgreementRef'
                type: array
            attachment:
                description: Complements the description of an element (for instance a product)
                through video, pictures...
                items:
                $ref: '#/definitions/AttachmentRefOrValue'
                type: array
            bundledProductOffering:
                description: A type of ProductOffering that belongs to a grouping of ProductOfferings
                made available to the market. It inherits of all attributes of ProductOffering.
                items:
                $ref: '#/definitions/BundledProductOffering'
                type: array
            category:
                description: The category resource is used to group product offerings, service
                and resource candidates in logical containers. Categories can contain other
                categories and/or product offerings, resource or service candidates.
                items:
                $ref: '#/definitions/CategoryRef'
                type: array
            channel:
                description: The channel defines the channel for selling product offerings.
                items:
                $ref: '#/definitions/ChannelRef'
                type: array
            description:
                description: Description of the productOffering
                type: string
            href:
                description: Reference of the ProductOffering
                type: string
            id:
                description: Unique identifier of the productOffering
                type: string
            isBundle:
                description: isBundle determines whether a productOffering represents a single
                productOffering (false), or a bundle of productOfferings (true).
                type: boolean
            isSellable:
                description: A flag indicating if this product offer can be sold stand-alone
                for sale or not. If this flag is false it indicates that the offer can only
                be sold within a bundle.
                type: boolean
            lastUpdate:
                description: Date and time of the last update
                format: date-time
                type: string
            lifecycleStatus:
                description: Used to indicate the current lifecycle status
                type: string
            marketSegment:
                description: provides references to the corresponding market segment as target
                of product offerings. A market segment is grouping of Parties, GeographicAreas,
                SalesChannels, and so forth.
                items:
                $ref: '#/definitions/MarketSegmentRef'
                type: array
            name:
                description: Name of the productOffering
                type: string
            place:
                description: Place defines the places where the products are sold or delivered.
                items:
                $ref: '#/definitions/PlaceRef'
                type: array
            prodSpecCharValueUse:
                description: A use of the ProductSpecificationCharacteristicValue by a ProductOffering
                to which additional properties (attributes) apply or override the properties
                of similar properties contained in ProductSpecificationCharacteristicValue.
                It should be noted that characteristics which their value(s) addressed by
                this object must exist in corresponding product specification. The available
                characteristic values for a ProductSpecificationCharacteristic in a Product
                specification can be modified at the ProductOffering level. For example,
                a characteristic 'Color' might have values White, Blue, Green, and Red.
                But, the list of values can be restricted to e.g. White and Blue in an associated
                product offering. It should be noted that the list of values in 'ProductSpecificationCharacteristicValueUse'
                is a strict subset of the list of values as defined in the corresponding
                product specification characteristics.
                items:
                $ref: '#/definitions/ProductSpecificationCharacteristicValueUse'
                type: array
            productOfferingPrice:
                description: An amount, usually of money, that is asked for or allowed when
                a ProductOffering is bought, rented, or leased. The price is valid for a
                defined period of time and may not represent the actual price paid by a
                customer.
                items:
                $ref: '#/definitions/ProductOfferingPriceRef'
                type: array
            productOfferingTerm:
                description: A condition under which a ProductOffering is made available to
                Customers. For instance, a productOffering can be offered with multiple
                commitment periods.
                items:
                $ref: '#/definitions/ProductOfferingTerm'
                type: array
            productSpecification:
                $ref: '#/definitions/ProductSpecificationRef'
                description: A ProductSpecification is a detailed description of a tangible
                or intangible object made available externally in the form of a ProductOffering
                to customers or other parties playing a party role.
                type: object
                properties:
                    id:
                        type: string
                    href:
                        type: string
                    name:
                        type: string
            resourceCandidate:
                $ref: '#/definitions/ResourceCandidateRef'
                description: A resource candidate is an entity that makes a ResourceSpecification
                available to a catalog.
                type: object
                properties:
                    id:
                        type: string
                    href:
                        type: string
                    name:
                        type: string
            serviceCandidate:
                $ref: '#/definitions/ServiceCandidateRef'
                description: ServiceCandidate is an entity that makes a ServiceSpecification
                available to a catalog.
                type: object
                properties:
                    id:
                        type: string
                    href:
                        type: string
                    name:
                        type: string
            serviceLevelAgreement:
                $ref: '#/definitions/SLARef'
                description: A service level agreement (SLA) is a type of agreement that represents
                a formal negotiated agreement between two parties designed to create a common
                understanding about products, services, priorities, responsibilities, and
                so forth. The SLA is a set of appropriate procedures and targets formally
                or informally agreed between parties in order to achieve and maintain specified
                Quality of Service.
                type: object
                properties:
                    id:
                        type: string
                    href:
                        type: string
                    name:
                        type: string
            statusReason:
                description: A string providing a complementary information on the value of
                the lifecycle status attribute.
                type: string
            validFor:
                description: The period for which the productOffering is valid
                type: object
                properties:
                    endDateTime:
                        description: End of the time period, using IETC-RFC-3339 format
                        format: date-time
                        type: string
                    startDateTime:
                        description: Start of the time period, using IETC-RFC-3339 format. If you
                        define a start, you must also define an end
                        format: date-time
                        type: string
            version:
                description: ProductOffering version
                type: string

    Returns:
        A dictionary containing the created product offering data.
        If an error occurs, returns an error object with status code and detailed message.
    """
    logger.info("MCP Tool - Creating a new product offering")
    result = await create_product_offering(product_offering_data)

    # Check if the result contains an error object
    if result and "error" in result:
        logger.warning(
            f"Failed to create product offering: {result['error']['detail']}"
        )
        # Return the error with HTTP status code to the MCP client
        return result
    elif result is None:
        logger.warning("Failed to create product offering - no response received")
        return {
            "error": {
                "status": 500,
                "detail": "Failed to create product offering - no response received",
            }
        }

    # Success case
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
    filter: dict = None,
) -> dict:
    """Retrieve product offering price information from the TM Forum Product Catalog Management API.

    Args:
        product_offering_price_id: Optional ID of a specific product offering price to retrieve.
        fields: Optional comma-separated list of field names to include in the response.
        offset: Optional offset for pagination.
        limit: Optional limit for pagination.
        filter: Optional dictionary of filter criteria to narrow down the results.
               Examples:
               - {"name": "Monthly Fee"} - Find product offering prices with name containing "Monthly Fee"
               - {"priceType": "recurring"} - Find recurring product offering prices
               - {"name": "Installation", "priceType": "one time"} - Find one-time installation fees

    Returns:
        A dictionary containing the product offering price data or a list of product offering prices.
        Returns an error dictionary if an error occurs.
    """
    if filter:
        logger.info(f"MCP Tool - Getting product offering prices with filter: {filter}")
    else:
        logger.info(
            f"MCP Tool - Getting product offering price with ID: {product_offering_price_id if product_offering_price_id else 'ALL'}"
        )
    result = await get_product_offering_price(
        product_offering_price_id=product_offering_price_id,
        fields=fields,
        offset=offset,
        limit=limit,
        filter=filter,
    )
    if result == None:
        logger.warning("Failed to retrieve product offering price data")
        return {"error": "Failed to retrieve product offering price data"}
    return result


@mcp.tool()
async def product_offering_price_create(product_offering_price_data: dict) -> dict:
    """Create a new product offering price in the TM Forum Product Catalog Management API.

    Args:
        product_offering_price_data: Dictionary containing the product offering price data according to the TMF620 specification - see properties below.
        properties:
            '@baseType':
                description: the immediate base class type of this product offering
                type: string
            '@schemaLocation':
                description: hyperlink reference to the schema describing this resource
                type: string
            '@type':
                description: The class type of this Product offering
                type: string
            bundledPopRelationship:
                description: this object represents a bundle relationship from a bundle product
                offering price (parent) to a simple product offering price (child). A simple
                product offering price may participate in more than one bundle relationship.
                items:
                $ref: '#/definitions/BundledProductOfferingPriceRelationship'
                type: array
            constraint:
                description: The Constraint resource represents a policy/rule applied to ProductOfferingPrice.
                items:
                $ref: '#/definitions/ConstraintRef'
                type: array
            description:
                description: Description of the productOfferingPrice
                type: string
            href:
                description: Reference of the ProductOfferingPrice
                type: string
            id:
                description: unique id of this resource
                type: string
            isBundle:
                description: A flag indicating if this ProductOfferingPrice is composite (bundle)
                or not
                type: boolean
            lastUpdate:
                description: the last update time of this ProductOfferingPrice
                format: date-time
                type: string
            lifecycleStatus:
                description: the lifecycle status of this ProductOfferingPrice
                type: string
            name:
                description: Name of the productOfferingPrice
                type: string
            percentage:
                description: Percentage to apply for ProductOfferPriceAlteration (Discount)
                format: float
                type: number
            place:
                description: Place defines the places where the products are sold or delivered.
                items:
                $ref: '#/definitions/PlaceRef'
                type: array
            popRelationship:
                description: Product Offering Prices related to this Product Offering Price,
                for example a price alteration such as allowance or discount
                items:
                $ref: '#/definitions/ProductOfferingPriceRelationship'
                type: array
            price:
                $ref: '#/definitions/Money'
                description: The amount of money that characterizes the price.
            priceType:
                description: A category that describes the price, such as recurring, discount,
                allowance, penalty, and so forth.
                type: string
            pricingLogicAlgorithm:
                description: The PricingLogicAlgorithm entity represents an instantiation
                of an interface specification to external rating function (without a modeled
                behavior in SID). Some of the parameters of the interface definition may
                be already set (such as price per unit) and some may be gathered during
                the rating process from the event (such as call duration) or from ProductCharacteristicValues
                (such as assigned bandwidth).
                items:
                $ref: '#/definitions/PricingLogicAlgorithm'
                type: array
            prodSpecCharValueUse:
                description: A use of the ProductSpecificationCharacteristicValue by a ProductOfferingPrice
                to which additional properties (attributes) apply or override the properties
                of similar properties contained in ProductSpecificationCharacteristicValue.
                It should be noted that characteristics which their value(s) addressed by
                this object must exist in corresponding product specification. The available
                characteristic values for a ProductSpecificationCharacteristic in a Product
                specification can be modified at the ProductOffering and ProcuctOfferingPrice
                level. The list of values in ProductSpecificationCharacteristicValueUse
                is a strict subset of the list of values as defined in the corresponding
                product specification characteristics.
                items:
                $ref: '#/definitions/ProductSpecificationCharacteristicValueUse'
                type: array
            productOfferingTerm:
                description: A list of conditions under which a ProductOfferingPrice is made
                available to Customers. For instance, a Product Offering Price can be offered
                with multiple commitment periods.
                items:
                $ref: '#/definitions/ProductOfferingTerm'
                type: array
            recurringChargePeriodLength:
                description: 'the period of the recurring charge:  1, 2, ... .It sets to zero
                if it is not applicable'
                type: integer
            recurringChargePeriodType:
                description: 'The period to repeat the application of the price
                Could be month, week...'
                type: string
            tax:
                description: An amount of money levied on the price of a Product by a legislative
                body.
                items:
                $ref: '#/definitions/TaxItem'
                type: array
            unitOfMeasure:
                $ref: '#/definitions/Quantity'
                description: A number and unit representing how many (for instance 1 dozen)
                of an ProductOffering is available at the offered price. Its meaning depends
                on the priceType. It could be a price, a rate, or a discount.
            validFor:
                description: The period for which the productOfferingPrice is valid
                type: object
                properties:
                    endDateTime:
                        description: End of the time period, using IETC-RFC-3339 format
                        format: date-time
                        type: string
                    startDateTime:
                        description: Start of the time period, using IETC-RFC-3339 format. If you
                        define a start, you must also define an end
                        format: date-time
                        type: string
            version:
                description: ProductOffering version
                type: string

    Returns:
        A dictionary containing the created product offering price data.
        If an error occurs, returns an error object with status code and detailed message.
    """
    logger.info("MCP Tool - Creating a new product offering price")
    result = await create_product_offering_price(product_offering_price_data)

    # Check if the result contains an error object
    if result and "error" in result:
        logger.warning(
            f"Failed to create product offering price: {result['error']['detail']}"
        )
        # Return the error with HTTP status code to the MCP client
        return result
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
# MCP resource examples
# These provides examples of how to define resources and their schemas for the TM Forum Product Catalog Management API.


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


@mcp.resource("schema://tmf620/category")
async def category_schema() -> dict:
    """Define the TMF620 Category resource schema and operations.

    This resource definition follows the TM Forum TMF620 specification for Product Catalog Management.
    """
    logger.info(f"MCP Resource - Getting category schema")
    return {
        "name": "TMF620 Category",
        "description": "TM Forum Product Catalog Management API - Category Resource",
        "resource": {
            "uri": "resource://tmf620/category",
            "schema": {
                "type": "object",
                "description": "The category resource is used to group product offerings, service and resource candidates in logical containers. Categories can contain other categories and/or product offerings, resource or service candidates.",
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
                    "description": {
                        "type": "string",
                        "description": "Description of the category",
                    },
                    "href": {
                        "type": "string",
                        "description": "Reference of the category",
                    },
                    "id": {
                        "type": "string",
                        "description": "Unique identifier of the category",
                    },
                    "isRoot": {
                        "type": "boolean",
                        "description": "If true, this Boolean indicates that the category is a root of categories",
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
                    "name": {
                        "type": "string",
                        "description": "Name of the category",
                    },
                    "parentId": {
                        "type": "string",
                        "description": "Unique identifier of the parent category",
                    },
                    "productOffering": {
                        "type": "array",
                        "description": "A product offering represents entities that are orderable from the provider of the catalog, this resource includes pricing information.",
                        "items": {"$ref": "#/definitions/ProductOfferingRef"},
                    },
                    "subCategory": {
                        "type": "array",
                        "description": "The category resource is used to group product offerings, service and resource candidates in logical containers. Categories can contain other (sub-)categories and/or product offerings.",
                        "items": {"$ref": "#/definitions/CategoryRef"},
                    },
                    "validFor": {
                        "$ref": "#/definitions/TimePeriod",
                        "description": "The period for which the category is valid",
                    },
                    "version": {"type": "string", "description": "Category version"},
                },
            },
            "operations": [
                {
                    "name": "get",
                    "description": "Retrieve category information",
                    "tool": "category_get",
                },
                {
                    "name": "create",
                    "description": "Create a new category",
                    "tool": "category_create",
                },
                {
                    "name": "update",
                    "description": "Update an existing category",
                    "tool": "category_update",
                },
                {
                    "name": "delete",
                    "description": "Delete a category",
                    "tool": "category_delete",
                },
            ],
            "examples": [
                {
                    "name": "Mobile Devices",
                    "description": "Category containing mobile device offerings",
                    "isRoot": True,
                    "version": "1.0",
                    "lifecycleStatus": "Active",
                    "validFor": {
                        "startDateTime": "2025-01-01T00:00:00Z",
                        "endDateTime": "2026-01-01T00:00:00Z",
                    },
                },
                {
                    "name": "Premium Smartphones",
                    "description": "High-end smartphone offerings",
                    "isRoot": False,
                    "parentId": "mobile-devices-category-id",
                    "version": "1.0",
                    "lifecycleStatus": "Active",
                    "validFor": {
                        "startDateTime": "2025-01-15T00:00:00Z",
                        "endDateTime": "2025-12-31T23:59:59Z",
                    },
                },
            ],
        },
    }


@mcp.resource("schema://tmf620/productSpecification")
async def product_specification_schema() -> dict:
    """Define the TMF620 ProductSpecification resource schema and operations.

    This resource definition follows the TM Forum TMF620 specification for Product Catalog Management.
    """
    logger.info(f"MCP Resource - Getting product specification schema")
    return {
        "name": "TMF620 Product Specification",
        "description": "TM Forum Product Catalog Management API - Product Specification Resource",
        "resource": {
            "uri": "resource://tmf620/productSpecification",
            "schema": {
                "type": "object",
                "description": "A detailed description of a tangible or intangible object made available externally in the form of a ProductOffering to customers or other parties playing a party role.",
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
                    "brand": {
                        "type": "string",
                        "description": "The manufacturer or trademark of the specification",
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of the product specification",
                    },
                    "href": {
                        "type": "string",
                        "description": "Reference of the product specification",
                    },
                    "id": {
                        "type": "string",
                        "description": "Unique identifier of the product specification",
                    },
                    "isBundle": {
                        "type": "boolean",
                        "description": "Indicates if the specification refers to a product bundle (true) or to a single product (false)",
                    },
                    "lastUpdate": {
                        "type": "string",
                        "format": "date-time",
                        "description": "Date and time of the last update",
                    },
                    "lifecycleStatus": {
                        "type": "string",
                        "description": "Used to indicate the current lifecycle status of the product specification",
                    },
                    "name": {
                        "type": "string",
                        "description": "Name of the product specification",
                    },
                    "productNumber": {
                        "type": "string",
                        "description": "An identification number assigned to uniquely identify the specification",
                    },
                    "version": {
                        "type": "string",
                        "description": "Product specification version",
                    },
                    "attachment": {
                        "type": "array",
                        "description": "Complements the description of an element (for instance a product) through video, pictures",
                        "items": {"$ref": "#/definitions/AttachmentRef"},
                    },
                    "bundledProductSpecification": {
                        "type": "array",
                        "description": "A list of product specifications for product bundles",
                        "items": {"$ref": "#/definitions/BundledProductSpecification"},
                    },
                    "productSpecCharacteristic": {
                        "type": "array",
                        "description": "A characteristic that defines a product specification or product offering for management or product selection purposes",
                        "items": {
                            "$ref": "#/definitions/ProductSpecificationCharacteristic"
                        },
                    },
                    "productSpecificationRelationship": {
                        "type": "array",
                        "description": "A relationship between this product specification and another product specification",
                        "items": {
                            "$ref": "#/definitions/ProductSpecificationRelationship"
                        },
                    },
                    "relatedParty": {
                        "type": "array",
                        "description": "A related party defines party or party role linked to a specific entity",
                        "items": {"$ref": "#/definitions/RelatedParty"},
                    },
                    "resourceSpecification": {
                        "type": "array",
                        "description": "The ResourceSpecification is required to realize a ProductSpecification.",
                        "items": {"$ref": "#/definitions/ResourceSpecificationRef"},
                    },
                    "serviceSpecification": {
                        "type": "array",
                        "description": "The service specification is required to realize a product specification.",
                        "items": {"$ref": "#/definitions/ServiceSpecificationRef"},
                    },
                    "targetProductSchema": {
                        "$ref": "#/definitions/TargetProductSchema",
                        "description": "A target product schema reference. The reference object to the schema and type of target product which is described by product specification.",
                    },
                    "validFor": {
                        "$ref": "#/definitions/TimePeriod",
                        "description": "The period for which the product specification is valid",
                    },
                },
            },
            "operations": [
                {
                    "name": "get",
                    "description": "Retrieve product specification information",
                    "tool": "product_specification_get",
                },
                {
                    "name": "create",
                    "description": "Create a new product specification",
                    "tool": "product_specification_create",
                },
                {
                    "name": "update",
                    "description": "Update an existing product specification",
                    "tool": "product_specification_update",
                },
                {
                    "name": "delete",
                    "description": "Delete a product specification",
                    "tool": "product_specification_delete",
                },
            ],
            "examples": [
                {
                    "name": "5G Unlimited Plan",
                    "description": "High-speed unlimited 5G data plan for mobile devices",
                    "isBundle": False,
                    "version": "1.0",
                    "brand": "TelcoNet",
                    "productNumber": "5G-UNL-100",
                    "lifecycleStatus": "Active",
                    "validFor": {
                        "startDateTime": "2025-01-01T00:00:00Z",
                        "endDateTime": "2026-01-01T00:00:00Z",
                    },
                    "productSpecCharacteristic": [
                        {
                            "name": "Data Limit",
                            "description": "Monthly data allowance",
                            "valueType": "string",
                            "productSpecCharacteristicValue": [
                                {"isDefault": True, "value": "Unlimited"}
                            ],
                        },
                        {
                            "name": "Speed Cap",
                            "description": "Maximum download speed",
                            "valueType": "string",
                            "productSpecCharacteristicValue": [
                                {"isDefault": True, "value": "No Cap"}
                            ],
                        },
                    ],
                },
                {
                    "name": "Enterprise Network Security Suite",
                    "description": "Comprehensive network security solution for enterprise customers",
                    "isBundle": True,
                    "brand": "SecureWorks",
                    "productNumber": "ENT-SEC-500",
                    "version": "2.5",
                    "lifecycleStatus": "Active",
                    "validFor": {
                        "startDateTime": "2025-02-15T00:00:00Z",
                        "endDateTime": "2026-02-15T00:00:00Z",
                    },
                    "bundledProductSpecification": [
                        {"name": "Firewall Protection", "id": "FW-100"},
                        {"name": "Intrusion Detection System", "id": "IDS-200"},
                        {"name": "Malware Protection", "id": "MP-300"},
                    ],
                },
            ],
        },
    }


@mcp.resource("schema://tmf620/productOffering")
async def product_offering_schema() -> dict:
    """Define the TMF620 ProductOffering resource schema and operations.

    This resource definition follows the TM Forum TMF620 specification for Product Catalog Management.
    """
    logger.info(f"MCP Resource - Getting productOffering schema")
    return {
        "name": "TMF620 ProductOffering",
        "description": "TM Forum Product Catalog Management API - ProductOffering Resource",
        "resource": {
            "uri": "resource://tmf620/productOffering",
            "schema": {
                "type": "object",
                "description": "A sellable item defined by its production specification, commercial terms, and additional services",
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
                    "name": {
                        "type": "string",
                        "description": "Name of the product offering",
                    },
                    "description": {
                        "type": "string",
                        "description": "Description of the product offering",
                    },
                    "version": {
                        "type": "string",
                        "description": "Product offering version",
                    },
                    "validFor": {
                        "$ref": "#/definitions/TimePeriod",
                        "description": "The period for which the product offering is valid",
                    },
                    "isBundle": {
                        "type": "boolean",
                        "description": "Indicates if the offering is a bundle of other offerings",
                    },
                    "isSellable": {
                        "type": "boolean",
                        "description": "Indicates if this product offering can be sold separately",
                    },
                    "statusReason": {
                        "type": "string",
                        "description": "Reason for the current status",
                    },
                    "place": {
                        "type": "array",
                        "description": "Geographic areas where this product offering is available",
                        "items": {"$ref": "#/definitions/PlaceRef"},
                    },
                    "serviceLevelAgreement": {
                        "$ref": "#/definitions/ServiceLevelAgreementRef",
                        "description": "The SLA applicable for this product offering",
                    },
                    "productSpecification": {
                        "$ref": "#/definitions/ProductSpecificationRef",
                        "description": "The specification of the product that is the basis of this offering",
                    },
                    "channel": {
                        "type": "array",
                        "description": "Sales channels for this product offering",
                        "items": {"$ref": "#/definitions/ChannelRef"},
                    },
                    "serviceCandidate": {
                        "$ref": "#/definitions/ServiceCandidateRef",
                        "description": "Service candidate associated with this offering",
                    },
                    "category": {
                        "type": "array",
                        "description": "Categories for this product offering",
                        "items": {"$ref": "#/definitions/CategoryRef"},
                    },
                    "resourceCandidate": {
                        "$ref": "#/definitions/ResourceCandidateRef",
                        "description": "Resource candidate associated with this offering",
                    },
                    "productOfferingTerm": {
                        "type": "array",
                        "description": "Terms for this product offering",
                        "items": {"$ref": "#/definitions/ProductOfferingTerm"},
                    },
                    "productOfferingPrice": {
                        "type": "array",
                        "description": "Pricing for this product offering",
                        "items": {"$ref": "#/definitions/ProductOfferingPriceRef"},
                    },
                    "attachment": {
                        "type": "array",
                        "description": "Complements the description through video, pictures, etc.",
                        "items": {"$ref": "#/definitions/AttachmentRef"},
                    },
                    "marketSegment": {
                        "type": "array",
                        "description": "Target market segments for this product offering",
                        "items": {"$ref": "#/definitions/MarketSegmentRef"},
                    },
                    "prodSpecCharValueUse": {
                        "type": "array",
                        "description": "Characteristic values available for this product offering",
                        "items": {
                            "$ref": "#/definitions/ProductSpecificationCharacteristicValueUse"
                        },
                    },
                    "id": {
                        "type": "string",
                        "description": "Unique identifier of the product offering",
                    },
                    "href": {
                        "type": "string",
                        "description": "Reference of the product offering",
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
                },
            },
            "operations": [
                {
                    "name": "get",
                    "description": "Retrieve product offering information",
                    "tool": "product_offering_get",
                },
                {
                    "name": "create",
                    "description": "Create a new product offering",
                    "tool": "product_offering_create",
                },
                {
                    "name": "update",
                    "description": "Update an existing product offering",
                    "tool": "product_offering_update",
                },
                {
                    "name": "delete",
                    "description": "Delete a product offering",
                    "tool": "product_offering_delete",
                },
            ],
            "examples": [
                {
                    "name": "Basic Firewall for Business",
                    "description": "This product offering suggests a firewall service that can be deployed in business customer premise.",
                    "version": "1.0",
                    "validFor": {
                        "startDateTime": "2017-08-23T00:00",
                        "endDateTime": "2018-03-25T00:00",
                    },
                    "isBundle": False,
                    "isSellable": True,
                    "statusReason": "Released for sale",
                    "productSpecification": {
                        "id": "9881",
                        "href": "https://mycsp.com:8080/tmf-api/productCatalogManagement/v4/productSpecification/9881",
                        "version": "1.1",
                        "name": "Robotics999",
                        "@referredType": "DeviceSpecification",
                    },
                    "@type": "ProductOffering",
                },
                {
                    "name": "Premium Enterprise Firewall Suite",
                    "description": "High-performance firewall service for enterprise customers with 24/7 support",
                    "version": "1.0",
                    "validFor": {
                        "startDateTime": "2025-01-01T00:00:00Z",
                        "endDateTime": "2026-01-01T00:00:00Z",
                    },
                    "isBundle": True,
                    "isSellable": True,
                    "statusReason": "New Release",
                    "lifecycleStatus": "Active",
                    "@type": "ProductOffering",
                },
                {
                    "name": "Enterprise Cloud Storage Solution",
                    "description": "Scalable enterprise cloud storage offering with 99.999% uptime SLA",
                    "version": "1.0",
                    "isBundle": False,
                    "isSellable": True,
                    "statusReason": "New Release",
                    "productSpecification": {
                        "id": "206",
                        "href": "/productCatalogManagement/v4/productSpecification/206",
                        "name": "Enterprise Cloud Storage",
                    },
                    "lifecycleStatus": "Active",
                },
            ],
        },
    }


@mcp.resource("schema://tmf620/productOfferingPrice")
async def product_offering_price_schema() -> dict:
    """Define the TMF620 ProductOfferingPrice resource schema and operations.

    This resource definition follows the TM Forum TMF620 specification for Product Catalog Management.
    """
    logger.info(f"MCP Resource - Getting productOfferingPrice schema")
    return {
        "name": "TMF620 ProductOfferingPrice",
        "description": "TM Forum Product Catalog Management API - ProductOfferingPrice Resource",
        "resource": {
            "uri": "resource://tmf620/productOfferingPrice",
            "schema": {
                "type": "object",
                "description": "An amount, usually of money, that represents the actual price paid by a Customer for a purchase, a rent or a lease of a Product. The price is valid for a defined period of time.",
                "properties": {
                    "@baseType": {
                        "description": "the immediate base class type of this product offering",
                        "type": "string",
                    },
                    "@schemaLocation": {
                        "description": "hyperlink reference to the schema describing this resource",
                        "type": "string",
                    },
                    "@type": {
                        "description": "The class type of this Product offering",
                        "type": "string",
                    },
                    "bundledPopRelationship": {
                        "description": "this object represents a bundle relationship from a bundle product offering price (parent) to a simple product offering price (child). A simple product offering price may participate in more than one bundle relationship.' items: $ref: ",
                        "type": "array",
                    },
                    "constraint": {
                        "description": "The Constraint resource represents a policy/rule applied to ProductOfferingPrice.",
                        "items": {
                            "$ref": "#/definitions/ConstraintRef",
                            "type": "array",
                        },
                    },
                    "description": {
                        "description": "Description of the productOfferingPrice",
                        "type": "string",
                    },
                    "href": {
                        "description": "Reference of the ProductOfferingPrice",
                        "type": "string",
                    },
                    "id": {
                        "description": "unique id of this resource",
                        "type": "string",
                    },
                    "isBundle": {
                        "description": "A flag indicating if this ProductOfferingPrice is composite (bundle) or not",
                        "type": "boolean",
                    },
                    "lastUpdate": {
                        "description": "the last update time of this ProductOfferingPrice",
                        "format": "date-time",
                        "type": "string",
                    },
                    "lifecycleStatus": {
                        "description": "the lifecycle status of this ProductOfferingPrice",
                        "type": "string",
                    },
                    "name": {
                        "description": "Name of the productOfferingPrice",
                        "type": "string",
                    },
                    "percentage": {
                        "description": "Percentage to apply for ProductOfferPriceAlteration (Discount)",
                        "format": "float",
                        "type": "number",
                    },
                    "place": {
                        "description": "Place defines the places where the products are sold or delivered.",
                        "items": {"$ref": "#/definitions/PlaceRef", "type": "array"},
                    },
                    "popRelationship": {
                        "description": "Product Offering Prices related to this Product Offering Price, for example a price alteration such as allowance or discount",
                        "items": {
                            "$ref": "#/definitions/ProductOfferingPriceRelationship",
                            "type": "array",
                        },
                    },
                    "price": {
                        "$ref": "#/definitions/Money",
                        "description": "The amount of money that characterizes the price.",
                    },
                    "priceType": {
                        "description": "A category that describes the price, such as recurring, discount, allowance, penalty, and so forth.",
                        "type": "string",
                    },
                    "pricingLogicAlgorithm": {
                        "description": "The PricingLogicAlgorithm entity represents an instantiation of an interface specification to external rating function (without a modeled behavior in SID). Some of the parameters of the interface definition may be already set (such as price per unit) and some may be gathered during the rating process from the event (such as call duration) or from ProductCharacteristicValues (such as assigned bandwidth).",
                        "items": {
                            "$ref": "#/definitions/PricingLogicAlgorithm",
                            "type": "array",
                        },
                    },
                    "prodSpecCharValueUse": {
                        "description": "A use of the ProductSpecificationCharacteristicValue by a ProductOfferingPrice to which additional properties (attributes) apply or override the properties of similar properties contained in ProductSpecificationCharacteristicValue. It should be noted that characteristics which their value(s) addressed by this object must exist in corresponding product specification. The available characteristic values for a ProductSpecificationCharacteristic in a Product specification can be modified at the ProductOffering and ProcuctOfferingPrice level. The list of values in ProductSpecificationCharacteristicValueUse is a strict subset of the list of values as defined in the corresponding product specification characteristics.",
                        "items": {
                            "$ref": "#/definitions/ProductSpecificationCharacteristicValueUse",
                            "type": "array",
                        },
                    },
                    "productOfferingTerm": {
                        "description": "A list of conditions under which a ProductOfferingPrice is made available to Customers. For instance, a Product Offering Price can be offered with multiple commitment periods.",
                        "items": {
                            "$ref": "#/definitions/ProductOfferingTerm",
                            "type": "array",
                        },
                    },
                    "recurringChargePeriodLength": {
                        "description": "the period of the recurring charge:  1, 2, ... .It sets to zero if it is not applicable",
                        "type": "integer",
                    },
                    "recurringChargePeriodType": {
                        "description": "The period to repeat the application of the price Could be month, week...",
                        "type": "string",
                    },
                    "tax": {
                        "description": "An amount of money levied on the price of a Product by a legislative body.",
                        "items": {"$ref": "#/definitions/TaxItem", "type": "array"},
                    },
                    "unitOfMeasure": {
                        "$ref": "#/definitions/Quantity",
                        "description": "A number and unit representing how many (for instance 1 dozen) of an ProductOffering is available at the offered price. Its meaning depends on the priceType. It could be a price, a rate, or a discount.",
                    },
                    "validFor": {
                        "$ref": "#/definitions/TimePeriod",
                        "description": "The period for which the productOfferingPrice is valid",
                    },
                    "version": {
                        "description": "ProductOffering version",
                        "type": "string",
                    },
                },
            },
            "operations": [
                {
                    "name": "get",
                    "description": "Retrieve product offering price information",
                    "tool": "product_offering_price_get",
                },
                {
                    "name": "create",
                    "description": "Create a new product offering price",
                    "tool": "product_offering_price_create",
                },
                {
                    "name": "update",
                    "description": "Update an existing product offering price",
                    "tool": "product_offering_price_update",
                },
                {
                    "name": "delete",
                    "description": "Delete a product offering price",
                    "tool": "product_offering_price_delete",
                },
            ],
            "examples": [
                {
                    "name": "Recurring Charge for Business Firewall",
                    "description": "This pricing describes the recurring charge for a firewall service that can be deployed in business customer premise.",
                    "version": "2.1",
                    "validFor": {
                        "startDateTime": "2017-08-23T00:00",
                        "endDateTime": "2018-03-25T00:00",
                    },
                    "priceType": "recurring",
                    "recurringChargePeriodType": "monthly",
                    "recurringChargePeriodLength": 1,
                    "isBundle": False,
                    "price": {"unit": "EUR", "amount": 50},
                    "percentage": 0.0,
                    "@type": "ProductOfferingPrice",
                },
                {
                    "name": "One-time Installation Fee",
                    "description": "One-time installation and configuration fee for enterprise firewall solution",
                    "version": "1.0",
                    "priceType": "one time",
                    "isBundle": False,
                    "price": {"unit": "USD", "amount": 499},
                    "lifecycleStatus": "Active",
                },
            ],
        },
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
def create_product_specification_prompt(
    name: str,
    description: str,
    is_bundle: bool = False,
    brand: str = None,
    product_number: str = None,
    lifecycle_status: str = "Active",
    version: str = "1.0",
) -> str:
    """Create a prompt template for guiding a user through creating a new product specification.

    Args:
        name: Name of the product specification (required by TMF620)
        description: A narrative that explains in detail what the product specification is
        is_bundle: Indicates if this is a bundle of product specifications (default: False)
        brand: The manufacturer or trademark of the specification (optional)
        product_number: An identification number assigned to uniquely identify the specification (optional)
        lifecycle_status: Used to indicate the current lifecycle status (default: Active)
        version: Product specification version (default: 1.0)

    Returns:
        A prompt template string for guiding a user to create a product specification
    """
    # Set default dates for the validity period (1 year from now)
    validity_start = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%S.000+00:00"
    )
    validity_end = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
    ).strftime("%Y-%m-%dT%H:%M:%S.000+00:00")

    # Initialize empty arrays for optional complex attributes
    attachments = []
    bundled_product_specifications = []
    product_spec_characteristics = []
    product_specification_relationships = []
    related_parties = []
    resource_specifications = []
    service_specifications = []

    # Create the product specification JSON structure based on TMF620 schema
    product_spec_data = {
        "name": name,
        "description": description,
        "isBundle": is_bundle,
        "lifecycleStatus": lifecycle_status,
        "version": version,
        "validFor": {"startDateTime": validity_start, "endDateTime": validity_end},
    }

    # Add optional attributes if provided
    if brand:
        product_spec_data["brand"] = brand
    if product_number:
        product_spec_data["productNumber"] = product_number

    # Add empty arrays for complex attributes
    product_spec_data["attachment"] = attachments
    product_spec_data["productSpecCharacteristic"] = product_spec_characteristics
    product_spec_data["relatedParty"] = related_parties

    # Add bundle-specific attributes if it's a bundle
    if is_bundle:
        product_spec_data["bundledProductSpecification"] = (
            bundled_product_specifications
        )

    # Format the product specification data as a readable JSON string
    formatted_json = json.dumps(product_spec_data, indent=2)

    # Example characteristic structure for documentation
    characteristic_example = {
        "name": "Color",
        "description": "Color of the product",
        "valueType": "String",
        "configurable": True,
        "productSpecCharacteristicValue": [
            {"valueType": "String", "value": "Black", "isDefault": True},
            {"valueType": "String", "value": "White", "isDefault": False},
        ],
    }

    # Example attachment structure for documentation
    attachment_example = {
        "description": "Product Manual",
        "mimeType": "application/pdf",
        "url": "https://example.com/manual.pdf",
        "name": "User Manual",
    }

    # Example related party structure for documentation
    related_party_example = {
        "id": "party-id",
        "href": "https://api-url/party/party-id",
        "name": "Acme Inc",
        "role": "Manufacturer",
        "@referredType": "Organization",
    }

    # Example bundled product spec structure for documentation
    bundled_product_spec_example = {
        "id": "product-spec-id",
        "href": "https://api-url/productSpecification/product-spec-id",
        "name": "Component Product",
        "lifecycleStatus": "Active",
    }

    # Create the prompt template with all TM Forum TMF620 product specification attributes
    return f"""
I want to create a new product specification in the Product Catalog Management system with the following details:

- Name: {name}
- Description: {description}
- Bundle: {"Yes" if is_bundle else "No"}
{"- Brand: " + brand if brand else ""}
{"- Product Number: " + product_number if product_number else ""}
- Lifecycle Status: {lifecycle_status}
- Version: {version}
- Valid from: {validity_start} to {validity_end}

The product specification follows the TMF620 schema with these attributes:
* name - Name of the product specification (required)
* description - A narrative that explains in detail what the product specification is
* isBundle - Determines whether this represents a single product specification (false) or a bundle (true)
* brand - The manufacturer or trademark of the specification
* productNumber - An identification number assigned to uniquely identify the specification
* lifecycleStatus - Used to indicate the current lifecycle status (e.g., Active, Deprecated)
* version - Product specification version
* validFor - The period for which the product specification is valid (startDateTime and endDateTime)
* attachment - Complements the description through video, pictures, etc. (can be empty)
* productSpecCharacteristic - Characteristics and features of the product specification (can be empty)
* productSpecificationRelationship - Relationships with other product specifications (can be empty)
* relatedParty - Parties involved in the product specification (can be empty)
* resourceSpecification - Required resources to realize this product specification (can be empty)
* serviceSpecification - Required services to realize this product specification (can be empty)

To add characteristics to this product specification, you can use structures like:
```json
{json.dumps(characteristic_example, indent=2)}
```

To add attachments, you can use structures like:
```json
{json.dumps(attachment_example, indent=2)}
```

To add related parties, you can use structures like:
```json
{json.dumps(related_party_example, indent=2)}
```

{"To add bundled product specifications, you can use structures like:\n```json\n" + json.dumps(bundled_product_spec_example, indent=2) + "\n```\n" if is_bundle else ""}

Here's my complete product specification definition:
```json
{formatted_json}
```

Please help me create this product specification in the system.
"""


@mcp.prompt()
def create_product_offering_prompt(
    name: str,
    description: str,
    is_bundle: bool = False,
    is_sellable: bool = True,
    lifecycle_status: str = "Active",
    version: str = "1.0",
    product_specification_id: str = None,
    product_specification_name: str = None,
) -> str:
    """Create a prompt template for guiding a user through creating a new product offering.

    Args:
        name: Name of the product offering (required by TMF620)
        description: A narrative that explains the product offering
        is_bundle: If true, the product offering is a bundle of other offerings
        is_sellable: If true, this product offering can be sold separately
        lifecycle_status: Used to indicate the current lifecycle status
        version: Product offering version
        product_specification_id: Optional ID of a product specification to link
        product_specification_name: Optional name of the product specification to link

    Returns:
        A prompt template string for guiding a user to create a product offering
    """
    # Set default dates for the validity period (1 year from now)
    validity_start = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%S.000+00:00"
    )
    validity_end = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
    ).strftime("%Y-%m-%dT%H:%M:%S.000+00:00")

    # Initialize empty arrays for optional complex attributes
    attachments = []
    channels = []
    market_segments = []
    places = []
    prod_spec_char_value_uses = []

    # Create the product offering JSON structure based on TMF620 schema
    product_offering_data = {
        "name": name,
        "description": description,
        "isBundle": is_bundle,
        "isSellable": is_sellable,
        "lifecycleStatus": lifecycle_status,
        "version": version,
        "validFor": {"startDateTime": validity_start, "endDateTime": validity_end},
    }

    # Add product specification reference if provided
    if product_specification_id and product_specification_name:
        product_offering_data["productSpecification"] = {
            "id": product_specification_id,
            "href": f"https://api-url/productSpecification/{product_specification_id}",
            "name": product_specification_name,
            "version": "1.0",
            "@referredType": "ProductSpecification",
        }

    # Add empty arrays for complex attributes
    product_offering_data["attachment"] = attachments
    product_offering_data["channel"] = channels
    product_offering_data["marketSegment"] = market_segments
    product_offering_data["place"] = places
    product_offering_data["prodSpecCharValueUse"] = prod_spec_char_value_uses

    # Format the product offering data as a readable JSON string
    formatted_json = json.dumps(product_offering_data, indent=2)

    # Example attachment structure for documentation
    attachment_example = {
        "description": "Product Brochure",
        "url": "https://example.com/brochures/product123.pdf",
        "name": "Product Brochure",
    }

    # Example channel structure for documentation
    channel_example = {
        "id": "channel-id",
        "href": "https://api-url/channel/channel-id",
        "name": "Online Store",
        "@referredType": "Channel",
    }

    # Example market segment structure for documentation
    market_segment_example = {
        "id": "segment-id",
        "href": "https://api-url/marketSegment/segment-id",
        "name": "Enterprise",
        "@referredType": "MarketSegment",
    }

    # Example place structure for documentation
    place_example = {
        "id": "place-id",
        "href": "https://api-url/geographicAddress/place-id",
        "name": "North America",
        "@referredType": "GeographicAddress",
    }

    # Example characteristic value use structure
    characteristic_value_example = {
        "name": "Storage",
        "description": "Storage capacity",
        "valueType": "number",
        "minCardinality": 1,
        "maxCardinality": 1,
        "productSpecCharacteristicValue": [
            {
                "valueType": "number",
                "value": "500",
                "unitOfMeasure": "GB",
                "isDefault": True,
            }
        ],
    }

    # Create the prompt template with all TM Forum TMF620 product offering attributes
    return f"""
I want to create a new product offering in the Product Catalog Management system with the following details:

- Name: {name}
- Description: {description}
- Bundle: {"Yes" if is_bundle else "No"}
- Sellable: {"Yes" if is_sellable else "No"}
- Lifecycle Status: {lifecycle_status}
- Version: {version}
- Valid from: {validity_start} to {validity_end}
{"- Linked to Product Specification: " + product_specification_name + " (ID: " + product_specification_id + ")" if product_specification_id and product_specification_name else ""}

The product offering follows the TMF620 schema with these attributes:
* name - Name of the product offering (required)
* description - A narrative that explains the product offering
* isBundle - Indicates if the offering is a bundle of other offerings
* isSellable - Indicates if this product offering can be sold separately
* lifecycleStatus - Used to indicate the current lifecycle status
* version - Product offering version
* validFor - The period for which the offering is valid (startDateTime and endDateTime)
* productSpecification - The specification of the product that is the basis of this offering
* attachment - Complements the description through video, pictures, etc. (can be empty)
* channel - Sales channel for this product offering (can be empty)
* marketSegment - Target market segments for this product offering (can be empty)
* place - Geographic areas where this product offering is available (can be empty)
* prodSpecCharValueUse - Characteristic values available for this product offering (can be empty)

To add attachments, you can use structures like:
```json
{json.dumps(attachment_example, indent=2)}
```

To add sales channels, you can use structures like:
```json
{json.dumps(channel_example, indent=2)}
```

To add market segments, you can use structures like:
```json
{json.dumps(market_segment_example, indent=2)}
```

To add places (geographic availability), you can use structures like:
```json
{json.dumps(place_example, indent=2)}
```

To add characteristic values, you can use structures like:
```json
{json.dumps(characteristic_value_example, indent=2)}
```

Here's my complete product offering definition:
```json
{formatted_json}
```

Please help me create this product offering in the system.
"""


@mcp.prompt()
def create_product_offering_price_prompt(
    name: str,
    description: str,
    price_type: str = "recurring",
    price_unit: str = "USD",
    price_value: float = 0.0,
    recurring_charge_period: str = None,
    percentage: float = None,
    product_offering_id: str = None,
    product_offering_name: str = None,
    lifecycle_status: str = "Active",
) -> str:
    """Create a prompt template for guiding a user through creating a new product offering price.

    Args:
        name: Name of the product offering price
        description: A narrative that explains the product offering price
        price_type: Type of price (recurring, one time, usage, etc)
        price_unit: Currency unit for the price (USD, EUR, etc)
        price_value: The value of the price
        recurring_charge_period: Required for recurring prices (month, year, etc)
        percentage: Percentage value if this is a discount or fee
        product_offering_id: Optional ID of the product offering this price applies to
        product_offering_name: Optional name of the product offering this price applies to
        lifecycle_status: Used to indicate the current lifecycle status

    Returns:
        A prompt template string for guiding a user to create a product offering price
    """
    # Set default dates for the validity period (1 year from now)
    validity_start = datetime.datetime.now(datetime.timezone.utc).strftime(
        "%Y-%m-%dT%H:%M:%S.000+00:00"
    )
    validity_end = (
        datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=365)
    ).strftime("%Y-%m-%dT%H:%M:%S.000+00:00")

    # Initialize the price object based on the price type
    price = {
        "unit": price_unit,
        "value": price_value,
    }

    # Add recurring charge period if applicable
    if price_type == "recurring" and recurring_charge_period:
        price["recurringChargePeriod"] = recurring_charge_period

    # Add percentage if provided
    if percentage is not None:
        price["percentage"] = percentage

    # Create the product offering price JSON structure based on TMF620 schema
    price_data = {
        "name": name,
        "description": description,
        "priceType": price_type,
        "lifecycleStatus": lifecycle_status,
        "validFor": {"startDateTime": validity_start, "endDateTime": validity_end},
        "price": price,
    }

    # Add product offering reference if provided
    if product_offering_id and product_offering_name:
        price_data["productOffering"] = {
            "id": product_offering_id,
            "href": f"https://api-url/productOffering/{product_offering_id}",
            "name": product_offering_name,
        }

    # Format the product offering price data as a readable JSON string
    formatted_json = json.dumps(price_data, indent=2)

    # Example price alterations structure for documentation
    price_alteration_example = {
        "name": "Winter Promotion Discount",
        "description": "10% discount for the winter season",
        "priceType": "discount",
        "priority": 1,
        "price": {"percentage": 10.0},
        "validFor": {
            "startDateTime": "2023-12-01T00:00:00.000+00:00",
            "endDateTime": "2024-02-29T23:59:59.000+00:00",
        },
    }

    # Use triple quotes for the JSON code blocks to avoid f-string issues
    price_alteration_json = json.dumps(price_alteration_example, indent=2)

    # Create the prompt template
    return f"""
I want to create a new product offering price in the Product Catalog Management system with the following details:

- Name: {name}
- Description: {description}
- Price Type: {price_type.title()}
- Price: {price_value} {price_unit}
{"- Recurring Charge Period: " + recurring_charge_period if price_type == "recurring" and recurring_charge_period else ""}
{"- Percentage: " + str(percentage) + "%" if percentage is not None else ""}
{"- For Product Offering: " + product_offering_name + " (ID: " + product_offering_id + ")" if product_offering_id and product_offering_name else ""}
- Lifecycle Status: {lifecycle_status}
- Valid from: {validity_start} to {validity_end}

The product offering price follows the TMF620 schema with these attributes:
* name - Name of the product offering price (required)
* description - A narrative that explains the product offering price
* priceType - Indicates the price type (recurring, one time, usage, etc.)
* lifecycleStatus - Used to indicate the current lifecycle status
* validFor - The period for which the price is valid (startDateTime and endDateTime)
* price - The price details including unit, value, and optional percentage or recurring charge period
* productOffering - The product offering this price applies to (optional)
* priceAlteration - Any alterations to the price such as discounts or fees (optional)

To add price alterations, you can use structures like:

{price_alteration_json}

Here's my complete product offering price definition:

{formatted_json}

Please help me create this product offering price in the system.
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


@mcp.prompt()
def list_product_offerings_prompt() -> str:
    """Create a prompt template for listing all available product offerings."""
    return """
I need to see all product offerings currently available in the catalog.

Please provide a list with the following details for each offering:
- ID and name
- Description
- Status and version
- Associated prices
- Related product specifications

This will help me understand what offerings are already defined in the system.
"""


@mcp.prompt()
def list_product_specifications_prompt() -> str:
    """Create a prompt template for listing all available product specifications."""
    return """
I need to see all product specifications currently defined in the catalog.

Please provide a complete list with the following details:
- ID and name
- Description
- Key characteristics and their values
- Lifecycle status and version
- Related product specifications (if any)

This will help me understand what specifications are available for creating new offerings.
"""


@mcp.prompt()
def search_offerings_by_name_prompt(name_pattern: str) -> str:
    """Create a prompt template for searching product offerings by name pattern.

    Args:
        name_pattern: A string pattern to match against product offering names

    Returns:
        A prompt template string for searching product offerings by name
    """
    return f"""
I want to find all product offerings with names matching the pattern: {name_pattern}

Please provide a list of matching offerings with:
- ID and name
- Description
- Status and version
- Price summary

This will help me locate specific offerings I need to work with.
"""


@mcp.prompt()
def find_product_specification_for_offering_prompt() -> str:
    """Create a prompt template for finding a product specification to link to a product offering."""
    return """
I need to find an appropriate product specification to link to my new product offering.

Please show me a list of available product specifications with the following details:
- ID and name
- Description
- Key characteristics
- Version and lifecycle status

I'll select one from the list to use when creating my product offering.
"""


@mcp.prompt()
def get_usage_help_prompt() -> str:
    """Create a prompt template for getting help using the TMF620 Product Catalog MCP server."""
    return """
I need help using the TMF620 Product Catalog Management API. Can you please explain:

1. The main resource types available (Catalog, Category, ProductSpecification, ProductOffering, ProductOfferingPrice)
2. The hierarchical relationships between these resources
3. Common operations I can perform
4. Example workflows for creating a complete product catalog structure

Please provide both explanations and example commands I can use with this MCP server.
"""


@mcp.prompt()
def search_product_specifications_by_characteristics_prompt() -> str:
    """Create a prompt template for searching product specifications by characteristics."""
    return """
I want to find product specifications based on specific characteristics.

Please search for product specifications that match the following criteria:
- Characteristic name: [provide characteristic name, e.g., "Data Limit"]
- Characteristic value: [provide value to search for, e.g., "Unlimited"]

Additional filters (optional):
- Brand: [specify brand if needed]
- Lifecycle status: [specify status if needed, e.g., "Active"]
- Is bundle: [yes/no/either]
- Valid as of date: [specify a date if needed, default is current date]

Please provide a list of matching product specifications with:
- ID and name
- Description
- Key characteristics and their values
- Version and lifecycle status
"""


@mcp.prompt()
def compare_product_specifications_prompt() -> str:
    """Create a prompt template for comparing multiple product specifications."""
    return """
I need to compare multiple product specifications to understand their differences.

Please compare the following product specifications:
- [First product specification ID or name]
- [Second product specification ID or name]
- [Add more if needed]

For each product specification, please provide:
1. Basic information (name, description, brand, version, lifecycle status)
2. All characteristics with their values
3. Any bundled product specifications (if applicable)

Then please create a comparison table showing:
- Key differences in characteristics and their values
- Advantages and disadvantages of each product specification
- Recommendations based on typical use cases

This will help me understand the differences between these product specifications.
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
