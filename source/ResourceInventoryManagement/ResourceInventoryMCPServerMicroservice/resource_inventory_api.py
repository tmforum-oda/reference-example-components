"""Async client for the TMF639 Resource Inventory API."""

from __future__ import annotations

import os
from typing import Any

import httpx


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class ResourceInventoryAPIError(RuntimeError):
    """A safe, protocol-neutral representation of a downstream API failure."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class ResourceInventoryAPI:
    """Owns the HTTP connection pool used by the Resource Inventory MCP server."""

    def __init__(
        self,
        base_url: str | None = None,
        *,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        self.base_url = (
            base_url
            or os.getenv("RESOURCE_INVENTORY_API_URL")
            or "http://localhost:8080/tmf-api/resourceInventoryManagement/v4"
        ).rstrip("/")
        self._owns_client = client is None
        self.client = client or httpx.AsyncClient(
            timeout=httpx.Timeout(
                float(os.getenv("API_REQUEST_TIMEOUT_SECONDS", "30")),
                connect=float(os.getenv("API_CONNECT_TIMEOUT_SECONDS", "10")),
            ),
            limits=httpx.Limits(max_keepalive_connections=5, max_connections=10),
            verify=_env_bool("VERIFY_SSL", True),
            headers={
                "Accept": "application/json",
                "Content-Type": "application/json",
            },
        )

    async def close(self) -> None:
        if self._owns_client:
            await self.client.aclose()

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        payload: dict[str, Any] | None = None,
    ) -> Any:
        try:
            response = await self.client.request(
                method,
                f"{self.base_url}{path}",
                params=params,
                json=payload,
            )
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text.strip()[:500] or exc.response.reason_phrase
            raise ResourceInventoryAPIError(
                f"Resource Inventory API returned HTTP {exc.response.status_code}: {detail}",
                exc.response.status_code,
            ) from exc
        except httpx.HTTPError as exc:
            raise ResourceInventoryAPIError(
                f"Resource Inventory API request failed: {type(exc).__name__}"
            ) from exc

        if response.status_code == 204 or not response.content:
            return {"success": True}
        try:
            return response.json()
        except ValueError as exc:
            raise ResourceInventoryAPIError(
                "Resource Inventory API returned a non-JSON response",
                response.status_code,
            ) from exc

    async def get_resource(
        self,
        resource_id: str | None = None,
        *,
        workshop_id: str | None = None,
        resource_name: str | None = None,
        resource_type: str | None = None,
        location_id: str | None = None,
        resource_status: str | None = None,
        offset: int | None = None,
        limit: int | None = None,
    ) -> Any:
        if resource_id and any(
            value is not None
            for value in (
                workshop_id,
                resource_name,
                resource_type,
                location_id,
                resource_status,
                offset,
                limit,
            )
        ):
            raise ResourceInventoryAPIError(
                "resource_id cannot be combined with list filters or pagination"
            )

        path = f"/resource/{resource_id}" if resource_id else "/resource"
        params: dict[str, Any] = {}
        if workshop_id:
            params["resourceCharacteristic.name"] = "workshopId"
            params["resourceCharacteristic.value"] = workshop_id
        if resource_name:
            params["name"] = resource_name
        if resource_type:
            params["category"] = resource_type
        if location_id:
            params["place.id"] = location_id
        if resource_status:
            params["resourceStatus"] = resource_status
        if offset is not None:
            params["offset"] = offset
        if limit is not None:
            params["limit"] = limit
        return await self._request("GET", path, params=params or None)

    async def create_resource(self, resource_data: dict[str, Any]) -> Any:
        return await self._request("POST", "/resource", payload=resource_data)

    async def update_resource(
        self, resource_id: str, resource_data: dict[str, Any]
    ) -> Any:
        return await self._request(
            "PATCH", f"/resource/{resource_id}", payload=resource_data
        )

    async def delete_resource(self, resource_id: str) -> Any:
        return await self._request("DELETE", f"/resource/{resource_id}")
