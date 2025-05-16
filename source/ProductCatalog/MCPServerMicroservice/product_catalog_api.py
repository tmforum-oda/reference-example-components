# Product Catalog API module for making requests to Product Catalog Component
import logging
from pathlib import Path
import json
import httpx
from httpx import Timeout
from typing import Any, List, Dict
from dotenv import load_dotenv
import os
import datetime
import uuid
import warnings

# Suppress SSL warnings since we're using verify=False
warnings.filterwarnings("ignore", message="Unverified HTTPS request")
VALIDATE_SSL = False

# Load environment variables
load_dotenv()

RELEASE_NAME = os.environ.get("RELEASE_NAME", "local")

# Configure logging
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

logger = logging.getLogger("product-catalog-api")

# Constants
if RELEASE_NAME == "local":
    API_URL = "https://localhost/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4"
else:
    API_URL = f"http://{RELEASE_NAME}-prodcatapi:8080/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4"
logger.info(f"API URL: {API_URL}")


async def get_catalog(
    catalog_id: str = None, fields: str = None, offset: int = None, limit: int = None
) -> dict[str, Any] | None:
    """Query the catalog resource in the TM Forum Product Catalog Management API.

    Args:
        catalog_id: Optional ID of a specific catalog to retrieve
        fields: Optional comma-separated list of field names to include in the response
        offset: Optional offset for pagination
        limit: Optional limit for pagination

    Returns:
        Dict containing the response data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

    # Construct the URL based on whether we're getting a specific catalog or listing catalogs
    base_url = f"{API_URL}/catalog"

    if catalog_id:
        url = f"{base_url}/{catalog_id}"
        logger.info(f"Getting catalog with ID: {catalog_id}")
    else:
        url = base_url
        logger.info("Listing catalogs")

    # Add query parameters if provided
    params = {}
    if fields:
        params["fields"] = fields
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit

    if params:
        logger.info(f"With parameters: {params}")

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending GET request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.get(url, headers=headers, params=params)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 200:
                    try:
                        response_json = response.json()
                        logger.info("Response received successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def create_catalog(catalog_data: dict[str, Any]) -> dict[str, Any] | None:
    """Create a new catalog in the TM Forum Product Catalog Management API.

    Args:
        catalog_data: Dictionary containing the catalog data according to the TMF620 specification

    Returns:
        Dict containing the created catalog data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info("Creating a new catalog")

    url = f"{API_URL}/catalog"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending POST request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {catalog_data}")

                response = await client.post(url, headers=headers, json=catalog_data)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 201:
                    try:
                        response_json = response.json()
                        logger.info("Catalog created successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def update_catalog(
    catalog_id: str, catalog_data: dict[str, Any]
) -> dict[str, Any] | None:
    """Update an existing catalog in the TM Forum Product Catalog Management API using PATCH.

    Args:
        catalog_id: ID of the catalog to update
        catalog_data: Dictionary containing the catalog data to update according to the TMF620 specification

    Returns:
        Dict containing the updated catalog data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Updating catalog with ID: {catalog_id}")

    url = f"{API_URL}/catalog/{catalog_id}"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending PATCH request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {catalog_data}")

                response = await client.patch(url, headers=headers, json=catalog_data)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code in (200, 201, 202, 204):
                    try:
                        response_json = response.json()
                        logger.info("Catalog updated successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def delete_catalog(catalog_id: str) -> bool:
    """Delete a catalog from the TM Forum Product Catalog Management API.

    Args:
        catalog_id: ID of the catalog to delete

    Returns:
        True if deletion was successful, False otherwise

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Deleting catalog with ID: {catalog_id}")

    url = f"{API_URL}/catalog/{catalog_id}"

    headers = {
        "Accept": "application/json;charset=utf-8"
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending DELETE request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.delete(url, headers=headers)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 204:
                    logger.info("Catalog deleted successfully")
                    return True
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return False

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return False
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return False
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return False

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return False


async def get_category(
    category_id: str = None, fields: str = None, offset: int = None, limit: int = None
) -> dict[str, Any] | None:
    """Query the category resource in the TM Forum Product Catalog Management API.

    Args:
        category_id: Optional ID of a specific category to retrieve
        fields: Optional comma-separated list of field names to include in the response
        offset: Optional offset for pagination
        limit: Optional limit for pagination

    Returns:
        Dict containing the response data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

    # Construct the URL based on whether we're getting a specific category or listing categories
    base_url = f"{API_URL}/category"

    if category_id:
        url = f"{base_url}/{category_id}"
        logger.info(f"Getting category with ID: {category_id}")
    else:
        url = base_url
        logger.info("Listing categories")

    # Add query parameters if provided
    params = {}
    if fields:
        params["fields"] = fields
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit

    if params:
        logger.info(f"With parameters: {params}")

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending GET request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.get(url, headers=headers, params=params)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 200:
                    try:
                        response_json = response.json()
                        logger.info("Response received successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def create_category(category_data: dict[str, Any]) -> dict[str, Any] | None:
    """Create a new category in the TM Forum Product Catalog Management API.

    Args:
        category_data: Dictionary containing the category data according to the TMF620 specification

    Returns:
        Dict containing the created category data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info("Creating a new category")

    url = f"{API_URL}/category"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending POST request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {category_data}")

                response = await client.post(url, headers=headers, json=category_data)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 201:
                    try:
                        response_json = response.json()
                        logger.info("Category created successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def update_category(
    category_id: str, category_data: dict[str, Any]
) -> dict[str, Any] | None:
    """Update an existing category in the TM Forum Product Catalog Management API using PATCH.

    Args:
        category_id: ID of the category to update
        category_data: Dictionary containing the category data to update according to the TMF620 specification

    Returns:
        Dict containing the updated category data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Updating category with ID: {category_id}")

    url = f"{API_URL}/category/{category_id}"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending PATCH request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {category_data}")

                response = await client.patch(url, headers=headers, json=category_data)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code in (200, 201, 202, 204):
                    try:
                        response_json = response.json()
                        logger.info("Category updated successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def delete_category(category_id: str) -> bool:
    """Delete a category from the TM Forum Product Catalog Management API.

    Args:
        category_id: ID of the category to delete

    Returns:
        True if deletion was successful, False otherwise

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Deleting category with ID: {category_id}")

    url = f"{API_URL}/category/{category_id}"

    headers = {
        "Accept": "application/json;charset=utf-8"
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending DELETE request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.delete(url, headers=headers)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 204:
                    logger.info("Category deleted successfully")
                    return True
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return False

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return False
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return False
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return False

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return False


async def get_product_specification(
    product_specification_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
) -> dict[str, Any] | None:
    """Query the productSpecification resource in the TM Forum Product Catalog Management API.

    Args:
        product_specification_id: Optional ID of a specific productSpecification to retrieve
        fields: Optional comma-separated list of field names to include in the response
        offset: Optional offset for pagination
        limit: Optional limit for pagination

    Returns:
        Dict containing the response data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

    # Construct the URL based on whether we're getting a specific productSpecification or listing productSpecifications
    base_url = f"{API_URL}/productSpecification"

    if product_specification_id:
        url = f"{base_url}/{product_specification_id}"
        logger.info(f"Getting productSpecification with ID: {product_specification_id}")
    else:
        url = base_url
        logger.info("Listing productSpecifications")

    # Add query parameters if provided
    params = {}
    if fields:
        params["fields"] = fields
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit

    if params:
        logger.info(f"With parameters: {params}")

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending GET request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.get(url, headers=headers, params=params)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 200:
                    try:
                        response_json = response.json()
                        logger.info("Response received successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def create_product_specification(
    product_specification_data: dict[str, Any],
) -> dict[str, Any] | None:
    """Create a new productSpecification in the TM Forum Product Catalog Management API.

    Args:
        product_specification_data: Dictionary containing the productSpecification data according to the TMF620 specification

    Returns:
        Dict containing the created productSpecification data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info("Creating a new productSpecification")

    url = f"{API_URL}/productSpecification"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending POST request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {product_specification_data}")

                response = await client.post(
                    url, headers=headers, json=product_specification_data
                )
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 201:
                    try:
                        response_json = response.json()
                        logger.info("ProductSpecification created successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def update_product_specification(
    product_specification_id: str, product_specification_data: dict[str, Any]
) -> dict[str, Any] | None:
    """Update an existing productSpecification in the TM Forum Product Catalog Management API using PATCH.

    Args:
        product_specification_id: ID of the productSpecification to update
        product_specification_data: Dictionary containing the productSpecification data to update according to the TMF620 specification

    Returns:
        Dict containing the updated productSpecification data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Updating productSpecification with ID: {product_specification_id}")

    url = f"{API_URL}/productSpecification/{product_specification_id}"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending PATCH request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {product_specification_data}")

                response = await client.patch(
                    url, headers=headers, json=product_specification_data
                )
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code in (200, 201, 202, 204):
                    try:
                        response_json = response.json()
                        logger.info("ProductSpecification updated successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def delete_product_specification(product_specification_id: str) -> bool:
    """Delete a productSpecification from the TM Forum Product Catalog Management API.

    Args:
        product_specification_id: ID of the productSpecification to delete

    Returns:
        True if deletion was successful, False otherwise

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Deleting productSpecification with ID: {product_specification_id}")

    url = f"{API_URL}/productSpecification/{product_specification_id}"

    headers = {
        "Accept": "application/json;charset=utf-8"
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending DELETE request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.delete(url, headers=headers)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 204:
                    logger.info("ProductSpecification deleted successfully")
                    return True
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return False

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return False
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return False
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return False

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return False


async def get_product_offering(
    product_offering_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
) -> dict[str, Any] | None:
    """Query the productOffering resource in the TM Forum Product Catalog Management API.

    Args:
        product_offering_id: Optional ID of a specific productOffering to retrieve
        fields: Optional comma-separated list of field names to include in the response
        offset: Optional offset for pagination
        limit: Optional limit for pagination

    Returns:
        Dict containing the response data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

    # Construct the URL based on whether we're getting a specific productOffering or listing productOfferings
    base_url = f"{API_URL}/productOffering"

    if product_offering_id:
        url = f"{base_url}/{product_offering_id}"
        logger.info(f"Getting productOffering with ID: {product_offering_id}")
    else:
        url = base_url
        logger.info("Listing productOfferings")

    # Add query parameters if provided
    params = {}
    if fields:
        params["fields"] = fields
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit

    if params:
        logger.info(f"With parameters: {params}")

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending GET request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.get(url, headers=headers, params=params)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 200:
                    try:
                        response_json = response.json()
                        logger.info("Response received successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def create_product_offering(
    product_offering_data: dict[str, Any],
) -> dict[str, Any] | None:
    """Create a new productOffering in the TM Forum Product Catalog Management API.

    Args:
        product_offering_data: Dictionary containing the productOffering data according to the TMF620 specification

    Returns:
        Dict containing the created productOffering data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info("Creating a new productOffering")

    url = f"{API_URL}/productOffering"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending POST request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {product_offering_data}")

                response = await client.post(
                    url, headers=headers, json=product_offering_data
                )
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 201:
                    try:
                        response_json = response.json()
                        logger.info("ProductOffering created successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def update_product_offering(
    product_offering_id: str, product_offering_data: dict[str, Any]
) -> dict[str, Any] | None:
    """Update an existing productOffering in the TM Forum Product Catalog Management API using PATCH.

    Args:
        product_offering_id: ID of the productOffering to update
        product_offering_data: Dictionary containing the productOffering data to update according to the TMF620 specification

    Returns:
        Dict containing the updated productOffering data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Updating productOffering with ID: {product_offering_id}")

    url = f"{API_URL}/productOffering/{product_offering_id}"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending PATCH request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {product_offering_data}")

                response = await client.patch(
                    url, headers=headers, json=product_offering_data
                )
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code in (200, 201, 202, 204):
                    try:
                        response_json = response.json()
                        logger.info("ProductOffering updated successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def delete_product_offering(product_offering_id: str) -> bool:
    """Delete a productOffering from the TM Forum Product Catalog Management API.

    Args:
        product_offering_id: ID of the productOffering to delete

    Returns:
        True if deletion was successful, False otherwise

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Deleting productOffering with ID: {product_offering_id}")

    url = f"{API_URL}/productOffering/{product_offering_id}"

    headers = {
        "Accept": "application/json;charset=utf-8"
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending DELETE request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.delete(url, headers=headers)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 204:
                    logger.info("ProductOffering deleted successfully")
                    return True
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return False

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return False
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return False
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return False

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return False


async def get_product_offering_price(
    product_offering_price_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
) -> dict[str, Any] | None:
    """Query the productOfferingPrice resource in the TM Forum Product Catalog Management API.

        Args:
            product_offering_price_id: Optional ID of a specific productOfferingPrice to retrieve
            fields: Optional comma-separated list of field names to include in the response
            offset: Optional offset for pagination
            limit: Optional limit for pagination

        Returns:
            Dict containing the response data or None if an error occurred
    6
        Raises:
            Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")

    # Construct the URL based on whether we're getting a specific productOfferingPrice or listing productOfferingPrices
    base_url = f"{API_URL}/productOfferingPrice"

    if product_offering_price_id:
        url = f"{base_url}/{product_offering_price_id}"
        logger.info(
            f"Getting productOfferingPrice with ID: {product_offering_price_id}"
        )
    else:
        url = base_url
        logger.info("Listing productOfferingPrices")

    # Add query parameters if provided
    params = {}
    if fields:
        params["fields"] = fields
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit

    if params:
        logger.info(f"With parameters: {params}")

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending GET request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.get(url, headers=headers, params=params)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 200:
                    try:
                        response_json = response.json()
                        logger.info("Response received successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def create_product_offering_price(
    product_offering_price_data: dict[str, Any],
) -> dict[str, Any] | None:
    """Create a new productOfferingPrice in the TM Forum Product Catalog Management API.

    Args:
        product_offering_price_data: Dictionary containing the productOfferingPrice data according to the TMF620 specification

    Returns:
        Dict containing the created productOfferingPrice data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info("Creating a new productOfferingPrice")

    url = f"{API_URL}/productOfferingPrice"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending POST request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {product_offering_price_data}")

                response = await client.post(
                    url, headers=headers, json=product_offering_price_data
                )
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 201:
                    try:
                        response_json = response.json()
                        logger.info("ProductOfferingPrice created successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def update_product_offering_price(
    product_offering_price_id: str, product_offering_price_data: dict[str, Any]
) -> dict[str, Any] | None:
    """Update an existing productOfferingPrice in the TM Forum Product Catalog Management API using PATCH.

    Args:
        product_offering_price_id: ID of the productOfferingPrice to update
        product_offering_price_data: Dictionary containing the productOfferingPrice data to update according to the TMF620 specification

    Returns:
        Dict containing the updated productOfferingPrice data or None if an error occurred

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Updating productOfferingPrice with ID: {product_offering_price_id}")

    url = f"{API_URL}/productOfferingPrice/{product_offering_price_id}"

    headers = {
        "Content-Type": "application/json;charset=utf-8",
        "Accept": "application/json;charset=utf-8",
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending PATCH request to: {url}")
                logger.info(f"Headers: {headers}")
                logger.info(f"Data: {product_offering_price_data}")

                response = await client.patch(
                    url, headers=headers, json=product_offering_price_data
                )
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code in (200, 201, 202, 204):
                    try:
                        response_json = response.json()
                        logger.info("ProductOfferingPrice updated successfully")
                        return response_json
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to decode JSON response: {e}")
                        return None
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return None

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return None
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return None
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return None

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return None


async def delete_product_offering_price(product_offering_price_id: str) -> bool:
    """Delete a productOfferingPrice from the TM Forum Product Catalog Management API.

    Args:
        product_offering_price_id: ID of the productOfferingPrice to delete

    Returns:
        True if deletion was successful, False otherwise

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Deleting productOfferingPrice with ID: {product_offering_price_id}")

    url = f"{API_URL}/productOfferingPrice/{product_offering_price_id}"

    headers = {
        "Accept": "application/json;charset=utf-8"
    }  # Configure timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )

    # Make the request
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info(f"Sending DELETE request to: {url}")
                logger.info(f"Headers: {headers}")

                response = await client.delete(url, headers=headers)
                logger.info(f"Response status: {response.status_code}")
                response.raise_for_status()

                if response.status_code == 204:
                    logger.info("ProductOfferingPrice deleted successfully")
                    return True
                else:
                    logger.warning(f"Unexpected status code: {response.status_code}")
                    return False

            except httpx.TimeoutException as e:
                logger.error(
                    f"Timeout Error: Request timed out after {timeout.read} seconds"
                )
                return False
            except httpx.HTTPStatusError as e:
                logger.error(
                    f"HTTP Status Error: {e.response.status_code} - {e.response.text}"
                )
                return False
            except httpx.HTTPError as e:
                logger.error(f"HTTP Error: {e}")
                return False

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.exception("Stack trace:")
        return False


async def get_access_token() -> str:
    """Placeholder for getting an access token for authenticated API calls.
    Currently returns a dummy token since authentication is not required.

    Returns:
        A dummy access token string
    """
    return "dummy-token"


async def main():
    """Main function to demonstrate creating a catalog and category using example payloads."""
    try:
        # Catalog Demo
        logger.info("Starting catalog creation demo")

        # Load the example catalog payload
        catalog_example_path = Path("example_payloads/catalog.json")

        if not catalog_example_path.exists():
            logger.error(f"Example file not found: {catalog_example_path}")
            return

        logger.info(f"Loading example payload from {catalog_example_path}")
        with open(catalog_example_path, "r") as f:
            catalog_data = json.load(f)

        logger.info("Example catalog data loaded successfully")
        logger.info(f"Catalog data: {catalog_data}")

        # Category Demo
        logger.info("Starting category creation demo")

        # Load the example category payload
        category_example_path = Path("example_payloads/category.json")

        if not category_example_path.exists():
            logger.error(f"Example file not found: {category_example_path}")
            return

        logger.info(f"Loading example payload from {category_example_path}")
        with open(category_example_path, "r") as f:
            category_data = json.load(f)

        logger.info("Example category data loaded successfully")
        logger.info(f"Category data: {category_data}")

        # ProductSpecification Demo
        logger.info("Starting productSpecification creation demo")

        # Load the example productSpecification payload
        product_spec_example_path = Path("example_payloads/productSpecification.json")

        if not product_spec_example_path.exists():
            logger.error(f"Example file not found: {product_spec_example_path}")
            return

        logger.info(f"Loading example payload from {product_spec_example_path}")
        with open(product_spec_example_path, "r") as f:
            product_spec_data = json.load(f)

        logger.info("Example productSpecification data loaded successfully")
        logger.info(f"ProductSpecification data: {product_spec_data}")

        # Create the catalog
        logger.info("Creating catalog...")
        new_catalog = await create_catalog(catalog_data)

        if new_catalog:
            logger.info("Catalog created successfully!")
            logger.info(f"New catalog: {json.dumps(new_catalog, indent=2)}")

            # Get the newly created catalog
            if "id" in new_catalog:
                catalog_id = new_catalog["id"]
                logger.info(f"Retrieving created catalog with ID: {catalog_id}")
                retrieved_catalog = await get_catalog(catalog_id=catalog_id)

                if retrieved_catalog:
                    logger.info("Catalog retrieved successfully!")
                    logger.info(
                        f"Retrieved catalog: {json.dumps(retrieved_catalog, indent=2)}"
                    )
                else:
                    logger.error("Failed to retrieve the catalog")
            else:
                logger.warning("Created catalog does not have an ID")
        else:
            logger.error("Failed to create catalog")

        # Create the category
        logger.info("Creating category...")
        new_category = await create_category(category_data)

        if new_category:
            logger.info("Category created successfully!")
            logger.info(f"New category: {json.dumps(new_category, indent=2)}")

            # Get the newly created category
            if "id" in new_category:
                category_id = new_category["id"]
                logger.info(f"Retrieving created category with ID: {category_id}")
                retrieved_category = await get_category(category_id=category_id)

                if retrieved_category:
                    logger.info("Category retrieved successfully!")
                    logger.info(
                        f"Retrieved category: {json.dumps(retrieved_category, indent=2)}"
                    )

                    # Update the category
                    logger.info("Updating category...")
                    update_data = {
                        "description": "Updated description for cloud service category"
                    }
                    updated_category = await update_category(category_id, update_data)

                    if updated_category:
                        logger.info("Category updated successfully!")
                        logger.info(
                            f"Updated category: {json.dumps(updated_category, indent=2)}"
                        )

                        # Delete the category
                        logger.info("Deleting category...")
                        deleted = await delete_category(category_id)

                        if deleted:
                            logger.info(f"Category {category_id} deleted successfully!")
                        else:
                            logger.error(f"Failed to delete category {category_id}")
                    else:
                        logger.error("Failed to update the category")
                else:
                    logger.error("Failed to retrieve the category")
            else:
                logger.warning("Created category does not have an ID")
        else:
            logger.error("Failed to create category")

        # ProductSpecification Demo
        logger.info("Creating productSpecification...")
        new_product_spec = await create_product_specification(product_spec_data)

        if new_product_spec:
            logger.info("ProductSpecification created successfully!")
            logger.info(
                f"New productSpecification: {json.dumps(new_product_spec, indent=2)}"
            )

            # Get the newly created productSpecification
            if "id" in new_product_spec:
                product_spec_id = new_product_spec["id"]
                logger.info(
                    f"Retrieving created productSpecification with ID: {product_spec_id}"
                )
                retrieved_product_spec = await get_product_specification(
                    product_specification_id=product_spec_id
                )

                if retrieved_product_spec:
                    logger.info("ProductSpecification retrieved successfully!")
                    logger.info(
                        f"Retrieved productSpecification: {json.dumps(retrieved_product_spec, indent=2)}"
                    )

                    # Update the productSpecification
                    logger.info("Updating productSpecification...")
                    update_data = {
                        "description": "Updated description for Cisco Firepower NGFW"
                    }
                    updated_product_spec = await update_product_specification(
                        product_spec_id, update_data
                    )

                    if updated_product_spec:
                        logger.info("ProductSpecification updated successfully!")
                        logger.info(
                            f"Updated productSpecification: {json.dumps(updated_product_spec, indent=2)}"
                        )

                        # Delete the productSpecification
                        logger.info("Deleting productSpecification...")
                        deleted = await delete_product_specification(product_spec_id)

                        if deleted:
                            logger.info(
                                f"ProductSpecification {product_spec_id} deleted successfully!"
                            )
                        else:
                            logger.error(
                                f"Failed to delete productSpecification {product_spec_id}"
                            )
                    else:
                        logger.error("Failed to update the productSpecification")
                else:
                    logger.error("Failed to retrieve the productSpecification")
            else:
                logger.warning("Created productSpecification does not have an ID")
        else:
            logger.error("Failed to create productSpecification")

        # ProductOffering Demo
        logger.info("Starting productOffering creation demo")

        # Load the example productOffering payload
        product_offering_example_path = Path("example_payloads/productOffering.json")

        if not product_offering_example_path.exists():
            logger.error(f"Example file not found: {product_offering_example_path}")
            return

        logger.info(f"Loading example payload from {product_offering_example_path}")
        with open(product_offering_example_path, "r") as f:
            product_offering_data = json.load(f)

        logger.info("Example productOffering data loaded successfully")
        logger.info(f"ProductOffering data: {product_offering_data}")

        # Create the productOffering
        logger.info("Creating productOffering...")
        new_product_offering = await create_product_offering(product_offering_data)

        if new_product_offering:
            logger.info("ProductOffering created successfully!")
            logger.info(
                f"New productOffering: {json.dumps(new_product_offering, indent=2)}"
            )

            # Get the newly created productOffering
            if "id" in new_product_offering:
                product_offering_id = new_product_offering["id"]
                logger.info(
                    f"Retrieving created productOffering with ID: {product_offering_id}"
                )
                retrieved_product_offering = await get_product_offering(
                    product_offering_id=product_offering_id
                )

                if retrieved_product_offering:
                    logger.info("ProductOffering retrieved successfully!")
                    logger.info(
                        f"Retrieved productOffering: {json.dumps(retrieved_product_offering, indent=2)}"
                    )

                    # Update the productOffering
                    logger.info("Updating productOffering...")
                    update_data = {
                        "description": "Updated description for Basic Firewall for Business"
                    }
                    updated_product_offering = await update_product_offering(
                        product_offering_id, update_data
                    )

                    if updated_product_offering:
                        logger.info("ProductOffering updated successfully!")
                        logger.info(
                            f"Updated productOffering: {json.dumps(updated_product_offering, indent=2)}"
                        )

                        # Delete the productOffering
                        logger.info("Deleting productOffering...")
                        deleted = await delete_product_offering(product_offering_id)

                        if deleted:
                            logger.info(
                                f"ProductOffering {product_offering_id} deleted successfully!"
                            )
                        else:
                            logger.error(
                                f"Failed to delete productOffering {product_offering_id}"
                            )
                    else:
                        logger.error("Failed to update the productOffering")
                else:
                    logger.error("Failed to retrieve the productOffering")
            else:
                logger.warning("Created productOffering does not have an ID")
        else:
            logger.error("Failed to create productOffering")

        # ProductOfferingPrice Demo
        logger.info("Starting productOfferingPrice creation demo")

        # Load the example productOfferingPrice payload
        product_offering_price_example_path = Path(
            "example_payloads/productOfferingPrice.json"
        )

        if not product_offering_price_example_path.exists():
            logger.error(
                f"Example file not found: {product_offering_price_example_path}"
            )
            return

        logger.info(
            f"Loading example payload from {product_offering_price_example_path}"
        )
        with open(product_offering_price_example_path, "r") as f:
            product_offering_price_data = json.load(f)

        logger.info("Example productOfferingPrice data loaded successfully")
        logger.info(f"ProductOfferingPrice data: {product_offering_price_data}")

        # Create the productOfferingPrice
        logger.info("Creating productOfferingPrice...")
        new_product_offering_price = await create_product_offering_price(
            product_offering_price_data
        )

        if new_product_offering_price:
            logger.info("ProductOfferingPrice created successfully!")
            logger.info(
                f"New productOfferingPrice: {json.dumps(new_product_offering_price, indent=2)}"
            )

            # Get the newly created productOfferingPrice
            if "id" in new_product_offering_price:
                product_offering_price_id = new_product_offering_price["id"]
                logger.info(
                    f"Retrieving created productOfferingPrice with ID: {product_offering_price_id}"
                )
                retrieved_product_offering_price = await get_product_offering_price(
                    product_offering_price_id=product_offering_price_id
                )

                if retrieved_product_offering_price:
                    logger.info("ProductOfferingPrice retrieved successfully!")
                    logger.info(
                        f"Retrieved productOfferingPrice: {json.dumps(retrieved_product_offering_price, indent=2)}"
                    )

                    # Update the productOfferingPrice
                    logger.info("Updating productOfferingPrice...")
                    update_data = {
                        "description": "Updated description for Firewall Service Price"
                    }
                    updated_product_offering_price = (
                        await update_product_offering_price(
                            product_offering_price_id, update_data
                        )
                    )

                    if updated_product_offering_price:
                        logger.info("ProductOfferingPrice updated successfully!")
                        logger.info(
                            f"Updated productOfferingPrice: {json.dumps(updated_product_offering_price, indent=2)}"
                        )

                        # Delete the productOfferingPrice
                        logger.info("Deleting productOfferingPrice...")
                        deleted = await delete_product_offering_price(
                            product_offering_price_id
                        )

                        if deleted:
                            logger.info(
                                f"ProductOfferingPrice {product_offering_price_id} deleted successfully!"
                            )
                        else:
                            logger.error(
                                f"Failed to delete productOfferingPrice {product_offering_price_id}"
                            )
                    else:
                        logger.error("Failed to update the productOfferingPrice")
                else:
                    logger.error("Failed to retrieve the productOfferingPrice")
            else:
                logger.warning("Created productOfferingPrice does not have an ID")
        else:
            logger.error("Failed to create productOfferingPrice")

    except Exception as e:
        logger.error(f"Error in main function: {e}")
        logger.exception("Stack trace:")


if __name__ == "__main__":
    # Configure logging to file and console
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=[
            logging.FileHandler("product_catalog_api.log"),
            logging.StreamHandler(),
        ],
    )

    # Run the main function
    import asyncio

    asyncio.run(main())
