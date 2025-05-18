#!/usr/bin/env python3
# Test script for product_catalog_api.py
# This script tests all functions in the product_catalog_api.py module and can load test data
# The test connects to a TMF620 API at https://localhost/r1-productcatalogmanagement/tmf-api/productCatalogManagement/v4
#
# Examples:
#   python test_product_catalog_api.py                        # Run tests only, leave catalog clean
#   python test_product_catalog_api.py --populate             # Run tests, then populate catalog with test data
#   python test_product_catalog_api.py --skip-tests --populate # Skip tests, just populate catalog
#   python test_product_catalog_api.py --skip-tests --clean   # Skip tests, just clean up all resources

import os
import sys
import json
import time
import logging
import asyncio
import argparse
import warnings
import traceback
import re
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

# Import the module to test
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
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

# Create logs directory if it doesn't exist
logs_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "logs")
if not os.path.exists(logs_dir):
    os.makedirs(logs_dir)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(
            os.path.join(
                logs_dir,
                f"product_catalog_api_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log",
            )
        ),
    ],
)
logger = logging.getLogger("product-catalog-api-test")

# Print script header
script_description = """
#################################################################
#                                                               #
#               Product Catalog API Test Script                 #
#                                                               #
#  This script provides comprehensive testing and data loading  #
#  capabilities for the TMF620 Product Catalog Management API   #
#                                                               #
#  Usage:                                                       #
#    --populate    : Load test data from test_payloads after    #
#                   running tests                               #
#    --skip-tests  : Skip CRUD tests and just perform the       #
#                   specified action (populate or clean)        #
#    --clean       : Clean up all resources after execution     #
#                   (overrides --populate)                      #
#                                                               #
#################################################################
"""

# Suppress SSL warnings
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

# Test data paths
test_data_dir = os.path.join(
    os.path.dirname(os.path.abspath(__file__)), "test_payloads"
)


# Test helper functions
async def load_json_file(filename: str) -> dict:
    """Load a JSON file from the test_payloads directory."""
    filepath = os.path.join(test_data_dir, filename)
    try:
        with open(filepath, "r") as f:
            data = json.load(f)
            # Make sure all href properties start with the correct base URL
            data = update_hrefs_in_data(data)
            return data
    except Exception as e:
        logger.error(f"Error loading {filepath}: {str(e)}")
        return {}


def update_hrefs_in_data(data):
    """
    Update all href properties in data to start with the base URL if they don't already.
    """
    BASE_URL = "https://localhost/r1-productcatalogmanagement/tmf-api"

    def _update_hrefs(obj):
        if isinstance(obj, dict):
            for key, value in obj.items():
                if key == "href" and isinstance(value, str) and value.startswith("/"):
                    obj[key] = f"{BASE_URL}{value}"
                elif isinstance(value, (dict, list)):
                    _update_hrefs(value)
        elif isinstance(obj, list):
            for item in obj:
                if isinstance(item, (dict, list)):
                    _update_hrefs(item)
        return obj

    return _update_hrefs(data)


def create_entity_reference(entity_type, entity_id, entity_name):
    """
    Create a properly formatted entity reference with correctly formed href URL.

    Args:
        entity_type: Type of entity (e.g., "ProductOffering", "ProductOfferingPrice", "Category", "ProductSpecification")
        entity_id: The entity ID
        entity_name: The entity name

    Returns:
        Dict containing a properly formatted entity reference with id, href, name, and referredType
    """
    BASE_URL = "https://localhost/r1-productcatalogmanagement/tmf-api"

    # Map entity types to their API path segments
    type_to_path = {
        "ProductOffering": "productOffering",
        "ProductOfferingPrice": "productOfferingPrice",
        "Category": "category",
        "ProductSpecification": "productSpecification",
        "Catalog": "catalog",
    }

    path_segment = type_to_path.get(entity_type, entity_type.lower())
    href = f"{BASE_URL}/productCatalogManagement/v4/{path_segment}/{entity_id}"

    return {
        "id": entity_id,
        "href": href,
        "name": entity_name,
        "@referredType": entity_type,
    }


