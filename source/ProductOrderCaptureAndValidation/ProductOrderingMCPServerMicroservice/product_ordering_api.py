"""Async client for the TMF622 Product Ordering API."""
from __future__ import annotations
import os
from typing import Any
import httpx


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    return default if value is None else value.strip().lower() in {"1", "true", "yes", "on"}


class ProductOrderingAPIError(RuntimeError):
    """Safe representation of a downstream API failure."""

    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


class ProductOrderingAPI:
    def __init__(self, base_url: str | None = None, *, client: httpx.AsyncClient | None = None) -> None:
        self.base_url = (base_url or os.getenv("PRODUCT_ORDERING_API_URL") or "http://localhost:8080/tmf-api/productOrderingManagement/v4").rstrip("/")
        self._owns_client = client is None
        self.client = client or httpx.AsyncClient(timeout=httpx.Timeout(float(os.getenv("API_REQUEST_TIMEOUT_SECONDS", "30")), connect=float(os.getenv("API_CONNECT_TIMEOUT_SECONDS", "10"))), limits=httpx.Limits(max_keepalive_connections=5, max_connections=10), verify=_env_bool("VERIFY_SSL", True), headers={"Accept": "application/json", "Content-Type": "application/json"})

    async def close(self) -> None:
        if self._owns_client:
            await self.client.aclose()

    async def _request(self, method: str, resource: str, resource_id: str | None = None, *, params: dict[str, Any] | None = None, payload: dict[str, Any] | None = None) -> Any:
        path = f"/{resource}/{resource_id}" if resource_id else f"/{resource}"
        try:
            response = await self.client.request(method, f"{self.base_url}{path}", params=params, json=payload)
            response.raise_for_status()
        except httpx.HTTPStatusError as exc:
            detail = exc.response.text.strip()[:500] or exc.response.reason_phrase
            raise ProductOrderingAPIError(
                f"Product Ordering API returned HTTP {exc.response.status_code}: {detail}",
                exc.response.status_code,
            ) from exc
        except httpx.HTTPError as exc:
            raise ProductOrderingAPIError(f"Product Ordering API request failed: {type(exc).__name__}") from exc
        if response.status_code == 204 or not response.content:
            return {"success": True}
        try:
            return response.json()
        except ValueError as exc:
            raise ProductOrderingAPIError("Product Ordering API returned a non-JSON response") from exc

    async def get(
        self,
        resource: str,
        resource_id: str | None = None,
        *,
        external_id: str | None = None,
        state: str | None = None,
        offset: int | None = None,
        limit: int | None = None,
    ) -> Any:
        if resource_id and any(
            value is not None
            for value in (external_id, state, offset, limit)
        ):
            raise ProductOrderingAPIError(
                "order ID cannot be combined with list filters or pagination"
            )
        params: dict[str, Any] = {}
        if external_id:
            params["externalId"] = external_id
        if state:
            params["state"] = state
        if offset is not None:
            params["offset"] = offset
        if limit is not None:
            params["limit"] = limit
        return await self._request("GET", resource, resource_id, params=params or None)

    async def create(self, resource: str, data: dict[str, Any]) -> Any:
        return await self._request("POST", resource, payload=data)

    async def update(self, resource: str, resource_id: str, data: dict[str, Any]) -> Any:
        return await self._request("PATCH", resource, resource_id, payload=data)

    async def delete(self, resource: str, resource_id: str) -> Any:
        return await self._request("DELETE", resource, resource_id)
