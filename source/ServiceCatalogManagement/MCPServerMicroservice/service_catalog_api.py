# Service Catalog API module for making requests to Service Catalog Component
import logging
from pathlib import Path
import json
import httpx
from httpx import Timeout
from typing import Any, List, Dict
from dotenv import load_dotenv
import os
import warnings

# Suppress SSL warnings since we're using verify=False
warnings.filterwarnings("ignore", message="Unverified HTTPS request")
VALIDATE_SSL = False

# Load environment variables
load_dotenv()

RELEASE_NAME = os.environ.get("RELEASE_NAME", "local")
COMPONENT_NAME = os.environ.get("COMPONENT_NAME", "r1-servicecatalogmanagement")

# Configure logging
log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)
logger = logging.getLogger("service-catalog-api")

# Constants
if RELEASE_NAME == "local":
    API_URL = f"https://localhost/{COMPONENT_NAME}/tmf-api/serviceCatalogManagement/v4"
else:
    API_URL = f"http://{RELEASE_NAME}-svcatapi:8080/{COMPONENT_NAME}/tmf-api/serviceCatalogManagement/v4"
logger.info(f"API URL: {API_URL}")

TIMEOUT = Timeout(30.0, connect=5.0)


async def _get(path: str, params: dict = None) -> Any:
    async with httpx.AsyncClient(verify=VALIDATE_SSL, timeout=TIMEOUT) as client:
        try:
            resp = await client.get(f"{API_URL}{path}", params=params)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"GET {path} failed: {e}")
            return None


async def _post(path: str, data: dict) -> Any:
    async with httpx.AsyncClient(verify=VALIDATE_SSL, timeout=TIMEOUT) as client:
        try:
            resp = await client.post(f"{API_URL}{path}", json=data)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"POST {path} failed: {e}")
            return {"error": {"status": e.response.status_code, "detail": e.response.text}}
        except Exception as e:
            logger.error(f"POST {path} failed: {e}")
            return None


async def _patch(path: str, data: dict) -> Any:
    async with httpx.AsyncClient(verify=VALIDATE_SSL, timeout=TIMEOUT) as client:
        try:
            resp = await client.patch(f"{API_URL}{path}", json=data)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            logger.error(f"PATCH {path} failed: {e}")
            return {"error": {"status": e.response.status_code, "detail": e.response.text}}
        except Exception as e:
            logger.error(f"PATCH {path} failed: {e}")
            return None


async def _delete(path: str) -> Any:
    async with httpx.AsyncClient(verify=VALIDATE_SSL, timeout=TIMEOUT) as client:
        try:
            resp = await client.delete(f"{API_URL}{path}")
            resp.raise_for_status()
            return {"status": "deleted"}
        except httpx.HTTPStatusError as e:
            logger.error(f"DELETE {path} failed: {e}")
            return {"error": {"status": e.response.status_code, "detail": e.response.text}}
        except Exception as e:
            logger.error(f"DELETE {path} failed: {e}")
            return None


def _build_params(fields=None, offset=None, limit=None, filter=None):
    params = {}
    if fields:
        params["fields"] = fields
    if offset is not None:
        params["offset"] = offset
    if limit is not None:
        params["limit"] = limit
    if filter:
        params.update(filter)
    return params


# ServiceCatalog CRUD
async def get_service_catalog(catalog_id=None, fields=None, offset=None, limit=None, filter=None):
    params = _build_params(fields, offset, limit, filter)
    path = f"/serviceCatalog/{catalog_id}" if catalog_id else "/serviceCatalog"
    return await _get(path, params)


async def create_service_catalog(data: dict):
    return await _post("/serviceCatalog", data)


async def update_service_catalog(catalog_id: str, data: dict):
    return await _patch(f"/serviceCatalog/{catalog_id}", data)


async def delete_service_catalog(catalog_id: str):
    return await _delete(f"/serviceCatalog/{catalog_id}")


# ServiceCategory CRUD
async def get_service_category(category_id=None, fields=None, offset=None, limit=None, filter=None):
    params = _build_params(fields, offset, limit, filter)
    path = f"/serviceCategory/{category_id}" if category_id else "/serviceCategory"
    return await _get(path, params)


async def create_service_category(data: dict):
    return await _post("/serviceCategory", data)


async def update_service_category(category_id: str, data: dict):
    return await _patch(f"/serviceCategory/{category_id}", data)


async def delete_service_category(category_id: str):
    return await _delete(f"/serviceCategory/{category_id}")


# ServiceCandidate CRUD
async def get_service_candidate(candidate_id=None, fields=None, offset=None, limit=None, filter=None):
    params = _build_params(fields, offset, limit, filter)
    path = f"/serviceCandidate/{candidate_id}" if candidate_id else "/serviceCandidate"
    return await _get(path, params)


async def create_service_candidate(data: dict):
    return await _post("/serviceCandidate", data)


async def update_service_candidate(candidate_id: str, data: dict):
    return await _patch(f"/serviceCandidate/{candidate_id}", data)


async def delete_service_candidate(candidate_id: str):
    return await _delete(f"/serviceCandidate/{candidate_id}")


# ServiceSpecification CRUD
async def get_service_specification(spec_id=None, fields=None, offset=None, limit=None, filter=None):
    params = _build_params(fields, offset, limit, filter)
    path = f"/serviceSpecification/{spec_id}" if spec_id else "/serviceSpecification"
    return await _get(path, params)


async def create_service_specification(data: dict):
    return await _post("/serviceSpecification", data)


async def update_service_specification(spec_id: str, data: dict):
    return await _patch(f"/serviceSpecification/{spec_id}", data)


async def delete_service_specification(spec_id: str):
    return await _delete(f"/serviceSpecification/{spec_id}")
