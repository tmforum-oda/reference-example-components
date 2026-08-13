"""Async client for the TMF638 Service Inventory API."""

from __future__ import annotations

import os
from typing import Any

import httpx


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    return default if value is None else value.strip().lower() in {"1", "true", "yes", "on"}


class ServiceInventoryAPIError(RuntimeError):
    """Safe representation of a downstream API failure."""


class ServiceInventoryAPI:
    """Own the HTTP connection pool used by the Service Inventory MCP server."""

    def __init__(self, base_url: str | None = None, *, client: httpx.AsyncClient | None = None) -> None:
        self.base_url = (base_url or os.getenv("SERVICE_INVENTORY_API_URL") or "http://localhost:8080/tmf-api/serviceInventory/v5").rstrip("/")
        self._owns_client = client is None
        self.client = client or httpx.AsyncClient(
            timeout=httpx.Timeout(float(os.getenv("API_REQUEST_TIMEOUT_SECONDS", "30")), connect=float(os.getenv("API_CONNECT_TIMEOUT_SECONDS", "10"))),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=_env_bool("VERIFY_SSL", True),
            headers={"Accept": "application/json", "Content-Type": "application/json"},
        )

    async def close(self) -> None:
        if self._owns_client:
            await self.client.aclose()

    async def _request(self, method: str, path: str, *, params: dict[str, Any] | None = None, payload: dict[str, Any] | None = None) -> Any:
        try:
            response = await self.client.request(method, f"{self.base_url}{path}", params=params, json=payload)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text.strip()[:500] or exc.response.reason_phrase
            raise ServiceInventoryAPIError(f"Service Inventory API returned HTTP {exc.response.status_code}: {detail}") from exc
        except httpx.HTTPError as exc:
            raise ServiceInventoryAPIError(f"Service Inventory API request failed: {type(exc).__name__}") from exc
        if response.status_code == 204 or not response.content:
            return {"success": True}
        try:
            return response.json()
        except ValueError as exc:
            raise ServiceInventoryAPIError("Service Inventory API returned a non-JSON response") from exc

    async def get_service(self, service_id: str | None = None, **query: Any) -> Any:
        path = f"/service/{service_id}" if service_id else "/service"
        params = {key: value for key, value in query.items() if value is not None}
        extra_filter = params.pop("filter", None)
        if extra_filter:
            params.update({key: value for key, value in extra_filter.items() if value is not None})
        return await self._request("GET", path, params=params or None)

    async def create_service(self, data: dict[str, Any]) -> Any:
        return await self._request("POST", "/service", payload=data)

    async def update_service(self, service_id: str, data: dict[str, Any]) -> Any:
        return await self._request("PATCH", f"/service/{service_id}", payload=data)

    async def delete_service(self, service_id: str) -> Any:
        return await self._request("DELETE", f"/service/{service_id}")