async def load_all_test_data() -> Dict[str, List[Dict]]:
    """
    Load all test data from the test_payloads directory, organized by entity type.

    Returns:
        Dict with keys 'catalogs', 'categories', 'productSpecifications',
        'productOfferings', and 'productOfferingPrices', each containing a list of
        corresponding entities.
    """
    logger.info("Loading all test data from test_payloads directory...")

    # Initialize result dictionary
    all_data = {
        "catalogs": [],
        "categories": [],
        "productSpecifications": [],
        "productOfferings": [],
        "productOfferingPrices": [],
    }

    # Get all JSON files in the test_payloads directory
    test_files = [f for f in os.listdir(test_data_dir) if f.endswith(".json")]

    # Regular expressions to match file naming patterns
    catalog_pattern = re.compile(r".*_catalog\.json$")
    category_pattern = re.compile(r".*_category\.json$")
    spec_pattern = re.compile(r".*_spec\.json$")
    offering_pattern = re.compile(r".*_offering\.json$")
    price_pattern = re.compile(r".*_price\.json$")

    # Load each file and categorize based on filename pattern
    for filename in test_files:
        data = await load_json_file(filename)
        if not data:
            continue

        if catalog_pattern.match(filename):
            all_data["catalogs"].append(data)
        elif category_pattern.match(filename):
            all_data["categories"].append(data)
        elif spec_pattern.match(filename):
            all_data["productSpecifications"].append(data)
        elif offering_pattern.match(filename):
            all_data["productOfferings"].append(data)
        elif price_pattern.match(filename):
            all_data["productOfferingPrices"].append(data)

    # Log summary of loaded data
    logger.info(f"Loaded {len(all_data['catalogs'])} catalogs")
    logger.info(f"Loaded {len(all_data['categories'])} categories")
    logger.info(
        f"Loaded {len(all_data['productSpecifications'])} product specifications"
    )
    logger.info(f"Loaded {len(all_data['productOfferings'])} product offerings")
    logger.info(
        f"Loaded {len(all_data['productOfferingPrices'])} product offering prices"
    )

    return all_data


async def cleanup_all_resources():
    """Delete all existing resources from the product catalog."""
    logger.info("Starting cleanup of all resources...")

    # Clean up product offering prices
    logger.info("Cleaning up product offering prices...")
    prices = await get_product_offering_price()
    if prices and not isinstance(prices, dict):
        for price in prices:
            price_id = price.get("id")
            if price_id:
                logger.info(f"Deleting product offering price with ID: {price_id}")
                await delete_product_offering_price(price_id)
                await asyncio.sleep(0.1)  # Small delay to avoid overwhelming the API

    # Clean up product offerings
    logger.info("Cleaning up product offerings...")
    offerings = await get_product_offering()
    if offerings and not isinstance(offerings, dict):
        for offering in offerings:
            offering_id = offering.get("id")
            if offering_id:
                logger.info(f"Deleting product offering with ID: {offering_id}")
                await delete_product_offering(offering_id)
                await asyncio.sleep(0.1)

    # Clean up product specifications
    logger.info("Cleaning up product specifications...")
    specs = await get_product_specification()
    if specs and not isinstance(specs, dict):
        for spec in specs:
            spec_id = spec.get("id")
            if spec_id:
                logger.info(f"Deleting product specification with ID: {spec_id}")
                await delete_product_specification(spec_id)
                await asyncio.sleep(0.1)

    # Clean up categories
    logger.info("Cleaning up categories...")
    categories = await get_category()
    if categories and not isinstance(categories, dict):
        for category in categories:
            category_id = category.get("id")
            if category_id:
                logger.info(f"Deleting category with ID: {category_id}")
                await delete_category(category_id)
                await asyncio.sleep(0.1)

    # Clean up catalogs
    logger.info("Cleaning up catalogs...")
    catalogs = await get_catalog()
    if catalogs and not isinstance(catalogs, dict):
        for catalog in catalogs:
            catalog_id = catalog.get("id")
            if catalog_id:
                logger.info(f"Deleting catalog with ID: {catalog_id}")
                await delete_catalog(catalog_id)
                await asyncio.sleep(0.1)

    logger.info("Cleanup completed")


