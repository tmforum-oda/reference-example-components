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

# Configure logging
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

logger = logging.getLogger("product-catalog-api")

# Constants
API_URL = os.getenv("API_URL")


async def query_product_catalog_api(query: str) -> dict[str, Any] | None:
    """Make an async request to TM Forum Product Catalog API.

    Args:
        query: The query string to send to Product Catalog

    Returns:
        Dict containing the response data or error information

    Raises:
        Various httpx exceptions are caught and logged
    """
    logger.info("+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
    logger.info(f"Querying Product Catalog with: {query}")

    try:
        token = get_access_token()
    except Exception as e:
        logger.error(f"Failed to get access token: {e}")
        return None

    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {"input": {"input": query}}

    # Configure longer timeouts (in seconds)
    timeout = Timeout(
        connect=10.0,  # connection timeout
        read=30.0,  # read timeout
        write=10.0,  # write timeout
        pool=5.0,  # pool timeout
    )  # Configure client with timeout and limits
    try:
        async with httpx.AsyncClient(
            timeout=timeout,
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=VALIDATE_SSL,  # SSL certificate verification
        ) as client:
            try:
                logger.info("Sending request to Product Catalog API")
                logger.info(f"Headers: {headers}")
                logger.info(f"Payload: {payload}")
                logger.info(
                    "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
                )
                logger.info(f"API URL: {API_URL}")
                logger.info(
                    "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
                )
                response = await client.post(API_URL, headers=headers, json=payload)
                logger.info(f"response: {response}")
                logger.info(
                    "+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++"
                )
                response.raise_for_status()

                if response.status_code == 200:
                    try:
                        response_json = response.json()
                        logger.info("Response received successfully")

                        output = response_json.get("output", {}).get("output")
                        if output:
                            logger.info(f"Product Catalog Response: {output}")

                        else:
                            logger.warning("No output found in response")

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

                if response.status_code == 200:
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

    url = f"{API_URL}/{catalog_id}"

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


async def get_access_token() -> str:
    """Placeholder for getting an access token for authenticated API calls.
    Currently returns a dummy token since authentication is not required.

    Returns:
        A dummy access token string
    """
    return "dummy-token"


async def main():
    """Main function to demonstrate creating a catalog using the example payload."""
    try:
        logger.info("Starting catalog creation demo")

        # Load the example catalog payload
        example_path = Path("example_payloads/catalog.json")

        if not example_path.exists():
            logger.error(f"Example file not found: {example_path}")
            return

        logger.info(f"Loading example payload from {example_path}")
        with open(example_path, "r") as f:
            catalog_data = json.load(f)

        logger.info("Example catalog data loaded successfully")
        logger.info(f"Catalog data: {catalog_data}")

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
