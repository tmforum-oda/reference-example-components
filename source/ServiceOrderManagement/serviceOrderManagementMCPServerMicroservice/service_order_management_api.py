# Service Order Management API module for making requests to the Service Order Management Component
import logging
from pathlib import Path
import json
import httpx
from httpx import Timeout
from typing import Any, Dict, List, Optional
from dotenv import load_dotenv
import os
import warnings

warnings.filterwarnings("ignore", message="Unverified HTTPS request")
VALIDATE_SSL = False

load_dotenv()

RELEASE_NAME = os.environ.get("RELEASE_NAME", "local")

log_dir = Path("logs")
log_dir.mkdir(exist_ok=True)

logger = logging.getLogger("service-order-management-api")

if RELEASE_NAME == "local":
    API_URL = "https://localhost/r1-serviceordermanagement/tmf-api/serviceOrdering/v4"
else:
    API_URL = f"http://{RELEASE_NAME}-serviceorderapi:8080/{RELEASE_NAME}-serviceordermanagement/tmf-api/serviceOrdering/v4"
logger.info(f"API URL: {API_URL}")

TIMEOUT = Timeout(connect=10.0, read=30.0, write=10.0, pool=5.0)
HEADERS = {
    "Content-Type": "application/json;charset=utf-8",
    "Accept": "application/json;charset=utf-8",
}
LIMITS = httpx.Limits(max_keepalive_connections=5, max_connections=10)


async def _get(url: str, params: dict = None) -> Any:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, limits=LIMITS, verify=VALIDATE_SSL) as client:
            response = await client.get(url, headers=HEADERS, params=params or {})
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"GET {url} failed: {e}")
        return None


async def _post(url: str, data: dict) -> Any:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, limits=LIMITS, verify=VALIDATE_SSL) as client:
            response = await client.post(url, headers=HEADERS, json=data)
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        logger.error(f"POST {url} HTTP error: {e.response.status_code} - {e.response.text}")
        return {"error": {"status": e.response.status_code, "detail": e.response.text}}
    except Exception as e:
        logger.error(f"POST {url} failed: {e}")
        return None


async def _patch(url: str, data: dict) -> Any:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, limits=LIMITS, verify=VALIDATE_SSL) as client:
            response = await client.patch(url, headers=HEADERS, json=data)
            response.raise_for_status()
            return response.json()
    except Exception as e:
        logger.error(f"PATCH {url} failed: {e}")
        return None


async def _delete(url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, limits=LIMITS, verify=VALIDATE_SSL) as client:
            response = await client.delete(url, headers=HEADERS)
            response.raise_for_status()
            return True
    except Exception as e:
        logger.error(f"DELETE {url} failed: {e}")
        return None


# ---------------------------------------------------------------------------
# ServiceOrder
# ---------------------------------------------------------------------------

async def get_service_order(
    service_order_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> Any:
    base_url = f"{API_URL}/serviceOrder"
    url = f"{base_url}/{service_order_id}" if service_order_id else base_url
    params = {}
    if fields: params["fields"] = fields
    if offset is not None: params["offset"] = offset
    if limit is not None: params["limit"] = limit
    if filter:
        params.update(filter)
    return await _get(url, params)


async def create_service_order(data: dict) -> Any:
    return await _post(f"{API_URL}/serviceOrder", data)


async def update_service_order(service_order_id: str, data: dict) -> Any:
    return await _patch(f"{API_URL}/serviceOrder/{service_order_id}", data)


async def delete_service_order(service_order_id: str) -> Any:
    return await _delete(f"{API_URL}/serviceOrder/{service_order_id}")


# ---------------------------------------------------------------------------
# CancelServiceOrder
# ---------------------------------------------------------------------------

async def get_cancel_service_order(
    cancel_order_id: str = None,
    fields: str = None,
    offset: int = None,
    limit: int = None,
    filter: dict = None,
) -> Any:
    base_url = f"{API_URL}/cancelServiceOrder"
    url = f"{base_url}/{cancel_order_id}" if cancel_order_id else base_url
    params = {}
    if fields: params["fields"] = fields
    if offset is not None: params["offset"] = offset
    if limit is not None: params["limit"] = limit
    if filter:
        params.update(filter)
    return await _get(url, params)


async def create_cancel_service_order(data: dict) -> Any:
    return await _post(f"{API_URL}/cancelServiceOrder", data)