async def populate_all_test_data() -> Tuple[bool, Dict[str, Dict[str, str]]]:
    """
    Populate the catalog with all test data from the test_payloads directory.

    Returns:
        Tuple containing:
        - Boolean indicating success/failure
        - Dictionary with created resource IDs organized by resource type and name
    """
    logger.info("Populating catalog with all test data...")

    # Load all test data
    all_data = await load_all_test_data()

    # Track all created resources by their names
    created_resources = {
        "catalogs": {},
        "categories": {},
        "productSpecifications": {},
        "productOfferings": {},
        "productOfferingPrices": {},
    }

    try:
        # Step 1: Create catalogs
        logger.info("Creating catalogs...")
        for catalog_data in all_data["catalogs"]:
            name = catalog_data.get("name", "Unnamed catalog")
            created_catalog = await create_catalog(catalog_data)
            if "error" in created_catalog:
                logger.error(
                    f"Failed to create catalog '{name}': {created_catalog['error']}"
                )
                return False, created_resources
            created_resources["catalogs"][name] = created_catalog.get("id")
            logger.info(
                f"Created catalog '{name}' with ID: {created_catalog.get('id')}"
            )
            await asyncio.sleep(0.1)

        # Step 2: Create categories
        logger.info("Creating categories...")
        for category_data in all_data["categories"]:
            name = category_data.get("name", "Unnamed category")
            created_category = await create_category(category_data)
            if "error" in created_category:
                logger.error(
                    f"Failed to create category '{name}': {created_category['error']}"
                )
                return False, created_resources
            created_resources["categories"][name] = created_category.get("id")
            logger.info(
                f"Created category '{name}' with ID: {created_category.get('id')}"
            )
            await asyncio.sleep(0.1)

        # Step 3: Create product specifications
        logger.info("Creating product specifications...")
        for spec_data in all_data["productSpecifications"]:
            name = spec_data.get("name", "Unnamed specification")
            created_spec = await create_product_specification(spec_data)
            if "error" in created_spec:
                logger.error(
                    f"Failed to create product specification '{name}': {created_spec['error']}"
                )
                return False, created_resources
            created_resources["productSpecifications"][name] = created_spec.get("id")
            logger.info(
                f"Created product specification '{name}' with ID: {created_spec.get('id')}"
            )
            await asyncio.sleep(0.1)

        # Step 4: Create product offerings (update references to specs and categories)
        logger.info("Creating product offerings...")
        for offering_data in all_data["productOfferings"]:
            name = offering_data.get("name", "Unnamed offering")

            # Update product specification reference if present
            if (
                "productSpecification" in offering_data
                and offering_data["productSpecification"]
            ):
                spec_name = offering_data["productSpecification"].get("name", "")
                spec_id = None

                # Find the spec ID by name
                for spec_full_name, spec_id_value in created_resources[
                    "productSpecifications"
                ].items():
                    if spec_name in spec_full_name:
                        spec_id = spec_id_value
                        break

                if spec_id:
                    # Create a proper reference with updated href
                    offering_data["productSpecification"] = create_entity_reference(
                        "ProductSpecification", spec_id, spec_name
                    )

            # Update category references if present
            if "category" in offering_data and offering_data["category"]:
                updated_categories = []
                for i in range(len(offering_data["category"])):
                    cat_name = offering_data["category"][i].get("name", "")
                    cat_id = None

                    # Find the category ID by name
                    for cat_full_name, cat_id_value in created_resources[
                        "categories"
                    ].items():
                        if cat_name in cat_full_name:
                            cat_id = cat_id_value
                            break

                    if cat_id:
                        # Create a proper reference with updated href
                        updated_categories.append(
                            create_entity_reference("Category", cat_id, cat_name)
                        )

                # Replace the category array with updated references
                if updated_categories:
                    offering_data["category"] = updated_categories

            created_offering = await create_product_offering(offering_data)
            if "error" in created_offering:
                logger.error(
                    f"Failed to create product offering '{name}': {created_offering['error']}"
                )
                return False, created_resources
            created_resources["productOfferings"][name] = created_offering.get("id")
            logger.info(
                f"Created product offering '{name}' with ID: {created_offering.get('id')}"
            )
            await asyncio.sleep(
                0.5
            )  # Step 5: Create product offering prices (without reference back to offerings)
        logger.info("Creating product offering prices...")
        # Track mapping of price names to price IDs for later use
        price_name_to_id_map = {}

        for price_data in all_data["productOfferingPrices"]:
            name = price_data.get("name", "Unnamed price")

            # Remove any product offering references from the price data
            # Since we're implementing one-directional references (offering to price)
            if "productOffering" in price_data:
                del price_data["productOffering"]

            created_price = await create_product_offering_price(price_data)
            if "error" in created_price:
                logger.error(
                    f"Failed to create product offering price '{name}': {created_price['error']}"
                )
                return False, created_resources

            price_id = created_price.get("id")
            created_resources["productOfferingPrices"][name] = price_id
            price_name_to_id_map[name] = price_id  # Store for later reference
            logger.info(f"Created product offering price '{name}' with ID: {price_id}")
            await asyncio.sleep(0.1)

        # Step 6: Update product offerings with links to their prices
        logger.info("Updating product offerings with links to their prices...")
        # We need to map which prices belong to which offerings based on naming conventions
        price_pattern = re.compile(r"(.+?)_price\.json$")
        offering_pattern = re.compile(r"(.+?)_offering\.json$")

        # Extract base names from offering files to match with price files
        offering_base_names = {}
        for offering_file in [
            f for f in os.listdir(test_data_dir) if f.endswith("_offering.json")
        ]:
            match = offering_pattern.match(offering_file)
            if match:
                base_name = match.group(1)
                offering_data = await load_json_file(offering_file)
                offering_name = offering_data.get("name", "")
                offering_id = None

                # Find the offering ID by name
                for full_name, id_value in created_resources[
                    "productOfferings"
                ].items():
                    if offering_name in full_name:
                        offering_id = id_value
                        offering_base_names[base_name] = offering_id
                        break

        # Now iterate through price files and find matching offerings
        for price_file in [
            f for f in os.listdir(test_data_dir) if f.endswith("_price.json")
        ]:
            match = price_pattern.match(price_file)
            if match:
                price_base_name = match.group(1)

                # Find matching offering
                offering_id = offering_base_names.get(price_base_name)
                if offering_id:
                    # Get price details
                    price_data = await load_json_file(price_file)
                    price_name = price_data.get("name", "")
                    price_id = None

                    # Find price ID by name
                    for full_name, id_value in created_resources[
                        "productOfferingPrices"
                    ].items():
                        if price_name in full_name:
                            price_id = id_value
                            break

                    if price_id:
                        # Get the current offering to update it
                        current_offering = await get_product_offering(offering_id)
                        if not current_offering:
                            logger.warning(
                                f"Could not retrieve product offering {offering_id} for updating"
                            )
                            continue

                        # Initialize or update productOfferingPrice array
                        if "productOfferingPrice" not in current_offering:
                            current_offering["productOfferingPrice"] = []

                        # Check if the price reference is already there
                        price_already_linked = False
                        for existing_price in current_offering.get(
                            "productOfferingPrice", []
                        ):
                            if existing_price.get("id") == price_id:
                                price_already_linked = True
                                break

                        if not price_already_linked:
                            # Add the price reference to the offering with proper href
                            current_offering["productOfferingPrice"].append(
                                create_entity_reference(
                                    "ProductOfferingPrice", price_id, price_name
                                )
                            )

                            # Update the offering
                            updated_offering = await update_product_offering(
                                offering_id,
                                {
                                    "productOfferingPrice": current_offering[
                                        "productOfferingPrice"
                                    ]
                                },
                            )

                            if "error" in updated_offering:
                                logger.error(
                                    f"Failed to update product offering with price: {updated_offering['error']}"
                                )
                            else:
                                logger.info(
                                    f"Linked price {price_id} to product offering {offering_id}"
                                )

                        await asyncio.sleep(0.1)

        logger.info("Successfully populated catalog with all test data.")
        return True, created_resources

    except Exception as e:
        logger.error(f"Error populating catalog: {str(e)}")
        logger.error(traceback.format_exc())
        return False, created_resources


async def run_catalog_tests():
    """Test catalog CRUD operations."""
    try:
        logger.info("==================== CATALOG TESTS ====================")

        # Test create catalog
        logger.info("Testing create_catalog...")
        wholesale_catalog = await load_json_file("wholesale_catalog.json")
        created_catalog = await create_catalog(wholesale_catalog)
        if "error" in created_catalog:
            logger.error(f"Failed to create catalog: {created_catalog['error']}")
            return False

        catalog_id = created_catalog.get("id")
        logger.info(f"Created catalog with ID: {catalog_id}")

        # Test get catalog
        logger.info("Testing get_catalog...")
        retrieved_catalog = await get_catalog(catalog_id)
        if not retrieved_catalog:
            logger.error("Failed to retrieve catalog")
            return False
        logger.info(f"Successfully retrieved catalog with ID: {catalog_id}")

        # Test update catalog
        logger.info("Testing update_catalog...")
        updated_data = {
            "description": f"Updated description - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }
        updated_catalog = await update_catalog(catalog_id, updated_data)
        if not updated_catalog:
            logger.error("Failed to update catalog")
            return False
        logger.info(f"Successfully updated catalog with ID: {catalog_id}")

        # Test delete catalog (will be done in cleanup)

        return True
    except Exception as e:
        logger.error(f"Error in catalog tests: {str(e)}")
        logger.error(traceback.format_exc())
        return False


async def run_category_tests():
    """Test category CRUD operations."""
    try:
        logger.info("==================== CATEGORY TESTS ====================")

        # Test create category
        logger.info("Testing create_category...")
        category_data = await load_json_file("wholesale_connectivity_category.json")
        created_category = await create_category(category_data)
        if "error" in created_category:
            logger.error(f"Failed to create category: {created_category['error']}")
            return False

        category_id = created_category.get("id")
        logger.info(f"Created category with ID: {category_id}")

        # Test get category
        logger.info("Testing get_category...")
        retrieved_category = await get_category(category_id)
        if not retrieved_category:
            logger.error("Failed to retrieve category")
            return False
        logger.info(f"Successfully retrieved category with ID: {category_id}")

        # Test update category
        logger.info("Testing update_category...")
        updated_data = {
            "description": f"Updated description - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }
        updated_category = await update_category(category_id, updated_data)
        if "error" in updated_category:
            logger.error(f"Failed to update category: {updated_category['error']}")
            return False
        logger.info(f"Successfully updated category with ID: {category_id}")

        # Test delete category (will be done in cleanup)

        return True
    except Exception as e:
        logger.error(f"Error in category tests: {str(e)}")
        logger.error(traceback.format_exc())
        return False


async def run_product_specification_tests():
    """Test product specification CRUD operations."""
    try:
        logger.info(
            "==================== PRODUCT SPECIFICATION TESTS ===================="
        )

        # Test create product specification
        logger.info("Testing create_product_specification...")
        spec_data = await load_json_file("wholesale_fiber_backbone_spec.json")
        created_spec = await create_product_specification(spec_data)
        if "error" in created_spec:
            logger.error(
                f"Failed to create product specification: {created_spec['error']}"
            )
            return False

        spec_id = created_spec.get("id")
        logger.info(f"Created product specification with ID: {spec_id}")

        # Test get product specification
        logger.info("Testing get_product_specification...")
        retrieved_spec = await get_product_specification(spec_id)
        if not retrieved_spec:
            logger.error("Failed to retrieve product specification")
            return False
        logger.info(f"Successfully retrieved product specification with ID: {spec_id}")

        # Test update product specification
        logger.info("Testing update_product_specification...")
        updated_data = {
            "description": f"Updated description - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }
        updated_spec = await update_product_specification(spec_id, updated_data)
        if not updated_spec:
            logger.error("Failed to update product specification")
            return False
        logger.info(f"Successfully updated product specification with ID: {spec_id}")

        # Test delete product specification (will be done in cleanup)

        return True
    except Exception as e:
        logger.error(f"Error in product specification tests: {str(e)}")
        logger.error(traceback.format_exc())
        return False


async def run_product_offering_tests():
    """Test product offering CRUD operations."""
    try:
        logger.info("==================== PRODUCT OFFERING TESTS ====================")

        # First, create a product specification to reference
        logger.info("Creating a product specification for reference...")
        spec_data = await load_json_file("wholesale_metro_ethernet_spec.json")
        created_spec = await create_product_specification(spec_data)
        if "error" in created_spec:
            logger.error(
                f"Failed to create product specification: {created_spec['error']}"
            )
            return False

        spec_id = created_spec.get("id")

        # Now create a category to reference
        logger.info("Creating a category for reference...")
        category_data = await load_json_file("wholesale_connectivity_category.json")
        created_category = await create_category(category_data)
        if "error" in created_category:
            logger.error(f"Failed to create category: {created_category['error']}")
            return False

        category_id = created_category.get(
            "id"
        )  # Load product offering data and update references
        logger.info("Testing create_product_offering...")
        offering_data = await load_json_file("wholesale_metro_eline_offering.json")

        # Update references with actual IDs and proper hrefs
        if "productSpecification" in offering_data:
            spec_name = offering_data["productSpecification"].get("name", "")
            offering_data["productSpecification"] = create_entity_reference(
                "ProductSpecification", spec_id, spec_name
            )

        if "category" in offering_data and offering_data["category"]:
            updated_categories = []
            for category_ref in offering_data["category"]:
                cat_name = category_ref.get("name", "")
                updated_categories.append(
                    create_entity_reference("Category", category_id, cat_name)
                )
            offering_data["category"] = updated_categories

        created_offering = await create_product_offering(offering_data)
        if "error" in created_offering:
            logger.error(
                f"Failed to create product offering: {created_offering['error']}"
            )
            return False

        offering_id = created_offering.get("id")
        logger.info(f"Created product offering with ID: {offering_id}")

        # Test get product offering
        logger.info("Testing get_product_offering...")
        retrieved_offering = await get_product_offering(offering_id)
        if not retrieved_offering:
            logger.error("Failed to retrieve product offering")
            return False
        logger.info(f"Successfully retrieved product offering with ID: {offering_id}")

        # Test update product offering
        logger.info("Testing update_product_offering...")
        updated_data = {
            "description": f"Updated description - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }
        updated_offering = await update_product_offering(offering_id, updated_data)
        if not updated_offering:
            logger.error("Failed to update product offering")
            return False
        logger.info(f"Successfully updated product offering with ID: {offering_id}")

        # Test delete product offering (will be done in cleanup)

        return True
    except Exception as e:
        logger.error(f"Error in product offering tests: {str(e)}")
        logger.error(traceback.format_exc())
        return False


async def run_product_offering_price_tests():
    """Test product offering price CRUD operations."""
    try:
        logger.info(
            "==================== PRODUCT OFFERING PRICE TESTS ===================="
        )

        # First, create a product offering
        # Create product specification
        spec_data = await load_json_file("enterprise_mpls_spec.json")
        created_spec = await create_product_specification(spec_data)
        spec_id = created_spec.get("id")

        # Create category
        category_data = await load_json_file("enterprise_networking_category.json")
        created_category = await create_category(category_data)
        category_id = created_category.get("id")

        # Create product offering
        offering_data = await load_json_file(
            "enterprise_mpls_gold_offering.json"
        )  # Update references with actual IDs and proper hrefs
        if "productSpecification" in offering_data:
            spec_name = offering_data["productSpecification"].get("name", "")
            offering_data["productSpecification"] = create_entity_reference(
                "ProductSpecification", spec_id, spec_name
            )

        if "category" in offering_data and offering_data["category"]:
            updated_categories = []
            for category_ref in offering_data["category"]:
                cat_name = category_ref.get("name", "")
                updated_categories.append(
                    create_entity_reference("Category", category_id, cat_name)
                )
            offering_data["category"] = updated_categories

        created_offering = await create_product_offering(offering_data)
        offering_id = created_offering.get("id")

        # Now test product offering price operations (without referring back to offering)
        logger.info("Testing create_product_offering_price...")
        price_data = await load_json_file("enterprise_mpls_gold_price.json")

        # Remove any product offering references as we're using one-directional references
        if "productOffering" in price_data:
            del price_data["productOffering"]

        created_price = await create_product_offering_price(price_data)
        if "error" in created_price:
            logger.error(
                f"Failed to create product offering price: {created_price['error']}"
            )
            return False

        price_id = created_price.get("id")
        logger.info(f"Created product offering price with ID: {price_id}")

        # Test get product offering price
        logger.info("Testing get_product_offering_price...")
        retrieved_price = await get_product_offering_price(price_id)
        if not retrieved_price:
            logger.error("Failed to retrieve product offering price")
            return False
        logger.info(
            f"Successfully retrieved product offering price with ID: {price_id}"
        )

        # Test update product offering price
        logger.info("Testing update_product_offering_price...")
        updated_data = {
            "description": f"Updated description - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
        }
        updated_price = await update_product_offering_price(price_id, updated_data)
        if not updated_price:
            logger.error("Failed to update product offering price")
            return False
        logger.info(f"Successfully updated product offering price with ID: {price_id}")

        # Update the product offering to reference this price (one-directional link)
        logger.info("Testing linking product offering to price...")
        current_offering = await get_product_offering(offering_id)
        if not current_offering:
            logger.error(
                f"Could not retrieve product offering {offering_id} for updating"
            )
            return False  # Initialize productOfferingPrice array if not present
        if "productOfferingPrice" not in current_offering:
            current_offering["productOfferingPrice"] = []

        # Add the price reference to the offering with proper href
        current_offering["productOfferingPrice"].append(
            create_entity_reference(
                "ProductOfferingPrice", price_id, retrieved_price.get("name", "")
            )
        )

        # Update the offering with price reference
        updated_offering = await update_product_offering(
            offering_id,
            {"productOfferingPrice": current_offering["productOfferingPrice"]},
        )

        if "error" in updated_offering:
            logger.error(
                f"Failed to update product offering with price: {updated_offering['error']}"
            )
            return False
        logger.info(
            f"Successfully linked price {price_id} to product offering {offering_id}"
        )

        # Test delete product offering price (will be done in cleanup)

        return True
    except Exception as e:
        logger.error(f"Error in product offering price tests: {str(e)}")
        logger.error(traceback.format_exc())
        return False


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description="Test and populate the Product Catalog API."
    )

    parser.add_argument(
        "--populate",
        action="store_true",
        help="Populate the catalog with all test data after running tests",
    )

    parser.add_argument(
        "--skip-tests",
        action="store_true",
        help="Skip running CRUD tests and only perform the specified action (populate or clean)",
    )

    parser.add_argument(
        "--clean",
        action="store_true",
        help="Clean up all resources after execution (overrides --populate)",
    )

    return parser.parse_args()


async def main():
    """Main function to run all tests."""
    print(script_description)
    logger.info("Starting Product Catalog API Test")
    logger.info("=========================================================")

    # Parse command line arguments
    args = parse_args()

    try:
        # First, clean up all existing resources
        logger.info("Performing initial cleanup to ensure a clean testing state...")
        await cleanup_all_resources()

        # Run CRUD tests if not skipped
        if not args.skip_tests:
            logger.info("Running CRUD tests for all resource types...")

            catalog_result = False
            category_result = False
            product_spec_result = False
            product_offering_result = False
            product_offering_price_result = False

            # Run tests for each resource type
            catalog_result = await run_catalog_tests()
            category_result = await run_category_tests()
            product_spec_result = await run_product_specification_tests()
            product_offering_result = await run_product_offering_tests()
            product_offering_price_result = await run_product_offering_price_tests()

            # Report test results
            logger.info("=========================================================")
            logger.info("TEST RESULTS SUMMARY:")
            logger.info(f"Catalog Tests: {'PASSED' if catalog_result else 'FAILED'}")
            logger.info(f"Category Tests: {'PASSED' if category_result else 'FAILED'}")
            logger.info(
                f"Product Specification Tests: {'PASSED' if product_spec_result else 'FAILED'}"
            )
            logger.info(
                f"Product Offering Tests: {'PASSED' if product_offering_result else 'FAILED'}"
            )
            logger.info(
                f"Product Offering Price Tests: {'PASSED' if product_offering_price_result else 'FAILED'}"
            )

            # Clean up resources after tests
            logger.info("=========================================================")
            logger.info("Cleaning up resources after tests...")
            await cleanup_all_resources()

        # Handle post-test actions (populate or clean)
        if args.populate and not args.clean:
            logger.info("=========================================================")
            logger.info("Populating catalog with all test data...")
            success, created_resources = await populate_all_test_data()

            if success:
                logger.info("Successfully populated catalog with test data.")
                logger.info("Summary of created resources:")

                for resource_type, resources in created_resources.items():
                    if resources:
                        logger.info(
                            f"  {resource_type.capitalize()}: {len(resources)} created"
                        )
                        for name, id in resources.items():
                            logger.info(f"    - '{name}' (ID: {id})")
            else:
                logger.error("Failed to populate catalog with all test data.")
        elif args.clean:
            logger.info("=========================================================")
            logger.info("Performing final cleanup as requested...")
            await cleanup_all_resources()
        else:
            logger.info("No post-test actions specified. Catalog left clean.")

    except Exception as e:
        logger.error(f"Unexpected error in main test execution: {str(e)}")
        logger.error(traceback.format_exc())

    logger.info("=========================================================")
    logger.info("Product Catalog API Test Completed")


if __name__ == "__main__":
    asyncio.run(main())
